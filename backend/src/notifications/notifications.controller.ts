import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('test-telegram')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Gửi thử tin nhắn Telegram với các nút điều khiển' })
  async testTelegram() {
    const msg = `🔔 <b>[SMARTDORM TEST NOTIFICATION]</b>\n` +
      `Hệ thống kiểm tra kết nối Telegram Bot thành công!\n` +
      `⏱️ Thời gian: ${new Date().toLocaleString('vi-VN')}\n` +
      `💡 <i>Bạn có thể bấm các nút bên dưới để điều khiển thử thiết bị:</i>`;

    const inlineKeyboard = {
      inline_keyboard: [
        [
          { text: '⚡ Bật Đèn P.101', callback_data: 'DEV:room-101:LIGHT:on' },
          { text: '⚡ Tắt Đèn P.101', callback_data: 'DEV:room-101:LIGHT:off' },
        ],
        [
          { text: '🌪️ Bật Quạt P.101', callback_data: 'DEV:room-101:FAN:on' },
          { text: '🌪️ Tắt Quạt P.101', callback_data: 'DEV:room-101:FAN:off' },
        ],
      ],
    };

    const sent = await this.notificationsService.sendTelegram(msg, inlineKeyboard);
    return { success: sent, message: sent ? 'Đã gửi tin nhắn Telegram thành công!' : 'Gửi tin nhắn Telegram thất bại, vui lòng kiểm tra bot token/chat id' };
  }

  @Post('test-email')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Gửi thử email cảnh báo' })
  async testEmail(@Body('to') to?: string) {
    const targetEmail = to || process.env.SMTP_USER || 'tanmanh312805@gmail.com';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #1e3a8a;">🔔 Thử Nghiệm Thông Báo Email SmartDorm</h2>
        <p>Hệ thống máy chủ SmartDorm KTX IoT đã kết nối thành công tới Gmail SMTP.</p>
        <p><b>Người nhận:</b> ${targetEmail}</p>
        <p><b>Thời gian gửi:</b> ${new Date().toLocaleString('vi-VN')}</p>
      </div>
    `;
    const sent = await this.notificationsService.sendEmail(targetEmail, '🔔 [SmartDorm] Thử nghiệm thông báo Email thành công', html);
    return { success: sent, message: sent ? `Đã gửi email thử nghiệm tới ${targetEmail}` : 'Gửi email thất bại, kiểm tra cấu hình SMTP' };
  }

  @Post('send-monthly-bills')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kích hoạt gửi thông báo hóa đơn điện định kỳ tháng' })
  async sendMonthlyBills() {
    return this.notificationsService.sendMonthlyBillsToStudents();
  }

  @Post('telegram-action')
  @ApiOperation({ summary: 'Thực thi lệnh từ nút bấm Telegram (Webhook / Action Link)' })
  async handleTelegramAction(@Body('callbackData') callbackData: string) {
    return this.notificationsService.executeTelegramAction(callbackData);
  }
}
