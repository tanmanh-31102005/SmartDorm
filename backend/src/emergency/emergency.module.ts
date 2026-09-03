import { Module, forwardRef } from '@nestjs/common';
import { EmergencyService } from './emergency.service';
import { EmergencyController } from './emergency.controller';
import { FireEmergencyStrategy } from './strategies/fire-emergency.strategy';
import { GasLeakEmergencyStrategy } from './strategies/gas-leak.strategy';
import { MqttModule } from '../mqtt/mqtt.module';
import { EventsModule } from '../gateway/events.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { DevicesModule } from '../devices/devices.module';

@Module({
  imports: [MqttModule, EventsModule, NotificationsModule, forwardRef(() => DevicesModule)],
  controllers: [EmergencyController],
  providers: [
    EmergencyService,
    FireEmergencyStrategy,
    GasLeakEmergencyStrategy,
  ],
  exports: [EmergencyService],
})
export class EmergencyModule {}
