import { Injectable, Logger } from '@nestjs/common';
import { IEmergencyStrategy, EmergencyAction } from './emergency-strategy.interface';
import { MqttService } from '../../mqtt/mqtt.service';
import { EventsGateway } from '../../gateway/events.gateway';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class GasLeakEmergencyStrategy implements IEmergencyStrategy {
  private readonly logger = new Logger('GasLeakStrategy');
  constructor(
    private readonly mqttService: MqttService,
    private readonly eventsGateway: EventsGateway,
    private readonly notificationsService: NotificationsService,
  ) {}

  async handle(roomId: string, buildingId: string, sensorData: any): Promise<EmergencyAction[]> {
    this.logger.error(`⚠️ GAS LEAK tại phòng ${roomId}! Level: ${sensorData?.gas_level}%`);
    const actions: EmergencyAction[] = [];

    // 1. Tự động Bật quạt thông gió tối đa để hút và phân tán khí gas
    try {
      await this.mqttService.publish(
        `dormitory/+/+/${roomId}/command/fan`,
        JSON.stringify({ action: 'on', speed: 'high', reason: 'gas_leak_exhaust', command_id: `gas_fan_${Date.now()}` }),
      );
      actions.push({ action: 'ACTIVATE_EXHAUST_FAN', target: roomId, priority: 'critical', result: 'success' });
    } catch (e) {
      actions.push({ action: 'ACTIVATE_EXHAUST_FAN', target: roomId, priority: 'critical', result: 'failed' });
    }

    // 2. Tắt đèn / ngắt phụ tải để ngăn chặn tia lửa điện
    try {
      await this.mqttService.publish(
        `dormitory/+/+/${roomId}/command/light`,
        JSON.stringify({ action: 'off', reason: 'prevent_spark', command_id: `gas_light_${Date.now()}` }),
      );
      actions.push({ action: 'SHUTDOWN_LIGHTS_SPARKS', target: roomId, priority: 'critical', result: 'success' });
    } catch (e) {
      actions.push({ action: 'SHUTDOWN_LIGHTS_SPARKS', target: roomId, priority: 'critical', result: 'failed' });
    }

    // 3. Mở khóa cửa hỗ trợ thoát hiểm và thông gió
    try {
      await this.mqttService.publish(
        `dormitory/+/+/${roomId}/command/door`,
        JSON.stringify({ action: 'unlock', reason: 'gas_emergency', command_id: `gas_door_${Date.now()}` }),
      );
      actions.push({ action: 'UNLOCK_DOOR', target: roomId, priority: 'critical', result: 'success' });
    } catch (e) {
      actions.push({ action: 'UNLOCK_DOOR', target: roomId, priority: 'critical', result: 'failed' });
    }

    // 4. Phát sóng realtime cảnh báo lên Dashboard
    this.eventsGateway.broadcastEmergency({
      type: 'GAS_LEAK',
      level: 'critical',
      roomId,
      buildingId,
      message: `⚠️ PHÁT HIỆN RÒ RỈ KHÍ GAS tại phòng ${roomId}! Nồng độ: ${sensorData?.gas_level}%`,
      sensorData,
      timestamp: new Date().toISOString(),
    });
    actions.push({ action: 'BROADCAST_ALERT', target: 'all_dashboards', priority: 'critical', result: 'success' });

    // 5. Gửi thông báo Telegram (có nút điều khiển tức thời) và Email
    try {
      await this.notificationsService.sendGasAlert(roomId, sensorData);
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
