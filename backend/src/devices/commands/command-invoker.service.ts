import { Injectable, Logger } from '@nestjs/common';
import { ICommand, CommandResult } from './command.interface';

/**
 * Command Invoker — Quản lý lịch sử lệnh và hỗ trợ Undo
 * Tách biệt người gửi lệnh (Controller) và người thực thi (MQTT)
 */
@Injectable()
export class CommandInvokerService {
  private readonly logger = new Logger('CommandInvoker');
  private commandHistory: ICommand[] = [];
  private readonly MAX_HISTORY = 50;

  async executeCommand(command: ICommand): Promise<CommandResult> {
    this.logger.log(`Executing: ${command.getDescription()}`);
    const result = await command.execute();
    if (result.success) {
      this.commandHistory.push(command);
      // Giới hạn lịch sử
      if (this.commandHistory.length > this.MAX_HISTORY) {
        this.commandHistory.shift();
      }
    }
    return result;
  }

  async undoLastCommand(): Promise<CommandResult | null> {
    const lastCommand = this.commandHistory.pop();
    if (!lastCommand) {
      this.logger.warn('No command to undo');
      return null;
    }
    this.logger.log(`Undoing: ${lastCommand.getDescription()}`);
    return lastCommand.undo();
  }

  getHistory(): Array<{ description: string; type: string }> {
    return this.commandHistory.map(cmd => ({
      description: cmd.getDescription(),
      type: cmd.getCommandType(),
    }));
  }

  clearHistory(): void {
    this.commandHistory = [];
  }
}
