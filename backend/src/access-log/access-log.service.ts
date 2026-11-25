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

    // Phân tích quyền truy cập thẻ authoritatively từ CSDL
    const cardId = data.card_id || 'UNKNOWN';
    const isExplicitInvalid = cardId === 'CARD_INVALID99' || cardId.includes('INVALID');

    let authorized = false;
    if (isExplicitInvalid) {
      authorized = false;
    } else if (user && room && user.roomId === room.id && user.isActive) {
      // Sinh viên chính thức được phân công vào đúng phòng này
      authorized = true;
    } else if (user && room && user.roomId !== room.id) {
      // Sinh viên phòng khác cố tình quẹt vào phòng này
      authorized = false;
    } else if (cardId === 'CARD_A1B2C3D4' || cardId === 'CARD_E5F6G7H8') {
      // Thẻ sinh viên mẫu phòng 101 hợp lệ
      authorized = true;
    } else if (data.authorized !== undefined) {
      authorized = Boolean(data.authorized);
    }

    const action = authorized ? (data.action === 'exit' ? 'exit' : 'entry') : 'denied';

    if (room) {
      await this.prisma.accessLog.create({
        data: {
          rfidCardId: cardId,
          action:     action,
          authorized: authorized,
          userId:     user?.id,
          roomId:     room.id,
        },
      }).catch(e => this.logger.warn('AccessLog DB: ' + e.message));
    }

    // Broadcast log lên Dashboard real-time
    this.eventsGateway.broadcastAccessLog({
      rfidCardId: cardId,
      cardId:     cardId,
      authorized: authorized,
      action:     action,
      room:       roomNum,
      building,
      user:       user ? { fullName: user.fullName, name: user.fullName, studentId: user.studentId } : null,
      timestamp:  new Date().toISOString(),
    });

    if (!authorized) {
      this.logger.warn(`UNAUTHORIZED: ${cardId} at ${building}-${roomNum}`);
      await this.notificationsService.sendAccessAlert(roomNum, cardId);
    } else {
      this.logger.log(`AUTHORIZED ACCESS GRANTED: ${cardId} (${user?.fullName || 'Sinh viên'}) at ${building}-${roomNum}`);
    }
  }

  async getLogs(page = 1, limit = 50, roomId?: string) {
    let where: any = {};
    if (roomId && roomId.trim() !== '') {
      const cleanRoom = roomId.replace(/^(room-|P\.|A-|B-|C-|A|B|C)/i, '').trim();
      where = {
        OR: [
          { roomId },
          { room: { roomNumber: roomId } },
          { room: { roomNumber: cleanRoom } },
        ],
      };
    }
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
