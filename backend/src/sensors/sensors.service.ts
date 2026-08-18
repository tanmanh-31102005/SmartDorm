import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MqttService } from '../mqtt/mqtt.service';
import { EventsGateway } from '../gateway/events.gateway';
import { EmergencyService } from '../emergency/emergency.service';
import { TelemetryService } from '../telemetry/telemetry.service';

@Injectable()
export class SensorsService implements OnModuleInit {
  private readonly logger = new Logger('SensorsService');
  private roomCache: Map<string, { id: string; buildingId: string }> = new Map();

  constructor(
    private readonly prisma: PrismaService,
    private readonly mqttService: MqttService,
    private readonly eventsGateway: EventsGateway,
    private readonly emergencyService: EmergencyService,
    private readonly telemetryService: TelemetryService,
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

    // Calculate simulated power if raw power not supplied:
    // 3 lights (~20W each) + fan (~60W)
    let lightCount = 0;
    if (data.light_1) lightCount++;
    if (data.light_2) lightCount++;
    if (data.light_3) lightCount++;
    const lightPower = lightCount * 20.0;
    const fanPower = data.fan ? 60.0 : 0.0;
    const standbyPower = 5.0; // ESP32 + sensors baseline
    const powerW = data.powerW !== undefined ? data.powerW : (lightPower + fanPower + standbyPower);
    const energyKwh = data.energyKwh;
    const occupancySignal = data.occupancySignal !== undefined ? data.occupancySignal : (lightCount > 0 || data.fan);

    // Broadcast to all dashboard clients (Observer Pattern)
    const broadcastRoomId = roomInfo?.id || roomNum;
    this.eventsGateway.broadcastSensorData(broadcastRoomId, {
      ...data,
      powerW,
      occupancySignal,
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
          gasAlert:    data.gas_alert  || false,
          tempAlert:   data.temp_alert || false,
          motionDetected: Boolean(data.motion_detected || occupancySignal),
          roomId:      roomInfo.id,
        },
      }).catch(e => this.logger.warn('DB error: ' + e.message));


      if (data.gas_alert) {
        await this.emergencyService.handleEmergency('GAS_LEAK', roomInfo.id, roomInfo.buildingId, data);
      } else if (data.temp_alert) {
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
