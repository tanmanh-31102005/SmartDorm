import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IEmergencyStrategy } from './strategies/emergency-strategy.interface';
import { FireEmergencyStrategy } from './strategies/fire-emergency.strategy';
import { GasLeakEmergencyStrategy } from './strategies/gas-leak.strategy';

/**
 * Strategy Pattern — EmergencyService
 * Chọn chiến lược xử lý tương ứng với loại sự cố
 * KHÔNG dùng if-else → tuân thủ Open/Closed Principle
 */
@Injectable()
export class EmergencyService {
  private readonly logger = new Logger('EmergencyService');
  private strategies: Map<string, IEmergencyStrategy>;
  private lastTriggerTime: Map<string, number> = new Map();
  private readonly COOLDOWN_MS = 30000; // 30s cooldown

  constructor(
    private readonly prisma: PrismaService,
    private readonly fireStrategy: FireEmergencyStrategy,
    private readonly gasStrategy: GasLeakEmergencyStrategy,
  ) {
    // Map type → strategy (dễ dàng thêm mới mà không sửa code)
    this.strategies = new Map<string, IEmergencyStrategy>();
    this.strategies.set('FIRE', this.fireStrategy);
    this.strategies.set('GAS_LEAK', this.gasStrategy);
  }

  /** Đăng ký thêm chiến lược mới (Open for Extension) */
  registerStrategy(type: string, strategy: IEmergencyStrategy) {
    this.strategies.set(type, strategy);
    this.logger.log(`Strategy registered: ${type}`);
  }

  async handleEmergency(
    type: string,
    roomId: string,
    buildingId: string,
    sensorData: any,
  ) {
    const strategy = this.strategies.get(type.toUpperCase());
    if (!strategy) {
      this.logger.warn(`No strategy for: ${type}`);
      return [];
    }

    const emergencyKey = `${roomId}_${type.toUpperCase()}`;
    const now = Date.now();
    const lastTime = this.lastTriggerTime.get(emergencyKey) || 0;
    if (now - lastTime < this.COOLDOWN_MS) {
      // Cooldown active: skip duplicate DB inserts & notifications
      return [];
    }
    this.lastTriggerTime.set(emergencyKey, now);

    // Lưu vào DB
    try {
      await this.prisma.emergency.create({
        data: {
          type:        type.toUpperCase(),
          level:       strategy.getLevel(),
          description: `Auto-detected: ${type}`,
          sensorValue: sensorData?.gas_level || sensorData?.temperature,
          roomId,
        },
      });
    } catch (e) {
      this.logger.warn('Emergency DB save failed: ' + e.message);
    }

    // Thực thi strategy
    return strategy.handle(roomId, buildingId, sensorData);
  }


  async getEmergencies(resolved?: boolean) {
    const where: any = {};
    if (resolved !== undefined) where.isResolved = resolved;
    return this.prisma.emergency.findMany({
      where,
      include: { room: { include: { building: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async resolveEmergency(id: string) {
    return this.prisma.emergency.update({
      where: { id },
      data: { isResolved: true, resolvedAt: new Date() },
    });
  }
}
