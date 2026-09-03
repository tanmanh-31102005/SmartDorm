import { Injectable, Logger } from '@nestjs/common';
import { IEmergencyStrategy, EmergencyAction } from './emergency-strategy.interface';
import { MqttService } from '../../mqtt/mqtt.service';
import { EventsGateway } from '../../gateway/events.gateway';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class FireEmergencyStrategy implements IEmergencyStrategy {
  private readonly logger = new Logger('FireStrategy');

  constructor(
    private readonly mqttService: MqttService,
    private readonly eventsGateway: EventsGateway,
    private readonly notificationsService: NotificationsService,
  ) {}

  async handle(roomId: string, buildingId: string, sensorData: any): Promise<EmergencyAction[]> {
    this.logger.error(`🔥 FIRE EMERGENCY at Room ${roomId}! Temp: ${sensorData?.temperature}°C`);
    const actions: EmergencyAction[] = [];

    // 1. Bật còi báo động 110dB
    try {
      await this.mqttService.publish(
        `dormitory/+/+/${roomId}/command/alarm`,
        JSON.stringify({ action: 'on', pattern: 'fire', command_id: `fire_${Date.now()}` }),
      );
      actions.push({ action: 'ACTIVATE_ALARM', target: roomId, priority: 'critical', result: 'success' });
    } catch (e) {
      actions.push({ action: 'ACTIVATE_ALARM', target: roomId, priority: 'critical', result: 'failed' });
    }

    // 2. Mở toàn bộ khóa chốt cửa điện tử để cứu nạn
    try {
      await this.mqttService.publish(
        `dormitory/+/+/${roomId}/command/door`,
        JSON.stringify({ action: 'unlock', reason: 'fire_emergency', command_id: `fire_door_${Date.now()}` }),
      );
      actions.push({ action: 'UNLOCK_DOOR', target: roomId, priority: 'critical', result: 'success' });
    } catch (e) {
      actions.push({ action: 'UNLOCK_DOOR', target: roomId, priority: 'critical', result: 'failed' });
    }

    // 3. Tắt nguồn phụ tải điện
    try {
      await this.mqttService.publish(
        `dormitory/+/+/${roomId}/command/light`,
        JSON.stringify({ action: 'off', reason: 'fire_power_cut', command_id: `fire_power_${Date.now()}` }),
      );
      actions.push({ action: 'CUT_POWER_LOADS', target: roomId, priority: 'critical', result: 'success' });
    } catch (e) {
      actions.push({ action: 'CUT_POWER_LOADS', target: roomId, priority: 'critical', result: 'failed' });
    }

    // 4. Real-time alert lên Dashboard (Observer Pattern)
    this.eventsGateway.broadcastEmergency({
      type: 'FIRE',
      level: 'critical',
      roomId,
      buildingId,
      message: `🔥 PHÁT HIỆN HỎA HOẠN tại phòng ${roomId}! Nhiệt độ: ${sensorData?.temperature}°C`,
      sensorData,
      timestamp: new Date().toISOString(),
    });
    actions.push({ action: 'BROADCAST_ALERT', target: 'all_dashboards', priority: 'critical', result: 'success' });

    // 5. Gửi thông báo Telegram (kèm inline actions) và Email
    try {
      await this.notificationsService.sendFireAlert(roomId, sensorData);
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
