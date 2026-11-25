import { Injectable, NotFoundException, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MqttService } from '../mqtt/mqtt.service';
import { EventsGateway } from '../gateway/events.gateway';
import { CommandInvokerService } from './commands/command-invoker.service';
import { TurnOnLightCommand } from './commands/turn-on-light.command';
import { TurnOffLightCommand } from './commands/turn-off-light.command';
import { ToggleFanCommand } from './commands/toggle-fan.command';
import { ControlDoorCommand } from './commands/control-door.command';
import { ControlAlarmCommand } from './commands/control-alarm.command';

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
   * cập nhật cơ sở dữ liệu, ghi nhận CommandLog chuẩn cho các thao tác nút bấm/thẻ RFID,
   * và phát sóng realtime lên Web UI
   */
  private async handleHardwareStatusSync(topic: string, data: any) {
    const parts = topic.split('/');
    const building = parts[1] || data.building || 'A';
    const roomNum = parts[3] || data.room || '101';

    const buildingRec = await this.prisma.building.findFirst({ where: { name: building } });
    const room = buildingRec
      ? await this.prisma.room.findFirst({ where: { roomNumber: roomNum, buildingId: buildingRec.id }, include: { building: true } })
      : await this.prisma.room.findFirst({ where: { roomNumber: roomNum }, include: { building: true } });

    if (!room) return;

    // Lấy danh sách thiết bị hiện tại trong phòng
    let devices = await this.prisma.device.findMany({ where: { roomId: room.id } });

    // Đảm bảo cả 4 loại thiết bị đều tồn tại
    const deviceTypes = ['LIGHT', 'FAN', 'DOOR_LOCK', 'BUZZER'];
    for (const dType of deviceTypes) {
      if (!devices.some(d => d.type === dType)) {
        const newD = await this.prisma.device.create({
          data: {
            name: `${dType === 'LIGHT' ? 'Đèn Chiếu Sáng' : dType === 'FAN' ? 'Quạt Thông Gió' : dType === 'DOOR_LOCK' ? 'Khóa Cửa Điện Tử' : 'Còi Báo Động'} P.${room.roomNumber}`,
            type: dType as any,
            roomId: room.id,
            isOn: false,
            isOnline: true,
          },
        }).catch(() => null);
        if (newD) devices.push(newD);
      }
    }

    const lightDev = devices.find(d => d.type === 'LIGHT');
    const fanDev = devices.find(d => d.type === 'FAN');
    const doorDev = devices.find(d => d.type === 'DOOR_LOCK');
    const buzzerDev = devices.find(d => d.type === 'BUZZER');

    const isLightOn = data.light !== undefined 
      ? Boolean(data.light) 
      : (data.light_1 !== undefined ? Boolean(data.light_1 || data.light_2 || data.light_3) : undefined);
    const isFanOn = data.fan !== undefined ? Boolean(data.fan) : undefined;
    const isDoorOpen = data.door !== undefined 
      ? (data.door === 'unlocked' || data.door === 'open') 
      : (data.door_lock !== undefined ? !data.door_lock : undefined);
    const isAlarmOn = data.alarm !== undefined ? Boolean(data.alarm) : undefined;

    // Kiểm tra xem đây có phải là phản hồi ACK từ lệnh Web/Telegram gửi xuống hay không
    const trigger = String(data.trigger || '');
    const isFromCommandAck = ['LIGHT_COMMAND', 'FAN_COMMAND', 'DOOR_COMMAND', 'ALARM_COMMAND'].includes(trigger);

    // Cập nhật các lệnh PENDING_ACK của phòng này thành ACK_SUCCESS
    if (isFromCommandAck) {
      await this.prisma.commandLog.updateMany({
        where: {
          deviceId: { in: devices.map(d => d.id) },
          status: 'PENDING_ACK',
        },
        data: { status: 'ACK_SUCCESS' },
      }).catch(() => {});
    }

    // Nhận diện nguồn kích hoạt vật lý trên thiết bị ESP32
    const isPhysicalBtnLight = trigger === 'PHYSICAL_BTN_LIGHT';
    const isPhysicalBtnFan = trigger === 'PHYSICAL_BTN_FAN' || (trigger === 'FAN_TOGGLE' && !isFromCommandAck);
    const isPhysicalDoor = trigger === 'PHYSICAL_RFID_DOOR' || trigger === 'AUTO_RELOCK_DOOR' || (trigger === 'DOOR_TOGGLE' && !isFromCommandAck);
    const isPhysicalAlarm = trigger === 'ALARM_TOGGLE' && !isFromCommandAck;

    // Bắt thay đổi trạng thái nếu phần cứng tự thay đổi mà không qua lệnh Web
    const lightChanged = isLightOn !== undefined && lightDev && lightDev.isOn !== isLightOn;
    const fanChanged = isFanOn !== undefined && fanDev && fanDev.isOn !== isFanOn;
    const doorChanged = isDoorOpen !== undefined && doorDev && doorDev.isOn !== isDoorOpen;
    const alarmChanged = isAlarmOn !== undefined && buzzerDev && buzzerDev.isOn !== isAlarmOn;

    const adminUser = await this.prisma.user.findFirst();

    // 1. Đồng bộ Đèn (LIGHT)
    if (isLightOn !== undefined && lightDev) {
      await this.prisma.device.update({ where: { id: lightDev.id }, data: { isOn: isLightOn } }).catch(() => {});
      const isPhysicalLightAction = isPhysicalBtnLight || (lightChanged && !isFromCommandAck);

      if (isPhysicalLightAction && adminUser) {
        const actionLabel = isLightOn ? 'BẬT' : 'TẮT';
        const now = new Date();
        const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const dateStr = now.toLocaleDateString('vi-VN');
        const desc = `${actionLabel} Đèn Chiếu Sáng (Nút bấm vật lý ESP32) — P.${room.roomNumber} (Tòa ${room.building?.name || 'A'})`;

        const logRecord = await this.prisma.commandLog.create({
          data: {
            commandType: isLightOn ? 'LIGHT_ON' : 'LIGHT_OFF',
            payload: JSON.stringify({
              action: isLightOn ? 'ON' : 'OFF',
              deviceType: 'LIGHT',
              source: 'HARDWARE',
              trigger: trigger || 'PHYSICAL_BTN_LIGHT',
              targetRoom: room.roomNumber,
              building: room.building?.name || 'A',
            }),
            status: 'ACK_SUCCESS',
            deviceId: lightDev.id,
            userId: adminUser.id,
          },
        }).catch(() => null);

        this.eventsGateway.broadcastDeviceStatus(room.id, {
          deviceType: 'LIGHT',
          action: isLightOn ? 'on' : 'off',
          isOn: isLightOn,
          source: 'HARDWARE',
          isCommand: true,
          commandId: logRecord?.id,
          description: desc,
          time: timeStr,
          date: dateStr,
          room: room.roomNumber,
          roomNumber: room.roomNumber,
          building: room.building?.name || 'A',
        });

        if (logRecord) {
          this.eventsGateway.broadcastCommandLog({
            id: logRecord.id,
            type: 'LIGHT',
            commandType: isLightOn ? 'LIGHT_ON' : 'LIGHT_OFF',
            action: actionLabel,
            status: 'Thành công',
            description: desc,
            executedAt: logRecord.executedAt,
            time: timeStr,
            date: dateStr,
            payload: logRecord.payload,
            user: 'Nút bấm vật lý (ESP32)',
          });
        }
      } else {
        this.eventsGateway.broadcastDeviceStatus(room.id, {
          deviceType: 'LIGHT',
          action: isLightOn ? 'on' : 'off',
          isOn: isLightOn,
          source: isFromCommandAck ? 'COMMAND' : 'TELEMETRY_SYNC',
          isCommand: false,
          room: room.roomNumber,
        });
      }
    }

    // 2. Đồng bộ Quạt (FAN)
    if (isFanOn !== undefined && fanDev) {
      await this.prisma.device.update({ where: { id: fanDev.id }, data: { isOn: isFanOn } }).catch(() => {});
      const isPhysicalFanAction = isPhysicalBtnFan || (fanChanged && !isFromCommandAck);

      if (isPhysicalFanAction && adminUser) {
        const actionLabel = isFanOn ? 'BẬT' : 'TẮT';
        const now = new Date();
        const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const dateStr = now.toLocaleDateString('vi-VN');
        const desc = `${actionLabel} Quạt Thông Gió (Nút bấm vật lý ESP32) — P.${room.roomNumber} (Tòa ${room.building?.name || 'A'})`;

        const logRecord = await this.prisma.commandLog.create({
          data: {
            commandType: isFanOn ? 'FAN_ON' : 'FAN_OFF',
            payload: JSON.stringify({
              action: isFanOn ? 'ON' : 'OFF',
              deviceType: 'FAN',
              source: 'HARDWARE',
              trigger: trigger || 'PHYSICAL_BTN_FAN',
              targetRoom: room.roomNumber,
              building: room.building?.name || 'A',
            }),
            status: 'ACK_SUCCESS',
            deviceId: fanDev.id,
            userId: adminUser.id,
          },
        }).catch(() => null);

        this.eventsGateway.broadcastDeviceStatus(room.id, {
          deviceType: 'FAN',
          action: isFanOn ? 'on' : 'off',
          isOn: isFanOn,
          source: 'HARDWARE',
          isCommand: true,
          commandId: logRecord?.id,
          description: desc,
          time: timeStr,
          date: dateStr,
          room: room.roomNumber,
          roomNumber: room.roomNumber,
          building: room.building?.name || 'A',
        });

        if (logRecord) {
          this.eventsGateway.broadcastCommandLog({
            id: logRecord.id,
            type: 'FAN',
            commandType: isFanOn ? 'FAN_ON' : 'FAN_OFF',
            action: actionLabel,
            status: 'Thành công',
            description: desc,
            executedAt: logRecord.executedAt,
            time: timeStr,
            date: dateStr,
            payload: logRecord.payload,
            user: 'Nút bấm vật lý (ESP32)',
          });
        }
      } else {
        this.eventsGateway.broadcastDeviceStatus(room.id, {
          deviceType: 'FAN',
          action: isFanOn ? 'on' : 'off',
          isOn: isFanOn,
          source: isFromCommandAck ? 'COMMAND' : 'TELEMETRY_SYNC',
          isCommand: false,
          room: room.roomNumber,
        });
      }
    }

    // 3. Đồng bộ Khóa Cửa (DOOR_LOCK)
    if (isDoorOpen !== undefined && doorDev) {
      await this.prisma.device.update({ where: { id: doorDev.id }, data: { isOn: isDoorOpen } }).catch(() => {});
      const isPhysicalDoorAction = isPhysicalDoor || (doorChanged && !isFromCommandAck);

      if (isPhysicalDoorAction && adminUser) {
        const isAutoRelock = trigger === 'AUTO_RELOCK_DOOR';
        const actionLabel = isDoorOpen ? 'MỞ KHÓA' : 'KHÓA';
        const sourceNote = isAutoRelock ? '(Tự động đóng chốt)' : '(Quẹt thẻ RFID ESP32)';
        const now = new Date();
        const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const dateStr = now.toLocaleDateString('vi-VN');
        const desc = `${actionLabel} Khóa Cửa Điện Tử ${sourceNote} — P.${room.roomNumber} (Tòa ${room.building?.name || 'A'})`;

        const logRecord = await this.prisma.commandLog.create({
          data: {
            commandType: isDoorOpen ? 'DOOR_LOCK_UNLOCK' : 'DOOR_LOCK_LOCK',
            payload: JSON.stringify({
              action: isDoorOpen ? 'UNLOCK' : 'LOCK',
              deviceType: 'DOOR_LOCK',
              source: 'HARDWARE',
              trigger: trigger || 'PHYSICAL_RFID_DOOR',
              targetRoom: room.roomNumber,
              building: room.building?.name || 'A',
            }),
            status: 'ACK_SUCCESS',
            deviceId: doorDev.id,
            userId: adminUser.id,
          },
        }).catch(() => null);

        this.eventsGateway.broadcastDeviceStatus(room.id, {
          deviceType: 'DOOR_LOCK',
          action: isDoorOpen ? 'unlock' : 'lock',
          isOn: isDoorOpen,
          source: 'HARDWARE',
          isCommand: true,
          commandId: logRecord?.id,
          description: desc,
          time: timeStr,
          date: dateStr,
          room: room.roomNumber,
          roomNumber: room.roomNumber,
          building: room.building?.name || 'A',
        });

        if (logRecord) {
          this.eventsGateway.broadcastCommandLog({
            id: logRecord.id,
            type: 'DOOR_LOCK',
            commandType: isDoorOpen ? 'DOOR_LOCK_UNLOCK' : 'DOOR_LOCK_LOCK',
            action: actionLabel,
            status: 'Thành công',
            description: desc,
            executedAt: logRecord.executedAt,
            time: timeStr,
            date: dateStr,
            payload: logRecord.payload,
            user: isAutoRelock ? 'Hệ thống tự động ESP32' : 'Quẹt thẻ RFID (ESP32)',
          });
        }
      } else {
        this.eventsGateway.broadcastDeviceStatus(room.id, {
          deviceType: 'DOOR_LOCK',
          action: isDoorOpen ? 'unlock' : 'lock',
          isOn: isDoorOpen,
          source: isFromCommandAck ? 'COMMAND' : 'TELEMETRY_SYNC',
          isCommand: false,
          room: room.roomNumber,
        });
      }
    }

    // 4. Đồng bộ Còi Báo Động (BUZZER)
    if (isAlarmOn !== undefined && buzzerDev) {
      await this.prisma.device.update({ where: { id: buzzerDev.id }, data: { isOn: isAlarmOn } }).catch(() => {});
      const isPhysicalAlarmAction = isPhysicalAlarm || (alarmChanged && !isFromCommandAck);

      if (isPhysicalAlarmAction && adminUser) {
        const actionLabel = isAlarmOn ? 'KÍCH HOẠT HÚ CÒI' : 'TẮT CÒI';
        const now = new Date();
        const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const dateStr = now.toLocaleDateString('vi-VN');
        const desc = `${actionLabel} Còi Báo Động (Phần cứng ESP32) — P.${room.roomNumber} (Tòa ${room.building?.name || 'A'})`;

        const logRecord = await this.prisma.commandLog.create({
          data: {
            commandType: isAlarmOn ? 'BUZZER_ON' : 'BUZZER_OFF',
            payload: JSON.stringify({
              action: isAlarmOn ? 'ON' : 'OFF',
              deviceType: 'BUZZER',
              source: 'HARDWARE',
              trigger: trigger || 'ALARM_TOGGLE',
              targetRoom: room.roomNumber,
              building: room.building?.name || 'A',
            }),
            status: 'ACK_SUCCESS',
            deviceId: buzzerDev.id,
            userId: adminUser.id,
          },
        }).catch(() => null);

        this.eventsGateway.broadcastDeviceStatus(room.id, {
          deviceType: 'BUZZER',
          action: isAlarmOn ? 'on' : 'off',
          isOn: isAlarmOn,
          source: 'HARDWARE',
          isCommand: true,
          commandId: logRecord?.id,
          description: desc,
          time: timeStr,
          date: dateStr,
          room: room.roomNumber,
          roomNumber: room.roomNumber,
          building: room.building?.name || 'A',
        });

        if (logRecord) {
          this.eventsGateway.broadcastCommandLog({
            id: logRecord.id,
            type: 'BUZZER',
            commandType: isAlarmOn ? 'BUZZER_ON' : 'BUZZER_OFF',
            action: actionLabel,
            status: 'Thành công',
            description: desc,
            executedAt: logRecord.executedAt,
            time: timeStr,
            date: dateStr,
            payload: logRecord.payload,
            user: 'Phần cứng ESP32',
          });
        }
      } else {
        this.eventsGateway.broadcastDeviceStatus(room.id, {
          deviceType: 'BUZZER',
          action: isAlarmOn ? 'on' : 'off',
          isOn: isAlarmOn,
          source: isFromCommandAck ? 'COMMAND' : 'TELEMETRY_SYNC',
          isCommand: false,
          room: room.roomNumber,
        });
      }
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
      case 'LIGHT_TOGGLE': {
        const curDev = await this.prisma.device.findUnique({ where: { id: deviceId } });
        command = curDev?.isOn
          ? new TurnOffLightCommand(this.mqttService, topicBase, deviceId)
          : new TurnOnLightCommand(this.mqttService, topicBase, deviceId);
        break;
      }
      case 'FAN_ON':
        command = new ToggleFanCommand(this.mqttService, topicBase, deviceId, true);
        break;
      case 'FAN_OFF':
        command = new ToggleFanCommand(this.mqttService, topicBase, deviceId, false);
        break;
      case 'FAN_TOGGLE': {
        const curDev = await this.prisma.device.findUnique({ where: { id: deviceId } });
        command = new ToggleFanCommand(this.mqttService, topicBase, deviceId, !curDev?.isOn);
        break;
      }
      case 'DOOR_LOCK_UNLOCK':
      case 'DOOR_LOCK_OPEN':
        command = new ControlDoorCommand(this.mqttService, topicBase, deviceId, 'unlock');
        break;
      case 'DOOR_LOCK_LOCK':
      case 'DOOR_LOCK_CLOSE':
        command = new ControlDoorCommand(this.mqttService, topicBase, deviceId, 'lock');
        break;
      case 'BUZZER_ON':
      case 'BUZZER_TRUE':
      case 'ALARM_ON':
      case 'ALARM_TRUE':
        command = new ControlAlarmCommand(this.mqttService, topicBase, deviceId, true);
        break;
      case 'BUZZER_OFF':
      case 'BUZZER_FALSE':
      case 'ALARM_OFF':
      case 'ALARM_FALSE':
        command = new ControlAlarmCommand(this.mqttService, topicBase, deviceId, false);
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

    // 5. Ghi nhận CommandLog với trạng thái ban đầu ACK_SUCCESS / PENDING_ACK
    let logRecord: any = null;
    if (effectiveUserId) {
      logRecord = await this.prisma.commandLog.create({
        data: {
          commandType: `${deviceType}_${action.toUpperCase()}`,
          payload: JSON.stringify({ action, deviceType, targetRoom: room.roomNumber, topic: topicBase }),
          status: result.success ? 'ACK_SUCCESS' : 'FAILED_DISPATCH',
          deviceId: device.id,
          userId: effectiveUserId,
        },
      }).catch((err) => {
        this.logger.error(`Error saving command log: ${err.message}`);
        return null;
      });
    }

    // 6. Broadcast sự kiện lệnh đã được phát đi tới các Observer
    const nextIsOn = action === 'on' || action === 'unlock' || action === 'open';
    const actionLabel = action === 'on' ? 'BẬT' : action === 'off' ? 'TẮT' : action === 'unlock' ? 'MỞ KHÓA' : 'KHÓA';
    const devLabel = device.name || deviceType;
    const now = new Date();
    const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateStr = now.toLocaleDateString('vi-VN');
    const desc = `${actionLabel} ${devLabel} — P.${room.roomNumber} (Tòa ${room.building?.name || 'A'})`;

    this.eventsGateway.broadcastDeviceStatus(realRoomId, {
      deviceType,
      action,
      isOn: nextIsOn,
      status: 'ACK_SUCCESS',
      commandId: logRecord?.id,
      success: result.success,
      isCommand: true,
      source: 'COMMAND',
      description: desc,
      time: timeStr,
      date: dateStr,
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
      lifecycle: 'ACK_SUCCESS',
      commandId: logRecord?.id,
      description: desc,
      time: timeStr,
      date: dateStr,
    };
  }

  async undoLastCommand() {
    return this.commandInvoker.undoLastCommand();
  }

  async getCommandHistory() {
    try {
      const dbLogs = await this.prisma.commandLog.findMany({
        take: 60,
        orderBy: { executedAt: 'desc' },
        include: { device: { include: { room: { include: { building: true } } } }, user: true },
      });

      if (dbLogs.length > 0) {
        const formattedLogs: any[] = [];
        for (const log of dbLogs) {
          // Lọc bỏ các thông điệp telemetry định kỳ không phải thao tác người dùng hay nút bấm
          if (
            log.commandType.includes('StatusReport') ||
            log.commandType.includes('PeriodicTelemetry') ||
            log.commandType.includes('ESP32_BOOT')
          ) {
            continue;
          }

          let p: any = {};
          try {
            p = JSON.parse(log.payload);
          } catch {}

          let devType = log.device?.type || p.deviceType || '';
          let devName = log.device?.name || '';
          let roomNum = p.targetRoom || log.device?.room?.roomNumber || '101';
          let bldgName = p.building || log.device?.room?.building?.name || 'A';
          let actionText = '';
          let sourceText = '';
          let userName = log.user?.fullName || 'Hệ thống Admin';

          // Xử lý bản ghi lịch sử dạng cũ HardwareACK:...
          if (log.commandType.startsWith('HardwareACK:')) {
            const trg = p.trigger || log.commandType.replace('HardwareACK:', '');
            if (trg.includes('LIGHT')) {
              devType = 'LIGHT';
              devName = 'Đèn Chiếu Sáng';
              actionText = p.light ? 'BẬT' : 'TẮT';
              sourceText = '(Nút bấm vật lý ESP32)';
              userName = 'Nút bấm vật lý (ESP32)';
            } else if (trg.includes('FAN')) {
              devType = 'FAN';
              devName = 'Quạt Thông Gió';
              actionText = p.fan ? 'BẬT' : 'TẮT';
              sourceText = '(Nút bấm vật lý ESP32)';
              userName = 'Nút bấm vật lý (ESP32)';
            } else if (trg.includes('DOOR')) {
              devType = 'DOOR_LOCK';
              devName = 'Khóa Cửa Điện Tử';
              const isOpen = p.door === 'unlocked' || p.door_lock === false;
              actionText = isOpen ? 'MỞ KHÓA' : 'KHÓA';
              sourceText = '(Quẹt thẻ RFID ESP32)';
              userName = 'Quẹt thẻ RFID (ESP32)';
            } else if (trg.includes('ALARM') || trg.includes('BUZZER')) {
              devType = 'BUZZER';
              devName = 'Còi Báo Động';
              actionText = p.alarm ? 'KÍCH HOẠT HÚ CÒI' : 'TẮT CÒI';
              sourceText = '(Phần cứng ESP32)';
              userName = 'Phần cứng ESP32';
            } else {
              continue; // Bỏ qua nếu là ACK không rõ
            }
          } else {
            // Lệnh chuẩn mới
            if (!devType) {
              if (log.commandType.startsWith('LIGHT')) devType = 'LIGHT';
              else if (log.commandType.startsWith('FAN')) devType = 'FAN';
              else if (log.commandType.startsWith('DOOR')) devType = 'DOOR_LOCK';
              else if (log.commandType.startsWith('BUZZER') || log.commandType.startsWith('ALARM')) devType = 'BUZZER';
            }

            if (!devName) {
              if (devType === 'LIGHT') devName = 'Đèn Chiếu Sáng';
              else if (devType === 'FAN') devName = 'Quạt Thông Gió';
              else if (devType === 'DOOR_LOCK') devName = 'Khóa Cửa Điện Tử';
              else if (devType === 'BUZZER') devName = 'Còi Báo Động';
              else devName = devType;
            }

            const cmd = log.commandType.toUpperCase();
            if (cmd.includes('UNLOCK') || cmd.includes('OPEN')) actionText = 'MỞ KHÓA';
            else if (cmd.includes('LOCK') || cmd.includes('CLOSE')) actionText = 'KHÓA';
            else if (cmd.endsWith('_ON') || cmd.includes('BẬT')) {
              actionText = devType === 'BUZZER' ? 'KÍCH HOẠT HÚ CÒI' : 'BẬT';
            } else if (cmd.endsWith('_OFF') || cmd.includes('TẮT')) {
              actionText = devType === 'BUZZER' ? 'TẮT CÒI' : 'TẮT';
            } else if (p.action) {
              const act = String(p.action).toUpperCase();
              actionText = act === 'ON' ? 'BẬT' : act === 'OFF' ? 'TẮT' : act === 'UNLOCK' ? 'MỞ KHÓA' : act === 'LOCK' ? 'KHÓA' : act;
            } else {
              actionText = 'THAO TÁC';
            }

            if (p.source === 'HARDWARE') {
              sourceText = p.trigger?.includes('RFID') 
                ? '(Quẹt thẻ RFID ESP32)' 
                : p.trigger?.includes('AUTO_RELOCK') 
                ? '(Tự động đóng chốt)' 
                : '(Nút bấm vật lý ESP32)';
              userName = p.trigger?.includes('RFID') 
                ? 'Quẹt thẻ RFID (ESP32)' 
                : p.trigger?.includes('AUTO_RELOCK') 
                ? 'Hệ thống tự động ESP32' 
                : 'Nút bấm vật lý (ESP32)';
            } else if (p.source === 'TELEGRAM') {
              sourceText = '(Telegram Bot)';
              userName = 'Telegram Bot';
            }
          }

          const desc = `${actionText} ${devName}${sourceText ? ' ' + sourceText : ''} — P.${roomNum} (Tòa ${bldgName})`;
          const execDate = new Date(log.executedAt);

          formattedLogs.push({
            id: log.id,
            type: devType,
            commandType: log.commandType,
            action: actionText,
            status: 'Thành công',
            description: desc,
            executedAt: log.executedAt,
            time: execDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            date: execDate.toLocaleDateString('vi-VN'),
            payload: log.payload,
            user: userName,
          });

          if (formattedLogs.length >= 50) break;
        }

        return formattedLogs;
      }
    } catch (err: any) {
      this.logger.error(`getCommandHistory error: ${err.message}`);
    }
    return this.commandInvoker.getHistory();
  }
}
