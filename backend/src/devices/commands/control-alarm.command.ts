import { ICommand, CommandResult } from './command.interface';
import { MqttService } from '../../mqtt/mqtt.service';

export class ControlAlarmCommand implements ICommand {
  constructor(
    private readonly mqttService: MqttService,
    private readonly topicBase: string,
    private readonly deviceId: string,
    private readonly state: boolean, // true = on (siren/buzzer), false = off
  ) {}

  async execute(): Promise<CommandResult> {
    await this.mqttService.publish(
      `${this.topicBase}/command/alarm`,
      JSON.stringify({
        action: this.state ? 'on' : 'off',
        command_id: this.deviceId,
        timestamp: Date.now(),
      }),
    );
    return {
      success: true,
      message: `Còi báo động: ${this.state ? 'Đã kích hoạt hú còi' : 'Đã tắt còi báo'}`,
      deviceId: this.deviceId,
      timestamp: new Date(),
      commandType: this.getCommandType(),
    };
  }

  async undo(): Promise<CommandResult> {
    await this.mqttService.publish(
      `${this.topicBase}/command/alarm`,
      JSON.stringify({
        action: !this.state ? 'on' : 'off',
        command_id: `undo_${this.deviceId}`,
        timestamp: Date.now(),
      }),
    );
    return {
      success: true,
      message: `Còi báo động: ${!this.state ? 'Đã bật' : 'Đã tắt'} (undo)`,
      deviceId: this.deviceId,
      timestamp: new Date(),
      commandType: this.state ? 'TurnOffAlarm' : 'TurnOnAlarm',
    };
  }

  getDescription(): string {
    return `${this.state ? 'Kích hoạt' : 'Tắt'} còi báo động — Topic: ${this.topicBase}`;
  }

  getCommandType(): string {
    return this.state ? 'TurnOnAlarm' : 'TurnOffAlarm';
  }
}
