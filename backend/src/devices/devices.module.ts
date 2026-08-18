import { Module } from '@nestjs/common';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';
import { CommandInvokerService } from './commands/command-invoker.service';
import { MqttModule } from '../mqtt/mqtt.module';
import { EventsModule } from '../gateway/events.module';

@Module({
  imports: [MqttModule, EventsModule],
  controllers: [DevicesController],
  providers: [DevicesService, CommandInvokerService],
  exports: [DevicesService, CommandInvokerService],
})
export class DevicesModule {}
