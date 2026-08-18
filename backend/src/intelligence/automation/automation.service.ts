import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MqttService } from '../../mqtt/mqtt.service';
import { EventsGateway } from '../../gateway/events.gateway';
import { CommandInvokerService } from '../../devices/commands/command-invoker.service';
import { DevicesService } from '../../devices/devices.service';
import { TurnOffLightCommand } from '../../devices/commands/turn-off-light.command';
import { TurnOnLightCommand } from '../../devices/commands/turn-on-light.command';
import { ToggleFanCommand } from '../../devices/commands/toggle-fan.command';
import { ControlDoorCommand } from '../../devices/commands/control-door.command';
import { RuleActionDto } from '../dto/automation-rule.dto';

export interface ExecutionResultSummary {
  success: boolean;
  totalActions: number;
  successfulActions: number;
  failedActions: number;
  message: string;
  details: Array<{ action: string; targetRoomId?: string; success: boolean; error?: string }>;
}

@Injectable()
export class AutomationService {
  private readonly logger = new Logger('AutomationService');

  constructor(
    private readonly prisma: PrismaService,
    private readonly mqttService: MqttService,
    private readonly eventsGateway: EventsGateway,
    private readonly commandInvoker: CommandInvokerService,
    @Inject(forwardRef(() => DevicesService))
    private readonly devicesService: DevicesService,
  ) {}


  /**
   * Execute an array of rule actions with priority awareness & command logging
   */
  async executeActions(
    actions: RuleActionDto[] | any[],
    triggeredBy: 'AI_RECOMMENDATION' | 'MANUAL' | 'SCHEDULE' | 'RULE_ENGINE' = 'AI_RECOMMENDATION',
    userId?: string,
    defaultRoomId?: string,
    ruleId?: string,
  ): Promise<ExecutionResultSummary> {
    if (!actions || actions.length === 0) {
      return {
        success: true,
        totalActions: 0,
        successfulActions: 0,
        failedActions: 0,
        message: 'No actions to execute',
        details: [],
      };
    }

    const details: Array<{ action: string; targetRoomId?: string; success: boolean; error?: string }> = [];
    let successCount = 0;
    let failCount = 0;

    for (const actionItem of actions) {
      const roomId = actionItem.targetRoomId || actionItem.roomId || defaultRoomId;
      const actionType = actionItem.type || actionItem.actionType;

      if (!roomId && actionType !== 'NOTIFY_ADMIN' && actionType !== 'CUSTOM_MQTT') {
        this.logger.warn(`Cannot execute action ${actionType}: no target room specified`);
        failCount++;
        details.push({ action: actionType, success: false, error: 'No roomId' });
        continue;
      }

      try {
        const actionResult = await this.executeSingleAction(actionType, roomId, actionItem, userId);
        if (actionResult.success) {
          successCount++;
          details.push({ action: actionType, targetRoomId: roomId, success: true });
        } else {
          failCount++;
          details.push({ action: actionType, targetRoomId: roomId, success: false, error: actionResult.error });
        }
      } catch (err: any) {
        failCount++;
        this.logger.error(`Error executing action ${actionType} on room ${roomId}: ${err.message}`);
        details.push({ action: actionType, targetRoomId: roomId, success: false, error: err.message });
      }
    }

    const overallSuccess = failCount === 0;

    // Log to DB AutomationExecution if ruleId or actions executed
    if (ruleId) {
      await this.prisma.automationExecution.create({
        data: {
          ruleId,
          triggeredBy,
          inputContext: JSON.stringify({ defaultRoomId, userId }),
          actionsExecuted: JSON.stringify(actions),
          result: overallSuccess ? 'SUCCESS' : successCount > 0 ? 'PARTIAL' : 'FAILED',
          requestedBy: userId || null,
        },
      }).catch(e => this.logger.warn(`Failed to log automation execution: ${e.message}`));
    }

    return {
      success: overallSuccess,
      totalActions: actions.length,
      successfulActions: successCount,
      failedActions: failCount,
      message: overallSuccess
        ? `Thực thi thành công ${successCount}/${actions.length} hành động.`
        : `Thực thi hoàn tất với ${successCount} thành công, ${failCount} thất bại.`,
      details,
    };
  }

  /**
   * Execute single atomic command via Command Pattern
   */
  private async executeSingleAction(
    actionType: string,
    roomId?: string,
    actionItem?: any,
    userId?: string,
  ): Promise<{ success: boolean; error?: string }> {
    // 1. Resolve room & topic
    let room: any = null;
    if (roomId) {
      room = await this.prisma.room.findUnique({
        where: { id: roomId },
        include: { building: true },
      });
      if (!room) {
        const roomNum = roomId.replace(/^room-/, '').replace(/^P\./, '');
        room = await this.prisma.room.findFirst({
          where: { roomNumber: roomNum },
          include: { building: true },
        });
      }
    }

    const buildingName = room?.building?.name || 'TODA';
    const floorStr = room ? room.floor.toString() : '1';
    const roomNumberStr = room ? room.roomNumber : '101';
    const topicBase = `dormitory/${buildingName}/${floorStr}/${roomNumberStr}`;
    const realRoomId = room?.id || roomId || 'unknown';

    const targetRoomIdentifier = room?.id || roomId || 'room-101';

    switch (actionType) {
      case 'LIGHT_OFF': {
        const res = await this.devicesService.sendCommand(targetRoomIdentifier, 'LIGHT', 'off', userId);
        return { success: res.success };
      }
      case 'LIGHT_ON': {
        const res = await this.devicesService.sendCommand(targetRoomIdentifier, 'LIGHT', 'on', userId);
        return { success: res.success };
      }
      case 'FAN_OFF': {
        const res = await this.devicesService.sendCommand(targetRoomIdentifier, 'FAN', 'off', userId);
        return { success: res.success };
      }
      case 'FAN_ON': {
        const res = await this.devicesService.sendCommand(targetRoomIdentifier, 'FAN', 'on', userId);
        return { success: res.success };
      }
      case 'DOOR_LOCK': {
        const res = await this.devicesService.sendCommand(targetRoomIdentifier, 'DOOR_LOCK', 'lock', userId);
        return { success: res.success };
      }
      case 'DOOR_UNLOCK': {
        const res = await this.devicesService.sendCommand(targetRoomIdentifier, 'DOOR_LOCK', 'unlock', userId);
        return { success: res.success };
      }
      case 'CUSTOM_MQTT': {
        if (actionItem?.payload?.topic && actionItem?.payload?.message) {
          await this.mqttService.publish(
            actionItem.payload.topic,
            typeof actionItem.payload.message === 'string'
              ? actionItem.payload.message
              : JSON.stringify(actionItem.payload.message),
          );
          return { success: true };
        }
        return { success: false, error: 'Missing MQTT topic/message in payload' };
      }
      case 'NOTIFY_ADMIN': {
        this.logger.log(`ADMIN NOTIFICATION: ${JSON.stringify(actionItem?.payload || actionItem)}`);
        return { success: true };
      }
      default:
        this.logger.warn(`Unknown action type: ${actionType}`);
        return { success: false, error: `Unsupported action type: ${actionType}` };
    }
  }
}

