import { Injectable, NotFoundException, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MqttService } from '../mqtt/mqtt.service';
import { EventsGateway } from '../gateway/events.gateway';
import { CommandInvokerService } from './commands/command-invoker.service';
import { TurnOnLightCommand } from './commands/turn-on-light.command';
import { TurnOffLightCommand } from './commands/turn-off-light.command';
import { ToggleFanCommand } from './commands/toggle-fan.command';
import { ControlDoorCommand } from './commands/control-door.command';

@Injectable()
export class DevicesService implements OnModuleInit {
  private readonly logger = new Logger('DevicesService');

  constructor(
    private prisma: PrismaService,
    private mqttService: MqttService,
    private eventsGateway: EventsGateway,
    private commandInvoker: CommandInvokerService,
  ) {}

  onModuleInit() {
    this.mqttService.on('message', async ({ topic, message }) => {
      if (topic.includes('/status')) {
        await this.handleHardwareStatusSync(topic, message);
      }
    });
  }

  /**
   * Đồng bộ 2 chiều: Khi phần cứng Wokwi / ESP32 đổi trạng thái,
   * cập nhật cơ sở dữ liệu và phát sóng realtime lên Web
   */
  private async handleHardwareStatusSync(topic: string, data: any) {
    const parts = topic.split('/');
    const building = parts[1] || data.building || 'A';
    const roomNum = parts[3] || data.room || '101';

    const buildingRec = await this.prisma.building.findFirst({ where: { name: building } });
    const room = buildingRec
      ? await this.prisma.room.findFirst({ where: { roomNumber: roomNum, buildingId: buildingRec.id } })
      : await this.prisma.room.findFirst({ where: { roomNumber: roomNum } });

    if (!room) return;

    // 1. Đồng bộ Đèn (LIGHT)
    if (data.light !== undefined || data.light_1 !== undefined) {
      const isLightOn = Boolean(data.light ?? (data.light_1 || data.light_2 || data.light_3));
      await this.prisma.device.updateMany({
        where: { roomId: room.id, type: 'LIGHT' },
        data: { isOn: isLightOn },
      }).catch(() => {});

      this.eventsGateway.broadcastDeviceStatus(room.id, {
        deviceType: 'LIGHT',
        action: isLightOn ? 'on' : 'off',
        isOn: isLightOn,
        source: 'WOKWI_HARDWARE',
      });
    }

    // 2. Đồng bộ Quạt (FAN)
    if (data.fan !== undefined) {
      const isFanOn = Boolean(data.fan);
      await this.prisma.device.updateMany({
        where: { roomId: room.id, type: 'FAN' },
        data: { isOn: isFanOn },
      }).catch(() => {});

      this.eventsGateway.broadcastDeviceStatus(room.id, {
        deviceType: 'FAN',
        action: isFanOn ? 'on' : 'off',
        isOn: isFanOn,
        source: 'WOKWI_HARDWARE',
      });
    }

    // 3. Đồng bộ Khóa Cửa (DOOR_LOCK)
    if (data.door !== undefined || data.door_lock !== undefined) {
      const isDoorOpen = data.door === 'unlocked' || data.door === 'open' || data.door_lock === false;
      await this.prisma.device.updateMany({
        where: { roomId: room.id, type: 'DOOR_LOCK' },
        data: { isOn: isDoorOpen },
      }).catch(() => {});

      this.eventsGateway.broadcastDeviceStatus(room.id, {
        deviceType: 'DOOR_LOCK',
        action: isDoorOpen ? 'unlock' : 'lock',
        isOn: isDoorOpen,
        source: 'WOKWI_HARDWARE',
      });
    }

    // 4. Đồng bộ Còi Báo Động (BUZZER)
    if (data.alarm !== undefined) {
      const isAlarmOn = Boolean(data.alarm);
      await this.prisma.device.updateMany({
        where: { roomId: room.id, type: 'BUZZER' },
        data: { isOn: isAlarmOn },
      }).catch(() => {});

      this.eventsGateway.broadcastDeviceStatus(room.id, {
        deviceType: 'BUZZER',
        action: isAlarmOn ? 'on' : 'off',
        isOn: isAlarmOn,
        source: 'WOKWI_HARDWARE',
      });
    }

    // 5. Cập nhật các lệnh PENDING_ACK gần nhất thành ACK_SUCCESS
    const anyDevice = await this.prisma.device.findFirst({ where: { roomId: room.id } });
    if (anyDevice) {
      await this.prisma.commandLog.updateMany({
        where: {
          deviceId: anyDevice.id,
          status: 'PENDING_ACK',
        },
        data: {
          status: 'ACK_SUCCESS',
        },
      }).catch(() => {});
    }

    // 6. Ghi bản ghi kiểm toán đồng bộ phần cứng
    const adminUser = await this.prisma.user.findFirst();
    if (adminUser && anyDevice) {
      await this.prisma.commandLog.create({
        data: {
          commandType: `HardwareACK:${data.trigger || 'StatusReport'}`,
          payload: JSON.stringify(data),
          status: 'ACK_SUCCESS',
          deviceId: anyDevice.id,
          userId: adminUser.id,
        },
      }).catch(() => {});
    }
  }


  private buildTopicBase(building: string, floor: string, room: string): string {
    return `dormitory/${building}/${floor}/${room}`;
  }

  async getDevicesByRoom(roomId: string) {
    return this.prisma.device.findMany({
      where: { roomId },
      orderBy: { type: 'asc' },
    });
  }


  async sendCommand(
    roomId: string,
    deviceType: string,
    action: string,
    userId?: string,
  ) {
    // 1. Tìm phòng theo ID hoặc roomNumber
    let room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: { building: true },
    }).catch(() => null);

    if (!room) {
      const cleanRoom = roomId.replace(/^(room-|P\.|A-|B-|C-|A|B|C)/i, '').trim();
      room = await this.prisma.room.findFirst({
        where: {
          OR: [
            { roomNumber: roomId },
            { roomNumber: cleanRoom },
            { roomNumber: { contains: cleanRoom } },
          ],
        },
        include: { building: true },
      });
    }

    if (!room) {
      room = await this.prisma.room.findFirst({ include: { building: true } });
    }

    if (!room) throw new NotFoundException(`Room '${roomId}' not found`);

    const realRoomId = room.id;
    const topicBase = this.buildTopicBase(
      room.building.name,
      room.floor.toString(),
      room.roomNumber,
    );

    // 2. Tìm hoặc tạo thiết bị tương ứng
    let device = await this.prisma.device.findFirst({
      where: { roomId: realRoomId, type: deviceType as any },
    });
    if (!device) {
      device = await this.prisma.device.create({
        data: {
          name: `${deviceType} P.${room.roomNumber}`,
          type: deviceType as any,
          roomId: realRoomId,
          isOn: false,
          isOnline: true,
        },
      });
    }

    const deviceId = device.id;

    // 3. Chọn Command tương ứng (Command Pattern)
    let command;
    switch (`${deviceType}_${action}`.toUpperCase()) {
      case 'LIGHT_ON':
        command = new TurnOnLightCommand(this.mqttService, topicBase, deviceId);
        break;
      case 'LIGHT_OFF':
        command = new TurnOffLightCommand(this.mqttService, topicBase, deviceId);
        break;
      case 'FAN_ON':
        command = new ToggleFanCommand(this.mqttService, topicBase, deviceId, true);
        break;
      case 'FAN_OFF':
        command = new ToggleFanCommand(this.mqttService, topicBase, deviceId, false);
        break;
      case 'DOOR_LOCK_UNLOCK':
      case 'DOOR_LOCK_OPEN':
        command = new ControlDoorCommand(this.mqttService, topicBase, deviceId, 'unlock');
        break;
      case 'DOOR_LOCK_LOCK':
      case 'DOOR_LOCK_CLOSE':
        command = new ControlDoorCommand(this.mqttService, topicBase, deviceId, 'lock');
        break;
      default:
        command = new TurnOnLightCommand(this.mqttService, topicBase, deviceId);
        break;
    }

    // 4. Thực thi lệnh qua Invoker & Gửi MQTT
    const result = await this.commandInvoker.executeCommand(command);

    let effectiveUserId = userId;
    if (!effectiveUserId) {
      const defaultUser = await this.prisma.user.findFirst();
      effectiveUserId = defaultUser?.id;
    }

    // 5. Ghi nhận CommandLog với trạng thái ban đầu PENDING_ACK (chờ phần cứng xác nhận)
    let logRecord: any = null;
    if (effectiveUserId) {
      logRecord = await this.prisma.commandLog.create({
        data: {
          commandType: result.commandType,
          payload: JSON.stringify({ action, deviceType, targetRoom: room.roomNumber, topic: topicBase }),
          status: result.success ? 'PENDING_ACK' : 'FAILED_DISPATCH',
          deviceId: device.id,
          userId: effectiveUserId,
        },
      }).catch(() => null);
    }

    // 6. Broadcast sự kiện lệnh đã được phát đi tới các Observer
    const nextIsOn = action === 'on' || action === 'unlock' || action === 'open';
    this.eventsGateway.broadcastDeviceStatus(realRoomId, {
      deviceType,
      action,
      isOn: nextIsOn,
      status: 'DISPATCHED_WAITING_ACK',
      commandId: logRecord?.id,
      success: result.success,
    });

    // 7. Cập nhật trạng thái dự kiến an toàn (Optimistic with ACK reconciliation)
    await this.prisma.device.updateMany({
      where: { roomId: realRoomId, type: deviceType as any },
      data: { isOn: nextIsOn },
    }).catch(() => {});

    this.logger.log(`Command '${deviceType}:${action}' dispatched to topic ${topicBase}. Waiting for hardware status ACK.`);

    return { 
      ...result, 
      isOn: nextIsOn, 
      roomId: realRoomId,
      lifecycle: 'ACK_AWAITING',
      commandId: logRecord?.id 
    };
  }

  async undoLastCommand() {
    return this.commandInvoker.undoLastCommand();
  }

  async getCommandHistory() {
    try {
      const dbLogs = await this.prisma.commandLog.findMany({
        take: 50,
        orderBy: { executedAt: 'desc' },
        include: { device: { include: { room: true } }, user: true },
      });
      if (dbLogs.length > 0) {
        return dbLogs.map(log => ({
          id: log.id,
          type: log.commandType,
          commandType: log.commandType,
          status: log.status,
          description: `Lệnh ${log.commandType} — ${log.device?.name || 'Thiết bị'} (P.${log.device?.room?.roomNumber || ''})`,
          executedAt: log.executedAt,
          time: new Date(log.executedAt).toLocaleTimeString('vi-VN'),
          payload: log.payload,
          user: log.user?.fullName,
        }));
      }
    } catch {}
    return this.commandInvoker.getHistory();
  }
}
