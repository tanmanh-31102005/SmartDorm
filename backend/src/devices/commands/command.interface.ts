/**
 * Command Pattern — Interface
 * Mọi lệnh điều khiển thiết bị phải implement interface này
 */
export interface ICommand {
  execute(): Promise<CommandResult>;
  undo(): Promise<CommandResult>;
  getDescription(): string;
  getCommandType(): string;
}

export interface CommandResult {
  success: boolean;
  message: string;
  deviceId: string;
  timestamp: Date;
  commandType: string;
}
