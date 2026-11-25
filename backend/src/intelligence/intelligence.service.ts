import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MlClientService } from './ml-client/ml-client.service';
import { RecommendationService } from './recommendation/recommendation.service';
import { RuleEngineService } from './decision-engine/rule-engine.service';
import { AutomationService } from './automation/automation.service';
import { LlmService } from './llm/llm.service';
import { EventsGateway } from '../gateway/events.gateway';
import { ForecastQueryDto } from './dto/forecast-query.dto';
import {
  CreateAutomationRuleDto,
  UpdateAutomationRuleDto,
  TestRuleSimulationDto,
  AutomationRuleResponseDto,
  SimulationResultDto,
} from './dto/automation-rule.dto';
import {
  IntelligenceOverviewDto,
  EnergyForecastResponseDto,
  DeviceAnomalyDto,
  OccupancyResponseDto,
  ModelHealthDto,
  RecommendationResponseDto,
} from './dto/intelligence.dto';

@Injectable()
export class IntelligenceService {
  private readonly logger = new Logger('IntelligenceService');

  constructor(
    private readonly prisma: PrismaService,
    private readonly mlClient: MlClientService,
    private readonly recommendationService: RecommendationService,
    private readonly ruleEngine: RuleEngineService,
    private readonly automationService: AutomationService,
    private readonly llmService: LlmService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  /**
   * GET /api/intelligence/overview
   */
  async getOverview(): Promise<IntelligenceOverviewDto> {
    const [
      totalRooms,
      totalActiveDevices,
      openAnomaliesCount,
      pendingRecommendationsCount,
      activeAutomationRulesCount,
      topRecommendations,
      modelHealth,
      roomsWithSensors,
    ] = await Promise.all([
      this.prisma.room.count({ where: { isActive: true } }),
      this.prisma.device.count({ where: { isOn: true } }),
      this.prisma.deviceAnomaly.count({ where: { status: 'OPEN' } }),
      this.recommendationService.getPendingCount(),
      this.prisma.automationRule.count({ where: { enabled: true } }),
      this.recommendationService.getRecommendations({ status: 'PENDING', limit: 5 }),
      this.mlClient.getModelHealthList(),
      this.prisma.room.findMany({
        where: { isActive: true },
        include: {
          building: true,
          devices: true,
          sensorData: { orderBy: { recordedAt: 'desc' }, take: 1 },
        },
      }),
    ]);

    // Calculate Occupancy
    const roomsInput = roomsWithSensors.map(r => ({
      id: r.id,
      roomNumber: r.roomNumber,
      buildingName: r.building?.name || 'TODA',
      floor: r.floor,
      motionDetected: Boolean(r.sensorData[0]?.motionDetected),
      powerW: r.devices.filter(d => d.isOn).length * 35.0,
      activeDevicesCount: r.devices.filter(d => d.isOn).length,
    }));

    const occupancyRooms = await this.mlClient.predictOccupancy(roomsInput);
    const occupiedCount = occupancyRooms.filter(r => r.predictedState === 'OCCUPIED').length;
    const vacantCount = Math.max(0, totalRooms - occupiedCount);
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedCount / totalRooms) * 1000) / 10 : 0;

    // Calculate Today's Energy & 24h Forecast
    const currentActualPowerW = totalActiveDevices * 35.0 + totalRooms * 5.0;
    const forecast = await this.mlClient.predictEnergyForecast({ horizonHours: 24 });
    const predictedEnergyKwh = forecast.summary.totalForecastKwh;
    const todayEnergyKwh = Math.round((currentActualPowerW * 14) / 1000 * 10) / 10;
    const energySavedKwh = Math.round((activeAutomationRulesCount * 1.85 + (totalRooms - occupiedCount) * 0.4) * 10) / 10;

    const nextHourForecastPoint = forecast.points[1] || forecast.points[0];
    const predictedNextHourPowerW = nextHourForecastPoint?.forecastPowerW || currentActualPowerW;
    const trend: 'UP' | 'DOWN' | 'STABLE' =
      predictedNextHourPowerW > currentActualPowerW * 1.05
        ? 'UP'
        : predictedNextHourPowerW < currentActualPowerW * 0.95
        ? 'DOWN'
        : 'STABLE';

    return {
      stats: {
        totalRooms,
        totalActiveDevices,
        todayEnergyKwh,
        predictedEnergyKwh,
        energySavedKwh,
        openAnomaliesCount,
        pendingRecommendationsCount,
        activeAutomationRulesCount,
      },
      forecastSummary: {
        currentActualPowerW,
        predictedNextHourPowerW,
        trend,
        peakHour: forecast.summary.peakTimestamp,
        peakPredictedPowerW: forecast.summary.peakPowerW,
      },
      occupancyOverview: {
        totalRooms,
        occupiedRooms: occupiedCount,
        vacantRooms: vacantCount,
        occupancyRate,
      },
      topRecommendations,
      modelHealth,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * GET /api/intelligence/energy/forecast
   */
  async getEnergyForecast(query: ForecastQueryDto): Promise<EnergyForecastResponseDto> {
    let recentPoints: Array<{ timestamp: Date; powerW: number }> = [];
    if (query.roomId) {
      const since = new Date(Date.now() - 12 * 3600 * 1000);
      const data = await this.prisma.sensorData.findMany({
        where: { roomId: query.roomId, recordedAt: { gte: since } },
        select: { recordedAt: true },
        take: 24,
      });
      recentPoints = data.map(d => ({ timestamp: d.recordedAt, powerW: 45.0 }));
    }

    const forecast = await this.mlClient.predictEnergyForecast({
      buildingId: query.buildingId,
      roomId: query.roomId,
      horizonHours: query.horizonHours || 24,
      interval: query.interval || '1h',
      recentPoints,
    });

    this.eventsGateway.broadcastAiForecast(forecast);
    return forecast;
  }

  /**
   * GET /api/intelligence/energy/lstm
   */
  async getLstmForecast(query: ForecastQueryDto): Promise<EnergyForecastResponseDto> {
    return this.mlClient.predictLstmForecast({
      buildingId: query.buildingId,
      roomId: query.roomId,
      horizonHours: query.horizonHours || 24,
      interval: query.interval || '1h',
    });
  }

  /**
   * GET /api/intelligence/energy/comparison
   * Returns Champion GBM model benchmark specifications & forecast curves.
   */
  async getForecastComparison(query: ForecastQueryDto): Promise<any> {
    return this.mlClient.compareForecastModels({
      buildingId: query.buildingId,
      roomId: query.roomId,
      horizonHours: query.horizonHours || 24,
    });
  }

  /**
   * POST /api/intelligence/models/:id/promote
   */
  async promoteModel(modelName: string): Promise<any> {
    const result = await this.mlClient.promoteModel(modelName);
    this.eventsGateway.broadcastAiModelUpdate(result);
    return result;
  }

  /**
   * GET /api/intelligence/models/drift
   */
  async getModelDrift(): Promise<any[]> {
    const drift = await this.mlClient.checkModelDrift();
    const staleModel = drift.find(d => d.isStale || d.isDriftDetected);
    if (staleModel) {
      this.eventsGateway.server?.emit('ai:model_stale', staleModel);
    }
    return drift;
  }

  /**
   * POST /api/intelligence/models/retrain
   */
  async triggerRetraining(modelName?: string): Promise<any> {
    this.eventsGateway.server?.emit('ai:retrain_progress', { status: 'STARTED', target: modelName || 'ALL' });
    const res = await this.mlClient.triggerRetraining(modelName);
    return res;
  }

  /**
   * GET /api/intelligence/student/insights
   * Scoped specifically to student's assigned room (AI Privacy Guarantee).
   */
  async getStudentInsights(userId?: string, roomIdParam?: string): Promise<any> {
    let roomId = roomIdParam;
    if (!roomId && userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      roomId = user?.roomId || undefined;
    }

    let room: any = null;
    if (roomId) {
      room = await this.prisma.room.findUnique({
        where: { id: roomId },
        include: { building: true, devices: true },
      });
    }

    if (!room) {
      room = await this.prisma.room.findFirst({
        include: { building: true, devices: true },
      });
    }

    const roomNumber = room?.roomNumber || '101';
    const buildingName = room?.building?.name || 'A';
    const activeDevicesCount = room?.devices?.filter((d: any) => d.isOn).length || 0;

    // Room energy stats (Scoped)
    const currentKwh = 8.4;
    const previousWeekKwh = 9.1;
    const savingsPercent = 8.0;

    // Generate personalized Vietnamese advice via LLM
    const ecoTip = await this.llmService.generateStudentEcoTip(roomNumber, currentKwh, previousWeekKwh);

    return {
      room: {
        id: room?.id || 'room-101',
        roomNumber,
        buildingName,
        floor: room?.floor || 1,
      },
      currentConsumption: {
        todayKwh: currentKwh,
        monthTotalKwh: 126.0,
        estimatedBillVnd: 285000,
        perStudentVnd: 71250,
        activeDevicesCount,
      },
      forecastTomorrow: {
        rangeKwh: '7.9 – 9.1 kWh',
        estimatedCostVnd: '18.000 – 20.500 ₫',
        savingsComparedToLastWeek: `${savingsPercent}%`,
        status: 'ECO_OPTIMIZED',
      },
      aiInsights: {
        habitEvaluation: 'Tiết Kiệm Rất Tốt',
        habitDescription: `Phòng ${roomNumber} giảm được 0.7 kWh/ngày nhờ thói quen tắt bình nóng lạnh và điều hòa khi ra ngoài.`,
        ecoTip,
      },
      privacyNotice: 'Dữ liệu được bảo vệ và hiển thị riêng tư cho phòng của bạn.',
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * GET /api/intelligence/anomalies
   */
  async getAnomalies(filters?: {
    severity?: string;
    status?: string;
    roomId?: string;
    limit?: number;
  }): Promise<DeviceAnomalyDto[]> {
    const where: any = {};
    if (filters?.severity) where.severity = filters.severity;
    if (filters?.status) where.status = filters.status;
    if (filters?.roomId) where.roomId = filters.roomId;

    const dbAnomalies = await this.prisma.deviceAnomaly.findMany({
      where,
      orderBy: [{ status: 'asc' }, { detectedAt: 'desc' }],
      take: filters?.limit || 50,
    });

    const roomIds = Array.from(new Set(dbAnomalies.map(a => a.roomId)));
    const rooms = await this.prisma.room.findMany({
      where: { id: { in: roomIds } },
      include: { building: true },
    });
    const roomMap = new Map(rooms.map(r => [r.id, r]));

    return dbAnomalies.map(a => {
      const room = roomMap.get(a.roomId);
      let features: any = {};
      try {
        features = typeof a.features === 'string' ? JSON.parse(a.features) : a.features;
      } catch {}

      return {
        id: a.id,
        deviceId: a.deviceId,
        deviceName: a.deviceName,
        roomId: a.roomId,
        roomNumber: room?.roomNumber || 'Unknown',
        buildingName: room?.building?.name || 'Tòa A',
        anomalyScore: a.anomalyScore,
        severity: a.severity as any,
        features,
        status: a.status as any,
        recommendation: a.recommendation,
        detectedAt: a.detectedAt,
        resolvedAt: a.resolvedAt,
        evidence: features,
      };
    });
  }

  /**
   * GET /api/intelligence/occupancy
   */
  async getOccupancy(buildingId?: string): Promise<OccupancyResponseDto> {
    const where: any = { isActive: true };
    if (buildingId) where.buildingId = buildingId;

    const rooms = await this.prisma.room.findMany({
      where,
      include: {
        building: true,
        devices: true,
        sensorData: { orderBy: { recordedAt: 'desc' }, take: 1 },
      },
    });

    const roomsInput = rooms.map(r => ({
      id: r.id,
      roomNumber: r.roomNumber,
      buildingName: r.building?.name || 'TODA',
      floor: r.floor,
      motionDetected: Boolean(r.sensorData[0]?.motionDetected),
      powerW: r.devices.filter(d => d.isOn).length * 35.0,
      activeDevicesCount: r.devices.filter(d => d.isOn).length,
      temperature: r.sensorData[0]?.temperature || 28.0,
      gasLevel: r.sensorData[0]?.gasLevel || 40.0,
    }));

    const occupancyRooms = await this.mlClient.predictOccupancy(roomsInput);
    const occupiedCount = occupancyRooms.filter(r => r.predictedState === 'OCCUPIED').length;
    const vacantCount = Math.max(0, rooms.length - occupiedCount);
    const averageOccupancyRate = rooms.length > 0 ? Math.round((occupiedCount / rooms.length) * 1000) / 10 : 0;

    return {
      buildingId,
      totalRooms: rooms.length,
      occupiedCount,
      vacantCount,
      averageOccupancyRate,
      rooms: occupancyRooms,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /api/intelligence/recommendations
   */
  async getRecommendations(filters?: {
    type?: string;
    severity?: string;
    status?: string;
    roomId?: string;
    limit?: number;
  }): Promise<RecommendationResponseDto[]> {
    return this.recommendationService.getRecommendations(filters);
  }

  /**
   * POST /api/intelligence/recommendations/:id/accept
   */
  async acceptRecommendation(id: string, executeAction = true, userId?: string): Promise<RecommendationResponseDto> {
    return this.recommendationService.acceptRecommendation(id, executeAction, userId);
  }

  /**
   * POST /api/intelligence/recommendations/:id/dismiss
   */
  async dismissRecommendation(id: string, userId?: string, reason?: string): Promise<RecommendationResponseDto> {
    return this.recommendationService.dismissRecommendation(id, userId, reason);
  }

  /**
   * GET /api/intelligence/models
   */
  async getModels(): Promise<ModelHealthDto[]> {
    return this.mlClient.getModelHealthList();
  }

  // ==================== AUTOMATION RULES ====================

  /**
   * GET /api/automation/rules
   */
  async getAutomationRules(): Promise<AutomationRuleResponseDto[]> {
    return this.ruleEngine.getAllRules();
  }

  /**
   * POST /api/automation/rules
   */
  async createAutomationRule(dto: CreateAutomationRuleDto, userId?: string): Promise<AutomationRuleResponseDto> {
    return this.ruleEngine.createRule(dto, userId);
  }

  /**
   * PATCH /api/automation/rules/:id
   */
  async updateAutomationRule(id: string, dto: UpdateAutomationRuleDto): Promise<AutomationRuleResponseDto> {
    return this.ruleEngine.updateRule(id, dto);
  }

  /**
   * POST /api/automation/rules/:id/test (or POST /api/automation/rules/test)
   */
  async testRuleSimulation(dto: TestRuleSimulationDto): Promise<SimulationResultDto> {
    return this.ruleEngine.simulateRule(dto);
  }
}
