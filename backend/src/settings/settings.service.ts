import { Injectable, Logger, BadRequestException } from '@nestjs/common';

export interface SystemSettings {
  tempWarning: number;
  tempCritical: number;
  gasWarning: number;
  gasCritical: number;
  powerWarningW: number;
  autoLockSec: number;
  mqttBroker: string;
  telegramBotToken: string;
  telegramChatId: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  autoMonthlyBillEnabled: boolean;
  dormElectricityRateVnd: number;
}

@Injectable()
export class SettingsService {
  private readonly logger = new Logger('SettingsService');

  // In-memory runtime settings initialized from env or defaults
  private settings: SystemSettings = {
    tempWarning: 38.0,
    tempCritical: 48.0,
    gasWarning: 35.0,
    gasCritical: 60.0,
    powerWarningW: 2500,
    autoLockSec: 5,
    mqttBroker: process.env.MQTT_BROKER_URL || 'mqtt://broker.hivemq.com:1883',
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '8732574383:AAGXiT1C6rz6vvUTBsUAnN8hNa5AKk9BpLY',
    telegramChatId: process.env.TELEGRAM_CHAT_ID || '1148791626',
    smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
    smtpPort: Number(process.env.SMTP_PORT) || 587,
    smtpUser: process.env.SMTP_USER || 'tanmanh312805@gmail.com',
    autoMonthlyBillEnabled: true,
    dormElectricityRateVnd: 2260,
  };

  getSettings(): SystemSettings {
    return { ...this.settings };
  }

  getThresholds() {
    return {
      tempWarning: this.settings.tempWarning,
      tempCritical: this.settings.tempCritical,
      gasWarning: this.settings.gasWarning,
      gasCritical: this.settings.gasCritical,
      powerWarningW: this.settings.powerWarningW,
      autoLockSec: this.settings.autoLockSec,
    };
  }

  updateSettings(dto: Partial<SystemSettings>): SystemSettings {
    // 1. Safety Constraints Validation (Ràng buộc an toàn vật lý)
    if (dto.tempWarning !== undefined && dto.tempWarning < 35.0) {
      throw new BadRequestException('Ngưỡng nhiệt độ cảnh báo không được thấp hơn 35.0°C (mức nhiệt môi trường an toàn).');
    }
    if (dto.tempCritical !== undefined && dto.tempCritical < 45.0) {
      throw new BadRequestException('Ngưỡng nhiệt độ khẩn cấp (báo cháy) không được thấp hơn 45.0°C.');
    }
    const effectiveTempWarn = dto.tempWarning ?? this.settings.tempWarning;
    const effectiveTempCrit = dto.tempCritical ?? this.settings.tempCritical;
    if (effectiveTempCrit <= effectiveTempWarn) {
      throw new BadRequestException('Ngưỡng nhiệt độ khẩn cấp phải cao hơn ngưỡng cảnh báo (Warning).');
    }

    if (dto.gasWarning !== undefined && dto.gasWarning < 20.0) {
      throw new BadRequestException('Ngưỡng khí gas cảnh báo không được thấp hơn 20.0% (tránh báo động giả do khói ẩm).');
    }
    if (dto.gasCritical !== undefined && dto.gasCritical < 40.0) {
      throw new BadRequestException('Ngưỡng khí gas khẩn cấp không được thấp hơn 40.0%.');
    }
    const effectiveGasWarn = dto.gasWarning ?? this.settings.gasWarning;
    const effectiveGasCrit = dto.gasCritical ?? this.settings.gasCritical;
    if (effectiveGasCrit <= effectiveGasWarn) {
      throw new BadRequestException('Ngưỡng khí gas khẩn cấp phải cao hơn ngưỡng cảnh báo (Warning).');
    }

    if (dto.autoLockSec !== undefined && (dto.autoLockSec < 2 || dto.autoLockSec > 60)) {
      throw new BadRequestException('Thời gian tự động khóa cửa phải từ 2 đến 60 giây.');
    }

    if (dto.powerWarningW !== undefined && dto.powerWarningW < 1000) {
      throw new BadRequestException('Ngưỡng công suất điện cảnh báo không được thấp hơn 1000W.');
    }

    // 2. Apply updates
    this.settings = {
      ...this.settings,
      ...dto,
    };

    this.logger.log(`System settings updated successfully: Temp=${this.settings.tempCritical}°C, Gas=${this.settings.gasCritical}%, TelegramChat=${this.settings.telegramChatId}`);
    return { ...this.settings };
  }
}
