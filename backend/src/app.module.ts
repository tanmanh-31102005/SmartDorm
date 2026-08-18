import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    // Load environment variables
    ConfigModule.forRoot({ isGlobal: true }),

    // Core
    PrismaModule,
    TelemetryModule,
    MqttModule,
    EventsModule,
    NotificationsModule,

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
})
export class AppModule {}
