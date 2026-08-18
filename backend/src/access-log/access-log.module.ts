import { Module } from '@nestjs/common';
import { AccessLogService } from './access-log.service';
import { AccessLogController } from './access-log.controller';
import { MqttModule } from '../mqtt/mqtt.module';
import { EventsModule } from '../gateway/events.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [MqttModule, EventsModule, NotificationsModule],
  controllers: [AccessLogController],
  providers: [AccessLogService],
})
export class AccessLogModule {}
