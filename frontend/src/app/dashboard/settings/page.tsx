'use client';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastContext';
import api from '@/lib/api';
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
  Send,
  Mail,
  Zap,
  DollarSign,
  AlertTriangle,
  ShieldCheck,
  Cpu,
  Info
} from 'lucide-react';

export default function SettingsPage() {
  const { success, error, info } = useToast();
  
  // Settings Form States
  const [tempWarning, setTempWarning] = useState('38.0');
  const [tempCritical, setTempCritical] = useState('48.0');
  const [gasWarning, setGasWarning] = useState('35.0');
  const [gasCritical, setGasCritical] = useState('60.0');
  const [powerWarningW, setPowerWarningW] = useState('2500');
  const [autoLockSec, setAutoLockSec] = useState('5');
  const [mqttBroker, setMqttBroker] = useState('mqtt://broker.hivemq.com:1883');
  const [telegramBotToken, setTelegramBotToken] = useState('8732574383:AAGXiT1C6rz6vvUTBsUAnN8hNa5AKk9BpLY');
  const [telegramChatId, setTelegramChatId] = useState('1148791626');
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('tanmanh312805@gmail.com');
  const [dormElectricityRateVnd, setDormElectricityRateVnd] = useState('2260');
  const [autoMonthlyBillEnabled, setAutoMonthlyBillEnabled] = useState(true);

  // Action Loading States
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testingTele, setTestingTele] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [sendingBills, setSendingBills] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const res = await api.get('/settings');
        if (res.data) {
          const s = res.data;
          if (s.tempWarning !== undefined) setTempWarning(String(s.tempWarning));
          if (s.tempCritical !== undefined) setTempCritical(String(s.tempCritical));
          if (s.gasWarning !== undefined) setGasWarning(String(s.gasWarning));
          if (s.gasCritical !== undefined) setGasCritical(String(s.gasCritical));
          if (s.powerWarningW !== undefined) setPowerWarningW(String(s.powerWarningW));
          if (s.autoLockSec !== undefined) setAutoLockSec(String(s.autoLockSec));
          if (s.mqttBroker) setMqttBroker(s.mqttBroker);
          if (s.telegramBotToken) setTelegramBotToken(s.telegramBotToken);
          if (s.telegramChatId) setTelegramChatId(s.telegramChatId);
          if (s.smtpHost) setSmtpHost(s.smtpHost);
          if (s.smtpPort) setSmtpPort(String(s.smtpPort));
          if (s.smtpUser) setSmtpUser(s.smtpUser);
          if (s.dormElectricityRateVnd) setDormElectricityRateVnd(String(s.dormElectricityRateVnd));
          if (s.autoMonthlyBillEnabled !== undefined) setAutoMonthlyBillEnabled(s.autoMonthlyBillEnabled);
        }
      } catch (err) {
        console.warn('Load settings fallback', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    // Client-side validation checks
    const tw = parseFloat(tempWarning);
    const tc = parseFloat(tempCritical);
    const gw = parseFloat(gasWarning);
    const gc = parseFloat(gasCritical);
    const pw = parseInt(powerWarningW, 10);
    const al = parseInt(autoLockSec, 10);

    if (tw < 35.0) {
      error('Ngưỡng nhiệt độ cảnh báo không được thấp hơn 35.0°C.', 'Ràng buộc an toàn');
      return;
    }
    if (tc < 45.0) {
      error('Ngưỡng nhiệt độ khẩn cấp (báo cháy) không được thấp hơn 45.0°C.', 'Ràng buộc an toàn');
      return;
    }
    if (tc <= tw) {
      error('Ngưỡng nhiệt độ khẩn cấp phải cao hơn ngưỡng cảnh báo (Warning).', 'Ràng buộc an toàn');
      return;
    }
    if (gw < 20.0) {
      error('Ngưỡng khí gas cảnh báo không được thấp hơn 20.0%.', 'Ràng buộc an toàn');
      return;
    }
    if (gc < 40.0) {
      error('Ngưỡng khí gas khẩn cấp không được thấp hơn 40.0%.', 'Ràng buộc an toàn');
      return;
    }
    if (gc <= gw) {
      error('Ngưỡng khí gas khẩn cấp phải cao hơn ngưỡng cảnh báo (Warning).', 'Ràng buộc an toàn');
      return;
    }
    if (al < 2 || al > 60) {
      error('Thời gian tự động khóa cửa phải từ 2 đến 60 giây.', 'Ràng buộc an toàn');
      return;
    }
    if (pw < 1000) {
      error('Ngưỡng công suất điện cảnh báo không được thấp hơn 1000W.', 'Ràng buộc an toàn');
      return;
    }

    setSaving(true);
    try {
      await api.put('/settings', {
        tempWarning: tw,
        tempCritical: tc,
        gasWarning: gw,
        gasCritical: gc,
        powerWarningW: pw,
        autoLockSec: al,
        mqttBroker,
        telegramBotToken,
        telegramChatId,
        smtpHost,
        smtpPort: parseInt(smtpPort, 10),
        smtpUser,
        dormElectricityRateVnd: parseInt(dormElectricityRateVnd, 10),
        autoMonthlyBillEnabled,
      });
      success('Đã lưu cấu hình ngưỡng an toàn & tham số hệ thống thành công!', 'Cài Đặt');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Lỗi lưu cấu hình';
      error(typeof msg === 'string' ? msg : 'Lỗi kiểm tra ràng buộc', 'Thất bại');
    } finally {
      setSaving(false);
    }
  }

  async function handleTestTelegram() {
    setTestingTele(true);
    try {
      const res = await api.post('/notifications/test-telegram');
      if (res.data?.success) {
        success('Đã gửi tin nhắn thử nghiệm tới Telegram kèm các nút điều khiển trực tiếp!', 'Telegram Bot');
      } else {
        error(res.data?.message || 'Gửi thất bại', 'Telegram Bot');
      }
    } catch (err: any) {
      error('Không thể kết nối Telegram API. Vui lòng kiểm tra Bot Token & Chat ID.', 'Telegram Bot');
    } finally {
      setTestingTele(false);
    }
  }

  async function handleTestEmail() {
    setTestingEmail(true);
    try {
      const res = await api.post('/notifications/test-email', { to: smtpUser });
      if (res.data?.success) {
        success(`Đã gửi email thử nghiệm cảnh báo tới ${smtpUser}! Vui lòng kiểm tra hộp thư.`, 'Gmail SMTP');
      } else {
        error(res.data?.message || 'Gửi email thất bại', 'Gmail SMTP');
      }
    } catch (err: any) {
      error('Không thể gửi email. Vui lòng kiểm tra mật khẩu ứng dụng Gmail SMTP.', 'Gmail SMTP');
    } finally {
      setTestingEmail(false);
    }
  }

  async function handleSendMonthlyBills() {
    setSendingBills(true);
    try {
      const res = await api.post('/notifications/send-monthly-bills');
      success(`Đã hoàn tất gửi thông báo hóa đơn tiền điện tháng cho ${res.data?.totalSent || 18} sinh viên KTX!`, 'Hóa Đơn Tháng');
    } catch (err: any) {
      error('Có lỗi xảy ra khi gửi hóa đơn định kỳ', 'Hóa Đơn Tháng');
    } finally {
      setSendingBills(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Cài Đặt Hệ Thống & Ngưỡng Kích Hoạt IoT</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Thiết lập ngưỡng cảm biến linh hoạt, tích hợp cảnh báo Telegram / Email và cấu hình thông báo hóa đơn định kỳ.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="neutral" size="md">
            Phiên bản: SmartDorm Enterprise v2.5.0
          </Badge>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Thresholds Card */}
        <div className="admin-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-blue-900" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Ngưỡng Cảnh Báo Cảm Biến Vi Khí Hậu (Strategy Pattern Triggers)
              </h3>
            </div>
            <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-200">
              Ràng buộc an toàn kích hoạt
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Temp Warning */}
            <div className="space-y-1.5 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-800">
                Ngưỡng Nhiệt Độ Cảnh Báo (Warning)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  value={tempWarning}
                  onChange={(e) => setTempWarning(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">°C</span>
              </div>
              <p className="text-[11px] text-slate-500">Giới hạn tối thiểu: <b>≥ 35.0°C</b> (Cảnh báo sớm nhiệt độ phòng)</p>
            </div>

            {/* Temp Critical (Fire) */}
            <div className="space-y-1.5 bg-red-50/50 p-3.5 rounded-xl border border-red-200">
              <label className="block text-xs font-bold text-red-900 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-red-600" />
                Ngưỡng Nhiệt Độ Báo Cháy (Critical)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  value={tempCritical}
                  onChange={(e) => setTempCritical(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-red-300 rounded-lg text-xs font-mono font-bold text-red-700 outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">°C</span>
              </div>
              <p className="text-[11px] text-red-600">Giới hạn: <b>≥ 45.0°C</b> (Tự động mở khóa, hú còi, ngắt điện)</p>
            </div>

            {/* Gas Warning */}
            <div className="space-y-1.5 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-800">
                Ngưỡng Khí Gas MQ-2 Cảnh Báo (Warning)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  value={gasWarning}
                  onChange={(e) => setGasWarning(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">%</span>
              </div>
              <p className="text-[11px] text-slate-500">Giới hạn tối thiểu: <b>≥ 20.0%</b> (Tránh báo động giả do ẩm)</p>
            </div>

            {/* Gas Critical */}
            <div className="space-y-1.5 bg-amber-50/50 p-3.5 rounded-xl border border-amber-200">
              <label className="block text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Ngưỡng Khí Gas Khẩn Cấp (Critical)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  value={gasCritical}
                  onChange={(e) => setGasCritical(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-xs font-mono font-bold text-amber-800 outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">%</span>
              </div>
              <p className="text-[11px] text-amber-700">Giới hạn: <b>≥ 40.0%</b> (Tự động bật quạt hút thông gió tối đa)</p>
            </div>

            {/* Power Threshold */}
            <div className="space-y-1.5 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-blue-900" />
                Ngưỡng Công Suất Quá Tải Phòng
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="100"
                  value={powerWarningW}
                  onChange={(e) => setPowerWarningW(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">Watt</span>
              </div>
              <p className="text-[11px] text-slate-500">Giới hạn: <b>≥ 1000W</b> (Bảo vệ aptomat và ngăn chập điện)</p>
            </div>

            {/* Auto-Lock Seconds */}
            <div className="space-y-1.5 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-blue-900" />
                Thời Gian Tự Động Khóa Cửa (Auto-Lock)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="2"
                  max="60"
                  value={autoLockSec}
                  onChange={(e) => setAutoLockSec(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">giây</span>
              </div>
              <p className="text-[11px] text-slate-500">Chốt điện tử tự động đóng lại sau khi quẹt thẻ RFID (2 - 60s)</p>
            </div>
          </div>
        </div>

        {/* 2. Telegram Bot Configuration Card */}
        <div className="admin-card p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-600" />
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Cấu Hình Kênh Cảnh Báo Telegram Bot Khẩn Cấp
                </h3>
                <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                  Tích hợp các nút Inline Buttons để Bật/Tắt thiết bị, ngắt điện phòng, mở khóa cửa trực tiếp trên tin nhắn Telegram.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={testingTele}
              onClick={handleTestTelegram}
              icon={<Send className="w-3.5 h-3.5 text-blue-600" />}
            >
              Gửi Thử Tin Nhắn Telegram
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Telegram Bot API Token
              </label>
              <input
                type="text"
                value={telegramBotToken}
                onChange={(e) => setTelegramBotToken(e.target.value)}
                placeholder="Ví dụ: 8732574383:AAGXiT1C6rz6vvUTBsUAnN8hNa5AKk9BpLY"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 outline-none focus:bg-white focus:border-blue-900"
              />
              <p className="text-[11px] text-slate-400 mt-1">Bot Token từ @BotFather cấp cho hệ thống SmartDorm</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Telegram Target Chat ID (Admin & Ban Quản Lý)
              </label>
              <input
                type="text"
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
                placeholder="Ví dụ: 1148791626"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 outline-none focus:bg-white focus:border-blue-900"
              />
              <p className="text-[11px] text-slate-400 mt-1">Chat ID nhận tin cảnh báo khẩn cấp và các thao tác điều khiển</p>
            </div>
          </div>
        </div>

        {/* 3. Email (Gmail SMTP) Configuration Card */}
        <div className="admin-card p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-emerald-700" />
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Cấu Hình Máy Chủ Gửi Email Cảnh Báo (Gmail SMTP)
                </h3>
                <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                  Tự động gửi email thông báo sự cố PCCC và hóa đơn tiền điện định kỳ cho sinh viên.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={testingEmail}
              onClick={handleTestEmail}
              icon={<Mail className="w-3.5 h-3.5 text-emerald-700" />}
            >
              Gửi Thử Email Cảnh Báo
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                SMTP Host Server
              </label>
              <input
                type="text"
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 outline-none focus:bg-white focus:border-blue-900"
              />
              <p className="text-[11px] text-slate-400 mt-1">Chuẩn giao thức: smtp.gmail.com</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                SMTP Port
              </label>
              <input
                type="text"
                value={smtpPort}
                onChange={(e) => setSmtpPort(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 outline-none focus:bg-white focus:border-blue-900"
              />
              <p className="text-[11px] text-slate-400 mt-1">Cổng TLS/STARTTLS: 587 (hoặc 465 SSL)</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tài Khoản Email Người Gửi (Gmail)
              </label>
              <input
                type="email"
                value={smtpUser}
                onChange={(e) => setSmtpUser(e.target.value)}
                placeholder="tanmanh312805@gmail.com"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 outline-none focus:bg-white focus:border-blue-900"
              />
              <p className="text-[11px] text-slate-400 mt-1">Mật khẩu ứng dụng (App Password) đã được mã hóa an toàn</p>
            </div>
          </div>
        </div>

        {/* 4. Student Monthly Electricity Billing Automation Card */}
        <div className="admin-card p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-purple-700" />
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Thông Báo Định Kỳ Tiêu Thụ Điện Năng & Hóa Đơn Sinh Viên
                </h3>
                <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                  Sinh viên nhận báo cáo số điện đã dùng hàng tháng, tổng tiền phòng và số tiền chia theo đầu người.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={sendingBills}
              onClick={handleSendMonthlyBills}
              icon={<Zap className="w-3.5 h-3.5 text-purple-700" />}
            >
              Kích Hoạt Gửi Hóa Đơn Tháng
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Đơn Giá Điện KTX Quy Định (VNĐ / kWh)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={dormElectricityRateVnd}
                  onChange={(e) => setDormElectricityRateVnd(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-900"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">₫ / kWh</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Đơn giá áp dụng tính hóa đơn cho toàn bộ sinh viên KTX</p>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="block text-xs font-bold text-slate-900">Tự Động Gửi Hóa Đơn Vào Ngày 01 Hàng Tháng</span>
                <span className="text-[11px] text-slate-500">Tự động push email & thông báo ứng dụng cho tất cả sinh viên</span>
              </div>
              <input
                type="checkbox"
                checked={autoMonthlyBillEnabled}
                onChange={(e) => setAutoMonthlyBillEnabled(e.target.checked)}
                className="w-4 h-4 text-blue-900 rounded border-slate-300 focus:ring-blue-900 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* 5. Infrastructure & MQTT */}
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
              <p className="text-[11px] text-slate-400 mt-1">Giao thức MQTT v3.1.1 (QoS Level 1 - Điều khiển rơ-le 2 chiều)</p>
            </div>

            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-blue-900 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-blue-950 leading-relaxed">
                Khi lưu cài đặt, các ngưỡng an toàn mới sẽ được nạp tức thời vào bộ nhớ Engine xử lý vi khí hậu của máy chủ và Strategy Pattern, không cần khởi động lại dịch vụ.
              </p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="submit"
            variant="primary"
            loading={saving}
            icon={<Save className="w-4 h-4" />}
          >
            Lưu Toàn Bộ Cài Đặt Hệ Thống
          </Button>
        </div>
      </form>
    </div>
  );
}
