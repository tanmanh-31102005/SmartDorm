import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MqttService } from '../mqtt/mqtt.service';
import { EventsGateway } from '../gateway/events.gateway';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AccessLogService implements OnModuleInit {
  private readonly logger = new Logger('AccessLogService');

  constructor(
    private prisma: PrismaService,
    private mqttService: MqttService,
    private eventsGateway: EventsGateway,
    private notificationsService: NotificationsService,
  ) {}

  onModuleInit() {
    this.mqttService.on('message', async ({ topic, message }) => {
      if (topic.includes('/access/rfid')) {
        await this.handleRfidAccess(topic, message);
      }
    });
  }

  private async handleRfidAccess(topic: string, data: any) {
    const parts    = topic.split('/');
    const building = parts[1];
    const roomNum  = parts[3];

    const user = data.card_id
      ? await this.prisma.user.findFirst({ where: { rfidCardId: data.card_id } })
      : null;

    const buildingRec = await this.prisma.building.findFirst({ where: { name: building } });
    const room = buildingRec
      ? await this.prisma.room.findFirst({ where: { roomNumber: roomNum, buildingId: buildingRec.id } })
      : null;

    if (room) {
      await this.prisma.accessLog.create({
        data: {
          rfidCardId: data.card_id || 'UNKNOWN',
          action:     data.action  || 'entry',
          authorized: data.authorized ?? true,
          userId:     user?.id,
          roomId:     room.id,
        },
      }).catch(e => this.logger.warn('AccessLog DB: ' + e.message));
    }

    // Broadcast log lên Dashboard real-time
    this.eventsGateway.broadcastAccessLog({
      rfidCardId: data.card_id,
      cardId:     data.card_id,
      authorized: data.authorized,
      action:     data.action,
      room:       roomNum,
      building,
      user:       user ? { fullName: user.fullName, name: user.fullName, studentId: user.studentId } : null,
      timestamp:  new Date().toISOString(),
    });

    if (!data.authorized) {
      this.logger.warn(`UNAUTHORIZED: ${data.card_id} at ${building}-${roomNum}`);
      await this.notificationsService.sendAccessAlert(roomNum, data.card_id);
    }
  }

  async getLogs(page = 1, limit = 50, roomId?: string) {
    const where: any = roomId ? { roomId } : {};
    const [logs, total] = await Promise.all([
      this.prisma.accessLog.findMany({
        where,
        include: {
          user: { select: { fullName: true, studentId: true } },
          room: { include: { building: true } },
        },
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.accessLog.count({ where }),
    ]);
    return { logs, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
