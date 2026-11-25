import { Injectable, Logger, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventsGateway } from '../../gateway/events.gateway';
import { MqttService } from '../../mqtt/mqtt.service';
import { MlClientService } from '../ml-client/ml-client.service';
import { RuleEngineService } from './rule-engine.service';
import { RecommendationService } from '../recommendation/recommendation.service';
import { AutomationService } from '../automation/automation.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { RuleEvaluationContext } from './rules/energy-rules';
import { DeviceAnomalyDto } from '../dto/intelligence.dto';

@Injectable()
export class DecisionEngineService implements OnModuleInit {
  private readonly logger = new Logger('DecisionEngineService');
  private evaluationTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
    private readonly mqttService: MqttService,
    private readonly mlClient: MlClientService,
    private readonly ruleEngine: RuleEngineService,
    private readonly recommendationService: RecommendationService,
    private readonly automationService: AutomationService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {}

  onModuleInit() {
    // 1. Subscribe to MQTT sensor data for real-time reactivity
    this.mqttService.on('message', async ({ topic, message }) => {
      if (topic.includes('/sensor/data')) {
        await this.handleRealtimeTelemetry(topic, message);
      }
    });

    // 2. Schedule periodic evaluation every 60s for batch ML insights & anomaly sweeps
    this.evaluationTimer = setInterval(() => {
      this.evaluateAllRooms().catch(err => {
        this.logger.debug(`Background evaluation tick failed: ${err.message}`);
      });
    }, 60000);

    this.logger.log('🧠 DecisionEngineService initialized & listening to telemetry streams.');
  }

  /**
   * Real-time handler when new sensor/telemetry packet arrives from MQTT
   */
  async handleRealtimeTelemetry(topic: string, data: any) {
    try {
      const parts = topic.split('/');
      const buildingName = parts[1];
      const roomNumber = parts[3];

      let room = await this.prisma.room.findFirst({
        where: { roomNumber, building: { name: buildingName } },
        include: { building: true, devices: true },
      });

      if (!room) return;

      const lightsOn = room.devices.some(d => d.type === 'LIGHT' && d.isOn);
      const fanOn = room.devices.some(d => d.type === 'FAN' && d.isOn);

      const context: RuleEvaluationContext = {
        roomId: room.id,
        buildingId: room.buildingId,
        roomNumber: room.roomNumber,
        buildingName: room.building.name,
        temperature: data.temperature,
        humidity: data.humidity,
        gasLevel: data.gas_level,
        gasAlert: data.gas_alert,
        tempAlert: data.temp_alert,
        powerW: data.powerW !== undefined ? data.powerW : (lightsOn ? 40 : 5) + (fanOn ? 60 : 0),
        motionDetected: Boolean(data.motion_detected || data.occupancySignal),
        occupancyProbability: data.occupancySignal ? 0.85 : 0.1,
        predictedState: data.occupancySignal ? 'OCCUPIED' : 'VACANT',
        lightsOn,
        fanOn,
        hourOfDay: new Date().getHours(),
        dayOfWeek: new Date().getDay(),
      };

      await this.evaluateContextAndDispatch(context);
    } catch (err: any) {
      this.logger.debug(`Real-time telemetry evaluation skipped: ${err.message}`);
    }
  }

  /**
   * Evaluates context against Rule Engine, enforces safety precedence, and dispatches actions/recommendations/alerts
   */
  async evaluateContextAndDispatch(context: RuleEvaluationContext) {
    // 1. Evaluate with Rule Engine (Builtin + DB custom rules)
    const outcomes = await this.ruleEngine.evaluateContext(context);

    for (const outcome of outcomes) {
      if (!outcome.matched) continue;

      // Check SAFETY Precedence: Critical safety actions execute immediately
      if (outcome.severity === 'CRITICAL') {
        this.logger.warn(`🚨 EMERGENCY SAFETY ACTION TRIGGERED for room ${context.roomNumber || context.roomId}: ${outcome.reason}`);
        if (outcome.actionsToExecute && outcome.actionsToExecute.length > 0) {
          await this.automationService.executeActions(
            outcome.actionsToExecute,
            'RULE_ENGINE',
            'system-safety-engine',
            context.roomId,
          );
        }
      }

      // Dispatch AI Recommendation if specified
      if (outcome.recommendation) {
        await this.recommendationService.createRecommendation({
          type: outcome.recommendation.type,
          severity: outcome.severity || 'WARNING',
          title: outcome.recommendation.title,
          description: outcome.recommendation.description,
          location: context.roomId,
          reason: outcome.recommendation.reason,
          recommendation: outcome.recommendation.recommendation,
          confidence: outcome.recommendation.confidence,
          estimatedSavingsKwh: outcome.recommendation.estimatedSavingsKwh,
          actions: outcome.recommendation.actions,
          evidence: outcome.recommendation.evidence,
        });

        // Tự động gửi cảnh báo lãng phí điện tương tác 2 chiều qua Telegram & Email tới sinh viên phòng
        if (outcome.recommendation.type === 'ENERGY') {
          await this.notificationsService.sendEnergyWasteAlert(context.roomId, {
            vacantMinutes: outcome.recommendation.evidence?.vacantMinutes || 25,
            activeDevices: outcome.recommendation.evidence?.activeDevices || ['Đèn chiếu sáng (40W)', 'Quạt thông gió (60W)'],
            estimatedPowerW: outcome.recommendation.evidence?.powerW || 105,
            estimatedLossKwh: outcome.recommendation.estimatedSavingsKwh || 0.85,
            estimatedCostVnd: outcome.recommendation.evidence?.estimatedCostVnd || 1920,
            reason: outcome.recommendation.reason,
          }).catch(e => this.logger.debug(`Energy waste alert dispatch skipped: ${e.message}`));
        }
      }
    }
  }

  /**
   * Periodic batch evaluation: sweeps all rooms, queries ML models for anomalies & occupancy
   */
  async evaluateAllRooms() {
    const rooms = await this.prisma.room.findMany({
      where: { isActive: true },
      include: {
        building: true,
        devices: true,
        sensorData: {
          orderBy: { recordedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (rooms.length === 0) return;

    // 1. Evaluate device anomalies across all rooms
    const allDevicesForAnomaly = rooms.flatMap(r =>
      r.devices.map(d => ({
        id: d.id,
        name: d.name,
        type: d.type,
        roomId: r.id,
        roomNumber: r.roomNumber,
        buildingName: r.building.name,
        powerW: d.isOn ? (d.type === 'FAN' ? 65 : d.type === 'LIGHT' ? 22 : 1200) : 0,
        uptimeHours: d.isOn ? 14 : 0,
        failureRate: 0.02,
        temperature: r.sensorData[0]?.temperature || 28,
        responseMs: 45,
      })),
    );

    if (allDevicesForAnomaly.length > 0) {
      const anomalies = await this.mlClient.detectAnomalies(allDevicesForAnomaly);
      for (const anom of anomalies) {
        if (anom.anomalyScore >= 0.7) {
          await this.saveAndBroadcastAnomaly(anom);
        }
      }
    }

    // 2. Predict occupancy for rooms
    const roomsForOccupancy = rooms.map(r => {
      const latestSensor = r.sensorData[0];
      const activeDevices = r.devices.filter(d => d.isOn);
      return {
        id: r.id,
        roomNumber: r.roomNumber,
        buildingName: r.building.name,
        floor: r.floor,
        motionDetected: Boolean(latestSensor?.motionDetected),
        powerW: activeDevices.length * 35.0,
        activeDevicesCount: activeDevices.length,
        temperature: latestSensor?.temperature || 28.0,
        gasLevel: latestSensor?.gasLevel || 40.0,
      };
    });

    const occupancyResults = await this.mlClient.predictOccupancy(roomsForOccupancy);

    // 3. For each room, run context evaluation
    for (const room of rooms) {
      const latestSensor = room.sensorData[0];
      const occPred = occupancyResults.find(o => o.roomId === room.id);
      const activeDevices = room.devices.filter(d => d.isOn);
      const lightsOn = room.devices.some(d => d.type === 'LIGHT' && d.isOn);
      const fanOn = room.devices.some(d => d.type === 'FAN' && d.isOn);

      const context: RuleEvaluationContext = {
        roomId: room.id,
        buildingId: room.buildingId,
        roomNumber: room.roomNumber,
        buildingName: room.building.name,
        temperature: latestSensor?.temperature || 28.0,
        humidity: latestSensor?.humidity || 65.0,
        gasLevel: latestSensor?.gasLevel || 35.0,
        gasAlert: latestSensor?.gasAlert || false,
        tempAlert: latestSensor?.tempAlert || false,
        powerW: activeDevices.length * 30.0 + 5.0,
        motionDetected: Boolean(latestSensor?.motionDetected),
        occupancyProbability: occPred?.occupiedProbability || 0.1,
        predictedState: occPred?.predictedState || 'VACANT',
        vacantMinutes: occPred?.predictedState === 'VACANT' ? 20 : 0,
        lightsOn,
        fanOn,
        hourOfDay: new Date().getHours(),
        dayOfWeek: new Date().getDay(),
      };

      await this.evaluateContextAndDispatch(context);
    }
  }

  /**
   * Save anomaly to database and broadcast via WebSocket
   */
  async saveAndBroadcastAnomaly(anomaly: DeviceAnomalyDto) {
    // Avoid spamming duplicate open anomalies for the same device
    const oneHourAgo = new Date(Date.now() - 3600 * 1000);
    const existing = await this.prisma.deviceAnomaly.findFirst({
      where: {
        deviceId: anomaly.deviceId || undefined,
        status: 'OPEN',
        detectedAt: { gte: oneHourAgo },
      },
    });

    if (existing) return;

    const saved = await this.prisma.deviceAnomaly.create({
      data: {
        deviceId: anomaly.deviceId || null,
        deviceName: anomaly.deviceName,
        roomId: anomaly.roomId,
        anomalyScore: anomaly.anomalyScore,
        severity: anomaly.severity,
        features: JSON.stringify(anomaly.features || {}),
        status: 'OPEN',
        recommendation: anomaly.recommendation || null,
        detectedAt: new Date(),
      },
    });

    const broadcastPayload = {
      ...anomaly,
      id: saved.id,
    };

    this.eventsGateway.broadcastAiAnomaly(broadcastPayload);

    // Also auto-generate maintenance recommendation
    await this.recommendationService.createRecommendation({
      type: 'MAINTENANCE',
      severity: anomaly.severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
      title: `Cảnh báo thiết bị: ${anomaly.deviceName}`,
      description: anomaly.recommendation || `Chỉ số bất thường phát hiện trên thiết bị ${anomaly.deviceName}.`,
      location: anomaly.roomId,
      reason: `Mô hình Isolation Forest phát hiện điểm bất thường ${(anomaly.anomalyScore * 100).toFixed(0)}%.`,
      recommendation: anomaly.recommendation || 'Kiểm tra bảo dưỡng thiết bị.',
      confidence: anomaly.anomalyScore,
      evidence: anomaly.features,
      actions: [{ type: 'NOTIFY_ADMIN', roomId: anomaly.roomId }],
    });
  }
}
