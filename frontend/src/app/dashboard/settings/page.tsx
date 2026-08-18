'use client';
import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastContext';
import { 
  Settings, 
  Thermometer, 
  Flame, 
  Lock, 
  Radio, 
  Bell, 
  CheckCircle2, 
  Save, 
  RefreshCw,
  Server,
  ShieldCheck
} from 'lucide-react';

export default function SettingsPage() {
  const { success } = useToast();
  const [tempThreshold, setTempThreshold] = useState('45.0');
  const [gasThreshold, setGasThreshold] = useState('40.0');
  const [autoLockSec, setAutoLockSec] = useState('5');
  const [mqttBroker, setMqttBroker] = useState('mqtt://localhost:1883');
  const [telegramWebhook, setTelegramWebhook] = useState('https://api.telegram.org/bot.../sendMessage');
  const [saving, setSaving] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      success('Đã lưu cấu hình ngưỡng an toàn & tham số hệ thống thành công!', 'Cài Đặt');
    }, 600);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Cài Đặt Hệ Thống & Ngưỡng Kích Hoạt IoT</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Thiết lập tham số kích hoạt Strategy Pattern, kết nối MQTT Broker và phân quyền thông báo an ninh.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="neutral" size="md">
            Phiên bản: SmartDorm Engine v2.4.0
          </Badge>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Thresholds Card */}
        <div className="admin-card p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Thermometer className="w-4 h-4 text-blue-900" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Ngưỡng Cảnh Báo Cảm Biến Vi Khí Hậu (Strategy Pattern Triggers)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Ngưỡng Nhiệt Độ Kích Hoạt Cháy (°C)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  value={tempThreshold}
                  onChange={(e) => setTempThreshold(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-900"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">°C</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Khi vượt mức này, Fire Strategy tự động kích hoạt còi hú</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Ngưỡng Cảnh Báo Khí Gas MQ-2 (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  value={gasThreshold}
                  onChange={(e) => setGasThreshold(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-900"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">%</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Khi vượt 40%, Gas Strategy tự động bật quạt hút</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Thời Gian Tự Động Khóa Cửa (Giây)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={autoLockSec}
                  onChange={(e) => setAutoLockSec(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-900"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">giây</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Chốt cửa điện tử tự động đóng sau khi quẹt thẻ</p>
            </div>
          </div>
        </div>

        {/* Network & MQTT Configuration Card */}
        <div className="admin-card p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Radio className="w-4 h-4 text-blue-900" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Kết Nối Hạ Tầng Mạng & MQTT Broker
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                MQTT Broker Endpoint
              </label>
              <input
                type="text"
                value={mqttBroker}
                onChange={(e) => setMqttBroker(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 outline-none focus:bg-white focus:border-blue-900"
              />
              <p className="text-[11px] text-slate-400 mt-1">Giao thức MQTT v3.1.1 (QoS Level 1)</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Webhook Thông Báo Telegram Khẩn Cấp
              </label>
              <input
                type="text"
                value={telegramWebhook}
                onChange={(e) => setTelegramWebhook(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 outline-none focus:bg-white focus:border-blue-900"
              />
              <p className="text-[11px] text-slate-400 mt-1">Tự động push tin nhắn cho Ban Quản Lý khi có sự cố</p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <Button
            type="submit"
            variant="primary"
            loading={saving}
            icon={<Save className="w-4 h-4" />}
          >
            Lưu Toàn Bộ Cài Đặt
          </Button>
        </div>
      </form>
    </div>
  );
}
