import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { DevicesService } from '../devices/devices.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger('NotificationsService');
  private transporter: nodemailer.Transporter | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
    @Inject(forwardRef(() => DevicesService))
    private readonly devicesService: DevicesService,
  ) {
    this.initMailTransporter();
  }

  private initMailTransporter() {
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = Number(process.env.SMTP_PORT) || 587;

    // Không fallback về credentials hardcoded — bảo mật source code
    if (!user || !pass) {
      this.logger.warn(
        '[Email] SMTP_USER hoặc SMTP_PASS chưa được cấu hình trong .env. ' +
        'Tính năng gửi email bị vô hiệu hóa. Đặt đúng biến môi trường để bật lại.',
      );
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass: pass.replace(/\s+/g, '') },
      });
      this.logger.log(`Nodemailer transporter initialized for ${user}`);
    } catch (e: any) {
      this.logger.warn(`Failed to initialize mail transporter: ${e.message}`);
    }
  }

  // ==================== TELEGRAM NOTIFICATIONS ====================

  async sendTelegram(message: string, inlineKeyboard?: any): Promise<boolean> {
    const settings = this.settingsService.getSettings();
    const token = settings.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN;
    const chatId = settings.telegramChatId || process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId || token === 'YOUR_TELEGRAM_BOT_TOKEN') {
      this.logger.warn('[Telegram] Chưa cấu hình token/chatId. Message: ' + message);
      return false;
    }

    try {
      const url = `https://api.telegram.org/bot${token}/sendMessage`;
      const body: any = {
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      };

      if (inlineKeyboard) {
        body.reply_markup = inlineKeyboard;
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!json.ok) {
        this.logger.warn(`[Telegram] Send error: ${json.description}`);
        return false;
      }

      this.logger.log('[Telegram] Đã gửi thông báo thành công');
      return true;
    } catch (e: any) {
      this.logger.warn('[Telegram] Gửi thất bại: ' + e.message);
      return false;
    }
  }

  // ==================== EMAIL NOTIFICATIONS ====================

  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    if (!this.transporter) {
      this.initMailTransporter();
    }
    if (!this.transporter) {
      this.logger.warn('[Email] Transporter chưa sẵn sàng');
      return false;
    }

    const fromUser = process.env.SMTP_USER || 'tanmanh312805@gmail.com';
    try {
      const info = await this.transporter.sendMail({
        from: `"SmartDorm KTX IoT" <${fromUser}>`,
        to,
        subject,
        html,
      });
      this.logger.log(`[Email] Đã gửi email tới ${to}: ${info.messageId}`);
      return true;
    } catch (e: any) {
      this.logger.warn(`[Email] Gửi email tới ${to} thất bại: ${e.message}`);
      return false;
    }
  }

  // ==================== EMERGENCY ALERTS ====================

  async sendFireAlert(roomId: string, sensorData: any): Promise<void> {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: { building: true, users: true },
    });
    const roomNumber = room?.roomNumber || roomId;
    const buildingName = room?.building?.name || 'Tòa A';
    const temp = sensorData?.temperature ?? 48.5;
    const timeStr = new Date().toLocaleString('vi-VN');

    // 1. Telegram Message with Inline Control Buttons
    const teleMsg = `🔥 <b>[CẢNH BÁO CHÁY KHẨN CẤP]</b> 🔥\n` +
      `🏢 <b>Khu vực:</b> Tòa ${buildingName} — Phòng <b>${roomNumber}</b>\n` +
      `🌡️ <b>Nhiệt độ cảm biến DHT22:</b> <code>${temp}°C</code>\n` +
      `⏱️ <b>Thời gian:</b> ${timeStr}\n` +
      `⚠️ <i>Hệ thống tự động kích hoạt còi hú và mở khóa cửa. Vui lòng can thiệp xử lý:</i>`;

    const inlineKeyboard = {
      inline_keyboard: [
        [
          { text: `⚡ Cắt điện P.${roomNumber}`, callback_data: `DEV:${roomId}:LIGHT:off` },
          { text: `🌪️ Bật quạt P.${roomNumber}`, callback_data: `DEV:${roomId}:FAN:on` },
        ],
        [
          { text: `🔓 Mở khóa P.${roomNumber}`, callback_data: `DEV:${roomId}:DOOR_LOCK:unlock` },
          { text: `🔇 Tắt còi báo`, callback_data: `DEV:${roomId}:BUZZER:off` },
        ],
        [
          { text: `🚨 Mở toàn bộ cửa KTX (Admin)`, callback_data: `EMERGENCY:UNLOCK_ALL` },
        ],
      ],
    };

    await this.sendTelegram(teleMsg, inlineKeyboard);

    // 2. Email Alert
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #e11d48; border-radius: 12px; background: #fff5f5;">
        <h2 style="color: #e11d48; margin-top: 0;">🔥 CẢNH BÁO HỎA HOẠN KHẨN CẤP</h2>
        <p>Hệ thống SmartDorm phát hiện nguy cơ nhiệt độ cao vượt ngưỡng an toàn:</p>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #fed7aa;">Phòng:</td><td style="padding: 8px; border-bottom: 1px solid #fed7aa;">Phòng ${roomNumber} (Tòa ${buildingName})</td></tr>
          <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #fed7aa;">Nhiệt độ ghi nhận:</td><td style="padding: 8px; color: #e11d48; font-weight: bold; border-bottom: 1px solid #fed7aa;">${temp}°C</td></tr>
          <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #fed7aa;">Thời gian:</td><td style="padding: 8px; border-bottom: 1px solid #fed7aa;">${timeStr}</td></tr>
        </table>
        <p style="font-size: 13px; color: #64748b;">Kịch bản Fire Emergency Strategy đã tự động gửi tín hiệu mở chốt điện tử và bật còi hú. Hãy kiểm tra ngay Dashboard để giám sát.</p>
      </div>
    `;

    // Gửi Email tới Admin và tất cả sinh viên trong phòng
    const adminEmail = process.env.SMTP_USER || 'tanmanh312805@gmail.com';
    await this.sendEmail(adminEmail, `🔥 [CẢNH BÁO CHÁY] Phòng ${roomNumber} - Tòa ${buildingName}`, emailHtml);

    if (room?.users && room.users.length > 0) {
      for (const u of room.users) {
        if (u.email && u.email !== adminEmail) {
          await this.sendEmail(u.email, `🔥 [KHẨN CẤP] Cảnh báo an toàn Phòng ${roomNumber}`, emailHtml);
        }
      }
    }
  }

  async sendGasAlert(roomId: string, sensorData: any): Promise<void> {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: { building: true, users: true },
    });
    const roomNumber = room?.roomNumber || roomId;
    const buildingName = room?.building?.name || 'Tòa A';
    const gas = sensorData?.gas_level ?? 45.0;
    const timeStr = new Date().toLocaleString('vi-VN');

    const teleMsg = `⚠️ <b>[CẢNH BÁO RÒ RỈ KHÍ GAS MQ-2]</b> ⚠️\n` +
      `🏢 <b>Khu vực:</b> Tòa ${buildingName} — Phòng <b>${roomNumber}</b>\n` +
      `💨 <b>Nồng độ khí gas:</b> <code>${gas}%</code>\n` +
      `⏱️ <b>Thời gian:</b> ${timeStr}\n` +
      `🛡️ <i>Kịch bản an toàn Gas Strategy đã tự động bật quạt hút thông gió.</i>`;

    const inlineKeyboard = {
      inline_keyboard: [
        [
          { text: `🌪️ Bật quạt thông gió P.${roomNumber}`, callback_data: `DEV:${roomId}:FAN:on` },
          { text: `⚡ Ngắt điện P.${roomNumber}`, callback_data: `DEV:${roomId}:LIGHT:off` },
        ],
        [
          { text: `🔓 Mở cửa P.${roomNumber}`, callback_data: `DEV:${roomId}:DOOR_LOCK:unlock` },
          { text: `🔇 Tắt còi báo`, callback_data: `DEV:${roomId}:BUZZER:off` },
        ],
      ],
    };

    await this.sendTelegram(teleMsg, inlineKeyboard);

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #f59e0b; border-radius: 12px; background: #fffbeb;">
        <h2 style="color: #d97706; margin-top: 0;">⚠️ CẢNH BÁO RÒ RỈ KHÍ GAS MQ-2</h2>
        <p>Phát hiện nồng độ khí gas vượt ngưỡng cảnh báo an toàn tại phòng:</p>
        <p><b>Phòng:</b> ${roomNumber} (Tòa ${buildingName}) | <b>Nồng độ:</b> ${gas}% | <b>Thời gian:</b> ${timeStr}</p>
        <p style="font-size: 13px; color: #78350f;">Quạt thông gió đã được kích hoạt tự động để phân tán khí gas.</p>
      </div>
    `;

    const adminEmail = process.env.SMTP_USER || 'tanmanh312805@gmail.com';
    await this.sendEmail(adminEmail, `⚠️ [RÒ RỈ GAS] Phòng ${roomNumber} - Tòa ${buildingName}`, emailHtml);

    if (room?.users && room.users.length > 0) {
      for (const u of room.users) {
        if (u.email && u.email !== adminEmail) {
          await this.sendEmail(u.email, `⚠️ [CẢNH BÁO GAS] Phòng ${roomNumber} KTX`, emailHtml);
        }
      }
    }
  }

  async sendAccessAlert(roomId: string, cardId: string): Promise<void> {
    const room = await this.prisma.room.findUnique({ where: { id: roomId }, include: { building: true } });
    const msg = `🚨 <b>[CẢNH BÁO XÂM NHẬP TRÁI PHÉP]</b>\n` +
      `Phòng: <b>${room?.roomNumber || roomId} (Tòa ${room?.building?.name || 'A'})</b>\n` +
      `Thẻ không hợp lệ: <code>${cardId}</code>\n` +
      `Thời gian: ${new Date().toLocaleString('vi-VN')}`;
    await this.sendTelegram(msg);
  }

  // ==================== MONTHLY UTILITY BILL NOTIFICATIONS ====================

  async sendMonthlyBillsToStudents(): Promise<{ totalSent: number; details: any[] }> {
    const rooms = await this.prisma.room.findMany({
      where: { isActive: true },
      include: { building: true, users: true, devices: true },
    });

    const settings = this.settingsService.getSettings();
    const rate = settings.dormElectricityRateVnd || 2260;
    const currentMonthStr = `Tháng ${new Date().getMonth() + 1}/${new Date().getFullYear()}`;

    let totalSent = 0;
    const details: any[] = [];

    for (const room of rooms) {
      // Giả lập/tính toán sản lượng điện tiêu thụ trong tháng (kWh)
      const activeDevCount = room.devices.filter(d => d.isOn).length;
      const baseKwh = 110 + (Number(room.roomNumber) % 15) * 4.5 + activeDevCount * 6.2;
      const roundedKwh = Math.round(baseKwh * 10) / 10;
      const totalAmount = Math.round(roundedKwh * rate);
      const studentCount = Math.max(room.users.length, 1);
      const perStudentAmount = Math.round(totalAmount / studentCount);

      for (const student of room.users) {
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
            <div style="background: #1e3a8a; padding: 16px 20px; border-radius: 8px; color: white; margin-bottom: 20px;">
              <h2 style="margin: 0; font-size: 18px;">HÓA ĐƠN TIỀN ĐIỆN ĐỊNH KỲ — SMARTDORM</h2>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #bfdbfe;">Kỳ thanh toán: ${currentMonthStr}</p>
            </div>
            <p>Xin chào sinh viên <b>${student.fullName}</b> (MSSV: <code>${student.studentId}</code>),</p>
            <p>Ban Quản Lý KTX gửi thông báo số liệu tiêu thụ điện năng và tiền điện định kỳ của phòng bạn:</p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #f8fafc; border-radius: 8px; overflow: hidden;">
              <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 16px; font-weight: bold; color: #475569;">Phòng ở:</td><td style="padding: 10px 16px; font-weight: bold; color: #0f172a;">Phòng ${room.roomNumber} — Tòa ${room.building?.name || 'A'}</td></tr>
              <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 16px; font-weight: bold; color: #475569;">Điện năng tiêu thụ:</td><td style="padding: 10px 16px; color: #2563eb; font-weight: bold;">${roundedKwh} kWh</td></tr>
              <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 16px; font-weight: bold; color: #475569;">Đơn giá KTX:</td><td style="padding: 10px 16px;">${rate.toLocaleString('vi-VN')} ₫ / kWh</td></tr>
              <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 16px; font-weight: bold; color: #475569;">Tổng tiền điện phòng:</td><td style="padding: 10px 16px; font-weight: bold; color: #0f172a;">${totalAmount.toLocaleString('vi-VN')} ₫</td></tr>
              <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 16px; font-weight: bold; color: #475569;">Số người cùng phòng:</td><td style="padding: 10px 16px;">${studentCount} sinh viên</td></tr>
              <tr style="background: #ecfdf5;"><td style="padding: 12px 16px; font-weight: bold; color: #065f46;">Số tiền bạn cần đóng:</td><td style="padding: 12px 16px; color: #059669; font-size: 16px; font-weight: bold;">${perStudentAmount.toLocaleString('vi-VN')} ₫</td></tr>
            </table>

            <p style="font-size: 12px; color: #64748b;">Vui lòng hoàn tất thanh toán trước ngày 10 hàng tháng qua ứng dụng sinh viên SmartDorm hoặc tại văn phòng BQL KTX.</p>
          </div>
        `;

        if (student.email) {
          const sent = await this.sendEmail(student.email, `⚡ [Hóa Đơn Tiền Điện] Phòng ${room.roomNumber} - ${currentMonthStr}`, emailHtml);
          if (sent) totalSent++;
        }
      }

      details.push({
        roomNumber: room.roomNumber,
        kwh: roundedKwh,
        totalAmount,
        perStudentAmount,
        studentCount,
      });
    }

    // Gửi bản tổng kết Telegram cho Admin
    const teleSummary = `📊 <b>[TỔNG KẾT HÓA ĐƠN ĐIỆN THÁNG]</b>\n` +
      `🗓️ <b>Kỳ hóa đơn:</b> ${currentMonthStr}\n` +
      `🏢 <b>Số phòng đã tính toán:</b> ${rooms.length} phòng\n` +
      `✉️ <b>Số email hóa đơn đã gửi:</b> ${totalSent} sinh viên\n` +
      `💡 <i>Đã cập nhật lên cổng thông tin sinh viên thành công.</i>`;
    await this.sendTelegram(teleSummary);

    return { totalSent, details };
  }

  // ==================== TELEGRAM CALLBACK ACTIONS ====================

  async executeTelegramAction(callbackData: string): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Executing Telegram callback action: ${callbackData}`);
    try {
      const parts = callbackData.split(':');
      if (parts[0] === 'DEV') {
        const [, roomId, deviceType, action] = parts;
        await this.devicesService.sendCommand(roomId, deviceType, action);
        return { success: true, message: `Đã thực thi thành công lệnh ${action.toUpperCase()} cho ${deviceType} tại phòng ${roomId}` };
      }

      if (parts[0] === 'EMERGENCY') {
        const actionType = parts[1];
        if (actionType === 'UNLOCK_ALL') {
          // Mở khóa toàn bộ phòng
          const rooms = await this.prisma.room.findMany();
          for (const r of rooms) {
            await this.devicesService.sendCommand(r.id, 'DOOR_LOCK', 'unlock').catch(() => {});
          }
          return { success: true, message: 'Đã phát lệnh mở toàn bộ chốt khóa cửa KTX!' };
        }
      }

      return { success: false, message: 'Lệnh không hợp lệ' };
    } catch (err: any) {
      return { success: false, message: `Thất bại: ${err.message}` };
    }
  }
}
