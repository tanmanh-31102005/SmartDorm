import { ICommand, CommandResult } from './command.interface';
import { MqttService } from '../../mqtt/mqtt.service';

export class TurnOffLightCommand implements ICommand {
  constructor(
    private readonly mqttService: MqttService,
    private readonly topicBase: string,
    private readonly deviceId: string,
    private readonly lightNumber: number = 0,
  ) {}

  async execute(): Promise<CommandResult> {
    const subtopic = this.lightNumber === 0 ? 'light' : `light${this.lightNumber}`;
    await this.mqttService.publish(
      `${this.topicBase}/command/${subtopic}`,
      JSON.stringify({ action: 'off', command_id: this.deviceId, timestamp: Date.now() }),
    );
    return {
      success: true,
      message: `Đã tắt đèn`,
      deviceId: this.deviceId,
      timestamp: new Date(),
      commandType: this.getCommandType(),
    };
  }

  async undo(): Promise<CommandResult> {
    const subtopic = this.lightNumber === 0 ? 'light' : `light${this.lightNumber}`;
    await this.mqttService.publish(
      `${this.topicBase}/command/${subtopic}`,
      JSON.stringify({ action: 'on', command_id: `undo_${this.deviceId}`, timestamp: Date.now() }),
    );
    return {
      success: true,
      message: `Đã bật đèn (undo)`,
      deviceId: this.deviceId,
      timestamp: new Date(),
      commandType: 'TurnOnLight',
    };
  }

  getDescription(): string { return `Tắt đèn phòng — Topic: ${this.topicBase}`; }
  getCommandType(): string { return 'TurnOffLight'; }
}
