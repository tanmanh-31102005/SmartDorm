import { ICommand, CommandResult } from './command.interface';
import { MqttService } from '../../mqtt/mqtt.service';

export class ControlDoorCommand implements ICommand {
  constructor(
    private readonly mqttService: MqttService,
    private readonly topicBase: string,
    private readonly deviceId: string,
    private readonly action: 'unlock' | 'lock',
  ) {}

  async execute(): Promise<CommandResult> {
    await this.mqttService.publish(
      `${this.topicBase}/command/door`,
      JSON.stringify({ action: this.action, command_id: this.deviceId, timestamp: Date.now() }),
    );
    return {
      success: true,
      message: `Cửa: ${this.action === 'unlock' ? 'Đã mở khóa' : 'Đã khóa'}`,
      deviceId: this.deviceId,
      timestamp: new Date(),
      commandType: this.getCommandType(),
    };
  }

  async undo(): Promise<CommandResult> {
    const reverseAction = this.action === 'unlock' ? 'lock' : 'unlock';
    await this.mqttService.publish(
      `${this.topicBase}/command/door`,
      JSON.stringify({ action: reverseAction, command_id: `undo_${this.deviceId}`, timestamp: Date.now() }),
    );
    return {
      success: true,
      message: `Cửa: ${reverseAction === 'unlock' ? 'Đã mở khóa' : 'Đã khóa'} (undo)`,
      deviceId: this.deviceId,
      timestamp: new Date(),
      commandType: reverseAction === 'unlock' ? 'UnlockDoor' : 'LockDoor',
    };
  }

  getDescription(): string { return `${this.action === 'unlock' ? 'Mở khóa' : 'Khóa'} cửa — Topic: ${this.topicBase}`; }
  getCommandType(): string { return this.action === 'unlock' ? 'UnlockDoor' : 'LockDoor'; }
}
