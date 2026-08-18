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

    await this.mqttService.publish(
      `dormitory/+/+/${roomId}/command/alarm`,
      JSON.stringify({ action: 'on', pattern: 'gas', command_id: `gas_${Date.now()}` }),
    ).catch(() => {});
    actions.push({ action: 'ACTIVATE_ALARM', target: roomId, priority: 'critical' });

    await this.mqttService.publish(
      `dormitory/+/+/${roomId}/command/door`,
      JSON.stringify({ action: 'unlock', reason: 'gas_emergency', command_id: `gas_door_${Date.now()}` }),
    ).catch(() => {});
    actions.push({ action: 'UNLOCK_DOOR', target: roomId, priority: 'critical' });

    this.eventsGateway.broadcastEmergency({
      type: 'GAS_LEAK', level: 'critical', roomId, buildingId,
      message: `⚠️ PHÁT HIỆN KHÍ GAS tại phòng ${roomId}! Mức: ${sensorData?.gas_level}%`,
      sensorData, timestamp: new Date().toISOString(),
    });
    actions.push({ action: 'BROADCAST_ALERT', target: 'all_dashboards', priority: 'critical' });

    await this.notificationsService.sendGasAlert(roomId, sensorData).catch(() => {});
    actions.push({ action: 'NOTIFY_ADMIN', target: 'telegram', priority: 'critical' });

    return actions;
  }

  getType(): string  { return 'GAS_LEAK'; }
  getLevel(): string { return 'CRITICAL'; }
}
