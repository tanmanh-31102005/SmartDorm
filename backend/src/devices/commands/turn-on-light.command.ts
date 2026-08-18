import { ICommand, CommandResult } from './command.interface';
import { MqttService } from '../../mqtt/mqtt.service';

export class TurnOnLightCommand implements ICommand {
  constructor(
    private readonly mqttService: MqttService,
    private readonly topicBase: string,
    private readonly deviceId: string,
    private readonly lightNumber: number = 0, // 0 = all, 1/2/3 = specific
  ) {}

  async execute(): Promise<CommandResult> {
    const subtopic = this.lightNumber === 0 ? 'light' : `light${this.lightNumber}`;
    await this.mqttService.publish(
      `${this.topicBase}/command/${subtopic}`,
      JSON.stringify({ action: 'on', command_id: this.deviceId, timestamp: Date.now() }),
    );
    return {
      success: true,
      message: `Đã bật đèn ${this.lightNumber === 0 ? 'tất cả' : this.lightNumber}`,
      deviceId: this.deviceId,
      timestamp: new Date(),
      commandType: this.getCommandType(),
    };
  }

  async undo(): Promise<CommandResult> {
    const subtopic = this.lightNumber === 0 ? 'light' : `light${this.lightNumber}`;
    await this.mqttService.publish(
      `${this.topicBase}/command/${subtopic}`,
      JSON.stringify({ action: 'off', command_id: `undo_${this.deviceId}`, timestamp: Date.now() }),
    );
    return {
      success: true,
      message: `Đã tắt đèn (undo)`,
      deviceId: this.deviceId,
      timestamp: new Date(),
      commandType: 'TurnOffLight',
    };
  }

  getDescription(): string {
    return `Bật đèn phòng — Topic: ${this.topicBase}`;
  }

  getCommandType(): string {
    return 'TurnOnLight';
  }
}
