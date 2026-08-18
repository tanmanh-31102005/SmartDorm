import { Module, forwardRef } from '@nestjs/common';
import { SensorsController } from './sensors.controller';
import { SensorsService } from './sensors.service';
import { MqttModule } from '../mqtt/mqtt.module';
import { EventsModule } from '../gateway/events.module';
import { EmergencyModule } from '../emergency/emergency.module';

@Module({
  imports: [MqttModule, EventsModule, forwardRef(() => EmergencyModule)],
  controllers: [SensorsController],
  providers: [SensorsService],
  exports: [SensorsService],
})
export class SensorsModule {}
