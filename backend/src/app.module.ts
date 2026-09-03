import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { RoomsModule } from './rooms/rooms.module';
import { DevicesModule } from './devices/devices.module';
import { SensorsModule } from './sensors/sensors.module';
import { AccessLogModule } from './access-log/access-log.module';
import { EmergencyModule } from './emergency/emergency.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { MqttModule } from './mqtt/mqtt.module';
import { EventsModule } from './gateway/events.module';
import { NotificationsModule } from './notifications/notifications.module';
import { TelemetryModule } from './telemetry/telemetry.module';
import { IntelligenceModule } from './intelligence/intelligence.module';

import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [
    // Load environment variables
    ConfigModule.forRoot({ isGlobal: true }),

    // Rate Limiting — giới hạn 100 request/phút mặc định, auth có limit chặt hơn riêng
    ThrottlerModule.forRoot([
      {
        name: 'global',
        ttl: 60000,  // 1 phút
        limit: 100,  // tối đa 100 request/phút/IP
      },
    ]),

    // Core
    PrismaModule,
    TelemetryModule,
    MqttModule,
    EventsModule,
    NotificationsModule,
    SettingsModule,

    // Feature modules
    AuthModule,
    RoomsModule,
    DevicesModule,
    SensorsModule,
    AccessLogModule,
    EmergencyModule,
    AnalyticsModule,
    IntelligenceModule,
  ],
  // Áp dụng ThrottlerGuard toàn cục cho tất cả routes
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
