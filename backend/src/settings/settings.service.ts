import { Injectable, Logger, BadRequestException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
export class SettingsService implements OnModuleInit {
  private readonly logger = new Logger('SettingsService');

  constructor(private readonly prisma: PrismaService) {}

  // Runtime cache initialized from env/defaults and hydrated from DB on startup
  private settings: SystemSettings = {
    tempWarning: 38.0,
    tempCritical: 48.0,
    gasWarning: 35.0,
    gasCritical: 60.0,
    powerWarningW: 2500,
    autoLockSec: 5,
    mqttBroker: process.env.MQTT_BROKER_URL || 'mqtt://broker.hivemq.com:1883',
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
    telegramChatId: process.env.TELEGRAM_CHAT_ID || '',
    smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
    smtpPort: Number(process.env.SMTP_PORT) || 587,
    smtpUser: process.env.SMTP_USER || '',
    autoMonthlyBillEnabled: true,
    dormElectricityRateVnd: 2260,
  };

  async onModuleInit() {
    try {
      const saved = await this.prisma.systemSetting.findUnique({ where: { id: 'default' } });
      if (saved) {
        this.settings = {
          tempWarning: saved.tempWarning,
          tempCritical: saved.tempCritical,
          gasWarning: saved.gasWarning,
          gasCritical: saved.gasCritical,
          powerWarningW: saved.powerWarningW,
          autoLockSec: saved.autoLockSec,
          mqttBroker: saved.mqttBroker || this.settings.mqttBroker,
          telegramBotToken: saved.telegramBotToken || this.settings.telegramBotToken,
          telegramChatId: saved.telegramChatId || this.settings.telegramChatId,
          smtpHost: saved.smtpHost || this.settings.smtpHost,
          smtpPort: saved.smtpPort || this.settings.smtpPort,
          smtpUser: saved.smtpUser || this.settings.smtpUser,
          autoMonthlyBillEnabled: saved.autoMonthlyBillEnabled,
          dormElectricityRateVnd: saved.dormElectricityRateVnd,
        };
        this.logger.log('Loaded persisted SystemSetting from database.');
      } else {
        await this.prisma.systemSetting.create({
          data: { id: 'default', ...this.settings },
        });
        this.logger.log('Initialized default SystemSetting in database.');
      }
    } catch (err: any) {
      this.logger.warn(`Could not load/init SystemSetting from DB (using defaults): ${err?.message}`);
    }
  }

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

  async updateSettings(dto: Partial<SystemSettings>): Promise<SystemSettings> {
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

    // 2. Apply updates & persist to database
    const nextSettings: SystemSettings = {
      ...this.settings,
      ...dto,
      smtpPort: Number(dto.smtpPort ?? this.settings.smtpPort) || 587,
      autoLockSec: Number(dto.autoLockSec ?? this.settings.autoLockSec) || 5,
      tempWarning: Number(dto.tempWarning ?? this.settings.tempWarning),
      tempCritical: Number(dto.tempCritical ?? this.settings.tempCritical),
      gasWarning: Number(dto.gasWarning ?? this.settings.gasWarning),
      gasCritical: Number(dto.gasCritical ?? this.settings.gasCritical),
      powerWarningW: Number(dto.powerWarningW ?? this.settings.powerWarningW),
      dormElectricityRateVnd: Number(dto.dormElectricityRateVnd ?? this.settings.dormElectricityRateVnd),
    };
    this.settings = nextSettings;

    try {
      await this.prisma.systemSetting.upsert({
        where: { id: 'default' },
        update: { ...nextSettings },
        create: { id: 'default', ...nextSettings },
      });
    } catch (err: any) {
      this.logger.warn(`Failed to persist SystemSetting to DB: ${err?.message}`);
    }

    this.logger.log(`System settings updated & persisted: Temp=${this.settings.tempCritical}°C, Gas=${this.settings.gasCritical}%, TelegramChat=${this.settings.telegramChatId}`);
    return { ...this.settings };
  }
}
