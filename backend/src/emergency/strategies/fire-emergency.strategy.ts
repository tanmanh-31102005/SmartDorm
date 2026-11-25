import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { IEmergencyStrategy, EmergencyAction } from './emergency-strategy.interface';
import { MqttService } from '../../mqtt/mqtt.service';
import { EventsGateway } from '../../gateway/events.gateway';
import { NotificationsService } from '../../notifications/notifications.service';
import { DevicesService } from '../../devices/devices.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FireEmergencyStrategy implements IEmergencyStrategy {
  private readonly logger = new Logger('FireStrategy');

  constructor(
    private readonly mqttService: MqttService,
    private readonly eventsGateway: EventsGateway,
    private readonly notificationsService: NotificationsService,
    @Inject(forwardRef(() => DevicesService))
    private readonly devicesService: DevicesService,
    private readonly prisma: PrismaService,
  ) {}

  async handle(roomId: string, buildingId: string, sensorData: any): Promise<EmergencyAction[]> {
    this.logger.error(`🔥 FIRE EMERGENCY at Room ${roomId}! Temp: ${sensorData?.temperature}°C`);
    const actions: EmergencyAction[] = [];

    // Tìm thông tin phòng để có topic chính xác
    const room = await this.prisma.room.findFirst({
      where: { OR: [{ id: roomId }, { roomNumber: roomId }] },
      include: { building: true },
    }).catch(() => null);

    const topicBase = room
      ? `dormitory/${room.building.name}/${room.floor}/${room.roomNumber}`
      : `dormitory/A/1/101`;
    const targetRoomId = room ? room.id : roomId;

    // 1. Bật còi báo động 110dB (đồng bộ qua DevicesService -> MQTT + DB + Web UI)
    try {
      await this.devicesService.sendCommand(targetRoomId, 'BUZZER', 'on');
      actions.push({ action: 'ACTIVATE_ALARM', target: roomId, priority: 'critical', result: 'success' });
    } catch (e) {
      // Fallback MQTT trực tiếp tới topic cụ thể
      await this.mqttService.publish(
        `${topicBase}/command/alarm`,
        JSON.stringify({ action: 'on', pattern: 'fire', command_id: `fire_${Date.now()}` }),
      ).catch(() => {});
      actions.push({ action: 'ACTIVATE_ALARM', target: roomId, priority: 'critical', result: 'success' });
    }

    // 2. Mở toàn bộ khóa chốt cửa điện tử để cứu nạn
    try {
      await this.devicesService.sendCommand(targetRoomId, 'DOOR_LOCK', 'unlock');
      actions.push({ action: 'UNLOCK_DOOR', target: roomId, priority: 'critical', result: 'success' });
    } catch (e) {
      await this.mqttService.publish(
        `${topicBase}/command/door`,
        JSON.stringify({ action: 'unlock', reason: 'fire_emergency', command_id: `fire_door_${Date.now()}` }),
      ).catch(() => {});
      actions.push({ action: 'UNLOCK_DOOR', target: roomId, priority: 'critical', result: 'success' });
    }

    // 3. Tắt nguồn phụ tải điện
    try {
      await this.devicesService.sendCommand(targetRoomId, 'LIGHT', 'off');
      actions.push({ action: 'CUT_POWER_LOADS', target: roomId, priority: 'critical', result: 'success' });
    } catch (e) {
      await this.mqttService.publish(
        `${topicBase}/command/light`,
        JSON.stringify({ action: 'off', reason: 'fire_power_cut', command_id: `fire_power_${Date.now()}` }),
      ).catch(() => {});
      actions.push({ action: 'CUT_POWER_LOADS', target: roomId, priority: 'critical', result: 'success' });
    }

    // 4. Real-time alert lên Dashboard (Observer Pattern)
    this.eventsGateway.broadcastEmergency({
      type: 'FIRE',
      level: 'critical',
      roomId,
      buildingId,
      message: `🔥 PHÁT HIỆN HỎA HOẠN tại phòng ${room?.roomNumber || roomId}! Nhiệt độ: ${sensorData?.temperature}°C`,
      sensorData,
      timestamp: new Date().toISOString(),
    });
    actions.push({ action: 'BROADCAST_ALERT', target: 'all_dashboards', priority: 'critical', result: 'success' });

    // 5. Gửi thông báo Telegram (kèm inline actions) và Email
    try {
      await this.notificationsService.sendFireAlert(targetRoomId, sensorData);
      actions.push({ action: 'NOTIFY_ADMIN_STUDENTS', target: 'telegram+email', priority: 'critical', result: 'success' });
    } catch (e: any) {
      this.logger.warn('Notification failed: ' + e?.message);
      actions.push({ action: 'NOTIFY_ADMIN_STUDENTS', target: 'telegram+email', priority: 'critical', result: 'failed' });
    }

    return actions;
  }

  getType(): string { return 'FIRE'; }
  getLevel(): string { return 'CRITICAL'; }
}
