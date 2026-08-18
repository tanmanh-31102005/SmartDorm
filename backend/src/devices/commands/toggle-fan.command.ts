import { ICommand, CommandResult } from './command.interface';
import { MqttService } from '../../mqtt/mqtt.service';

export class ToggleFanCommand implements ICommand {
  constructor(
    private readonly mqttService: MqttService,
    private readonly topicBase: string,
    private readonly deviceId: string,
    private readonly state: boolean, // true = on, false = off
  ) {}

  async execute(): Promise<CommandResult> {
    await this.mqttService.publish(
      `${this.topicBase}/command/fan`,
      JSON.stringify({ action: this.state ? 'on' : 'off', command_id: this.deviceId, timestamp: Date.now() }),
    );
    return {
      success: true,
      message: `Quạt: ${this.state ? 'Đã bật' : 'Đã tắt'}`,
      deviceId: this.deviceId,
      timestamp: new Date(),
      commandType: this.getCommandType(),
    };
  }

  async undo(): Promise<CommandResult> {
    await this.mqttService.publish(
      `${this.topicBase}/command/fan`,
      JSON.stringify({ action: !this.state ? 'on' : 'off', command_id: `undo_${this.deviceId}`, timestamp: Date.now() }),
    );
    return {
      success: true,
      message: `Quạt: ${!this.state ? 'Đã bật' : 'Đã tắt'} (undo)`,
      deviceId: this.deviceId,
      timestamp: new Date(),
      commandType: this.state ? 'TurnOffFan' : 'TurnOnFan',
    };
  }

  getDescription(): string { return `${this.state ? 'Bật' : 'Tắt'} quạt — Topic: ${this.topicBase}`; }
  getCommandType(): string { return this.state ? 'TurnOnFan' : 'TurnOffFan'; }
}
