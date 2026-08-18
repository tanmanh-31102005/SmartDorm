import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger('NotificationsService');

  async sendFireAlert(roomId: string, sensorData: any): Promise<void> {
    const msg = `🔥 Cảnh báo CHÁY!\nPhòng: ${roomId}\nNhiệt độ: ${sensorData?.temperature}°C\nThời gian: ${new Date().toLocaleString('vi-VN')}`;
    await this.sendTelegram(msg);
    this.logger.error(msg);
  }

  async sendGasAlert(roomId: string, sensorData: any): Promise<void> {
    const msg = `⚠️ Cảnh báo KHÍ GAS!\nPhòng: ${roomId}\nMức gas: ${sensorData?.gas_level}%\nThời gian: ${new Date().toLocaleString('vi-VN')}`;
    await this.sendTelegram(msg);
    this.logger.error(msg);
  }

  async sendAccessAlert(roomId: string, cardId: string): Promise<void> {
    const msg = `🚨 Xâm nhập trái phép!\nPhòng: ${roomId}\nThẻ: ${cardId}\nThời gian: ${new Date().toLocaleString('vi-VN')}`;
    await this.sendTelegram(msg);
  }

  private async sendTelegram(message: string): Promise<void> {
    const token  = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId || token === 'YOUR_TELEGRAM_BOT_TOKEN') {
      this.logger.warn('[Telegram] Chưa cấu hình. Message: ' + message);
      return;
    }
    try {
      const url = `https://api.telegram.org/bot${token}/sendMessage`;
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: message }),
      });
      this.logger.log('[Telegram] Đã gửi thông báo');
    } catch (e) {
      this.logger.warn('[Telegram] Gửi thất bại: ' + e.message);
    }
  }
}
