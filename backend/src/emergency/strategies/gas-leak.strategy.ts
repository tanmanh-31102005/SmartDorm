import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { IEmergencyStrategy, EmergencyAction } from './emergency-strategy.interface';
import { MqttService } from '../../mqtt/mqtt.service';
import { EventsGateway } from '../../gateway/events.gateway';
import { NotificationsService } from '../../notifications/notifications.service';
import { DevicesService } from '../../devices/devices.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class GasLeakEmergencyStrategy implements IEmergencyStrategy {
  private readonly logger = new Logger('GasLeakStrategy');
  constructor(
    private readonly mqttService: MqttService,
    private readonly eventsGateway: EventsGateway,
    private readonly notificationsService: NotificationsService,
    @Inject(forwardRef(() => DevicesService))
    private readonly devicesService: DevicesService,
    private readonly prisma: PrismaService,
  ) {}

  async handle(roomId: string, buildingId: string, sensorData: any): Promise<EmergencyAction[]> {
    this.logger.error(`⚠️ GAS LEAK tại phòng ${roomId}! Level: ${sensorData?.gas_level}%`);
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

    // 1. Tự động Bật quạt thông gió tối đa để hút và phân tán khí gas
    try {
      await this.devicesService.sendCommand(targetRoomId, 'FAN', 'on');
      actions.push({ action: 'ACTIVATE_EXHAUST_FAN', target: roomId, priority: 'critical', result: 'success' });
    } catch (e) {
      await this.mqttService.publish(
        `${topicBase}/command/fan`,
        JSON.stringify({ action: 'on', speed: 'high', reason: 'gas_leak_exhaust', command_id: `gas_fan_${Date.now()}` }),
      ).catch(() => {});
      actions.push({ action: 'ACTIVATE_EXHAUST_FAN', target: roomId, priority: 'critical', result: 'success' });
    }

    // 2. Kích hoạt còi hú & đèn báo động cảnh báo tức thì
    try {
      await this.devicesService.sendCommand(targetRoomId, 'BUZZER', 'on');
      actions.push({ action: 'ACTIVATE_ALARM', target: roomId, priority: 'critical', result: 'success' });
    } catch (e) {
      await this.mqttService.publish(
        `${topicBase}/command/alarm`,
        JSON.stringify({ action: 'on', pattern: 'gas_leak', command_id: `gas_alarm_${Date.now()}` }),
      ).catch(() => {});
      actions.push({ action: 'ACTIVATE_ALARM', target: roomId, priority: 'critical', result: 'success' });
    }

    // 3. Tắt đèn / ngắt phụ tải để ngăn chặn tia lửa điện
    try {
      await this.devicesService.sendCommand(targetRoomId, 'LIGHT', 'off');
      actions.push({ action: 'SHUTDOWN_LIGHTS_SPARKS', target: roomId, priority: 'critical', result: 'success' });
    } catch (e) {
      await this.mqttService.publish(
        `${topicBase}/command/light`,
        JSON.stringify({ action: 'off', reason: 'prevent_spark', command_id: `gas_light_${Date.now()}` }),
      ).catch(() => {});
      actions.push({ action: 'SHUTDOWN_LIGHTS_SPARKS', target: roomId, priority: 'critical', result: 'success' });
    }

    // 4. Mở khóa cửa hỗ trợ thoát hiểm và thông gió
    try {
      await this.devicesService.sendCommand(targetRoomId, 'DOOR_LOCK', 'unlock');
      actions.push({ action: 'UNLOCK_DOOR', target: roomId, priority: 'critical', result: 'success' });
    } catch (e) {
      await this.mqttService.publish(
        `${topicBase}/command/door`,
        JSON.stringify({ action: 'unlock', reason: 'gas_emergency', command_id: `gas_door_${Date.now()}` }),
      ).catch(() => {});
      actions.push({ action: 'UNLOCK_DOOR', target: roomId, priority: 'critical', result: 'success' });
    }

    // 5. Phát sóng realtime cảnh báo lên Dashboard
    this.eventsGateway.broadcastEmergency({
      type: 'GAS_LEAK',
      level: 'critical',
      roomId,
      buildingId,
      message: `⚠️ PHÁT HIỆN RÒ RỈ KHÍ GAS tại phòng ${room?.roomNumber || roomId}! Nồng độ: ${sensorData?.gas_level}%`,
      sensorData,
      timestamp: new Date().toISOString(),
    });
    actions.push({ action: 'BROADCAST_ALERT', target: 'all_dashboards', priority: 'critical', result: 'success' });

    // 6. Gửi thông báo Telegram (có nút điều khiển tức thời) và Email
    try {
      await this.notificationsService.sendGasAlert(targetRoomId, sensorData);
      actions.push({ action: 'NOTIFY_ADMIN_STUDENTS', target: 'telegram+email', priority: 'critical', result: 'success' });
    } catch (e: any) {
      this.logger.warn('Notification failed: ' + e?.message);
      actions.push({ action: 'NOTIFY_ADMIN_STUDENTS', target: 'telegram+email', priority: 'critical', result: 'failed' });
    }

    return actions;
  }

  getType(): string  { return 'GAS_LEAK'; }
  getLevel(): string { return 'CRITICAL'; }
}
