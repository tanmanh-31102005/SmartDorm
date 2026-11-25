import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MqttService } from '../mqtt/mqtt.service';
import { EventsGateway } from '../gateway/events.gateway';
import { EmergencyService } from '../emergency/emergency.service';
import { TelemetryService } from '../telemetry/telemetry.service';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class SensorsService implements OnModuleInit {
  private readonly logger = new Logger('SensorsService');
  private roomCache: Map<string, { id: string; buildingId: string }> = new Map();
  private roomEnergyAccumulator: Map<string, { lastTime: number; totalKwh: number }> = new Map();

  constructor(
    private readonly prisma: PrismaService,
    private readonly mqttService: MqttService,
    private readonly eventsGateway: EventsGateway,
    private readonly emergencyService: EmergencyService,
    private readonly telemetryService: TelemetryService,
    private readonly settingsService: SettingsService,
  ) {}

  onModuleInit() {
    this.mqttService.on('message', async ({ topic, message }) => {
      if (topic.includes('/sensor/data')) {
        await this.handleSensorData(topic, message);
      }
    });
  }

  private async handleSensorData(topic: string, data: any) {
    const parts = topic.split('/');
    const building = parts[1];
    const roomNum  = parts[3];
    const roomKey  = `${building}-${roomNum}`;

    let roomInfo = this.roomCache.get(roomKey);
    if (!roomInfo) {
      const buildingRec = await this.prisma.building.findFirst({ where: { name: building } });
      if (buildingRec) {
        const roomRec = await this.prisma.room.findFirst({
          where: { roomNumber: roomNum, buildingId: buildingRec.id },
        });
        if (roomRec) {
          roomInfo = { id: roomRec.id, buildingId: buildingRec.id };
          this.roomCache.set(roomKey, roomInfo);
        }
      }
    }

    // Dynamic thresholds from SettingsService
    const thresholds = this.settingsService.getThresholds();
    const tempVal = Number(data.temperature ?? 0);
    const gasVal = Number(data.gas_level ?? 0);

    const isFireAlert = data.temp_alert || tempVal >= thresholds.tempCritical;
    const isGasAlert = data.gas_alert || gasVal >= thresholds.gasCritical;

    // Công thức tính công suất chuẩn SmartDorm:
    // P_total = (N_đèn * 20W) + (Quạt * 60W) + P_standby (5W)
    let lightCount = 0;
    if (data.light_1) lightCount++;
    if (data.light_2) lightCount++;
    if (data.light_3) lightCount++;
    if (lightCount === 0 && data.light) lightCount = 2; // ước lượng 2 đèn khi có cờ light chung

    const lightPower = lightCount * 20.0;
    const fanPower = data.fan ? 60.0 : 0.0;
    const standbyPower = 5.0; // ESP32 + cảm biến + router baseline
    const powerW = data.powerW !== undefined ? data.powerW : (lightPower + fanPower + standbyPower);

    // Tích phân điện năng tiêu thụ (kWh) theo thời gian thực: A = sum(P * delta_t / 3.6e6)
    const now = Date.now();
    let acc = this.roomEnergyAccumulator.get(roomKey);
    if (!acc) {
      acc = { lastTime: now, totalKwh: 12.45 }; // Khởi tạo mốc tích lũy
      this.roomEnergyAccumulator.set(roomKey, acc);
    }
    const deltaSec = Math.min(Math.max((now - acc.lastTime) / 1000, 1), 30);
    const incrementalKwh = (powerW * deltaSec) / (3600 * 1000);
    acc.totalKwh += incrementalKwh;
    acc.lastTime = now;
    const energyKwh = data.energyKwh !== undefined ? data.energyKwh : Math.round(acc.totalKwh * 1000) / 1000;
    const occupancySignal = data.occupancySignal !== undefined ? data.occupancySignal : (lightCount > 0 || data.fan);

    // Broadcast to all dashboard clients (Observer Pattern)
    const broadcastRoomId = roomInfo?.id || roomNum;
    this.eventsGateway.broadcastSensorData(broadcastRoomId, {
      ...data,
      powerW,
      energyKwh,
      occupancySignal,
      temp_alert: isFireAlert,
      gas_alert: isGasAlert,
    });

    // Lưu vào InfluxDB (Time-series)
    const floor = parts[2] || 'unknown';
    await this.telemetryService.saveNormalizedTelemetry({
      building,
      floor,
      room: roomNum,
      deviceId: data.deviceId || `ESP32-${building}${roomNum}`,
      source: data.source || 'SIMULATION_DATA',
      temperature: data.temperature,
      humidity: data.humidity,
      gasLevel: data.gas_level,
      powerW,
      energyKwh,
      occupancySignal,
      lightState: lightCount > 0,
      fanState: Boolean(data.fan),
    });

    if (roomInfo) {
      await this.prisma.sensorData.create({
        data: {
          temperature: data.temperature,
          humidity:    data.humidity,
          gasLevel:    data.gas_level,
          gasAlert:    isGasAlert,
          tempAlert:   isFireAlert,
          motionDetected: Boolean(data.motion_detected || occupancySignal),
          roomId:      roomInfo.id,
        },
      }).catch(e => this.logger.warn('DB error: ' + e.message));

      if (isGasAlert) {
        await this.emergencyService.handleEmergency('GAS_LEAK', roomInfo.id, roomInfo.buildingId, data);
      } else if (isFireAlert) {
        await this.emergencyService.handleEmergency('FIRE', roomInfo.id, roomInfo.buildingId, data);
      }
    }
  }

  async getLatestByRoom(roomId: string, limit = 50) {
    return this.prisma.sensorData.findMany({
      where: { roomId },
      orderBy: { recordedAt: 'desc' },
      take: limit,
    });
  }

  async getRecentAll(limit = 20) {
    const data = await this.prisma.sensorData.findMany({
      take: limit,
      orderBy: { recordedAt: 'desc' },
      include: {
        room: {
          include: { building: true },
        },
      },
    });
    return data.reverse();
  }

  async getAnalytics(roomId: string, hours = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const data = await this.prisma.sensorData.findMany({
      where: { roomId, recordedAt: { gte: since } },
      orderBy: { recordedAt: 'asc' },
    });
    return { data, hours, count: data.length };
  }
}
