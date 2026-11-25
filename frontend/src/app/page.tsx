'use client';
import Link from 'next/link';
import { 
  Building2, 
  Cpu, 
  ShieldCheck, 
  Activity, 
  Radio, 
  Flame, 
  Zap, 
  ArrowRight, 
  Sparkles,
  ExternalLink,
  Layers,
  BarChart3,
  Server,
  Lock,
  Wifi,
  CheckCircle2,
  DoorClosed,
  CreditCard,
  Thermometer,
  KeyRound,
  Droplets
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { API_BASE_URL } from '@/lib/api';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col antialiased">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-900 flex items-center justify-center text-white shadow-sm">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-slate-900 block leading-tight">
                SmartDorm
              </span>
              <span className="text-[10px] font-medium text-slate-400">
                Smart Campus IoT Platform
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a 
              href={`${API_BASE_URL}/api/docs`} 
              target="_blank" 
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Swagger Docs</span>
            </a>
            <Link 
              href="/login" 
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-900 text-white text-xs font-bold hover:bg-blue-800 shadow-sm transition-all"
            >
              <span>Vào Hệ Thống</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16 pb-20 px-6 relative overflow-hidden bg-white border-b border-slate-200/80">
        {/* Soft background ambient glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-blue-50/80 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200/80 text-blue-900 rounded-full px-3.5 py-1 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-blue-700" />
            <span className="text-xs font-bold">Nền Tảng Quản Lý Ký Túc Xá Thông Minh IoT Chuẩn Enterprise</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-6">
            Smart Living. <br />
            <span className="text-blue-900">Safer Campus.</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed mb-8">
            Hệ sinh thái thông minh tích hợp toàn diện: Giám sát vi khí hậu (DHT22 & MQ-2), điều khiển rơ-le qua MQTT (Command Pattern), phản ứng tự động khi có sự cố (Strategy Pattern) và kiểm soát cửa RFID.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3.5 mb-14">
            <Link 
              href="/login" 
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-900 text-white text-xs font-bold hover:bg-blue-800 shadow-md shadow-blue-900/10 transition-all"
            >
              <Cpu className="w-4 h-4" />
              <span>Đăng Nhập Quản Trị & Cổng Sinh Viên</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a 
              href={`${API_BASE_URL}/api/docs`} 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors"
            >
              <Server className="w-4 h-4 text-slate-400" />
              <span>Tài Liệu Swagger API</span>
            </a>
          </div>

          {/* Interactive Live Campus Status Card */}
          <div className="max-w-2xl mx-auto bg-slate-50 rounded-2xl border border-slate-200/90 p-5 shadow-sm text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Trạng Thái Toàn Campus (Live Telemetry)
                </span>
              </div>
              <span className="text-xs font-mono text-slate-500">248 Phòng · 3 Tòa Nhà</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Nhiệt Độ TB</div>
                <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">27.4°C</div>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Độ Ẩm TB</div>
                <div className="text-sm font-bold font-mono text-emerald-700 mt-0.5">64%</div>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Thiết Bị Online</div>
                <div className="text-sm font-bold font-mono text-blue-900 mt-0.5">1,168 / 1,186</div>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Điện Tiêu Thụ</div>
                <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">18,420 kWh</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6 Key Enterprise Features */}
      <section className="py-16 px-6 bg-[#F8FAFC]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
              Kiến Trúc Kỹ Thuật Đạt Chuẩn Thương Mại
            </h2>
            <p className="text-xs text-slate-500">
              Thiết kế theo các mẫu thiết kế phần mềm tiêu chuẩn (Design Patterns) kết hợp IoT thời gian thực.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: Activity,
                title: 'Giám Sát Vi Khí Hậu Real-Time',
                desc: 'Đo lường liên tục nhiệt độ, độ ẩm và nồng độ khí Gas từ cảm biến DHT22 & MQ-2, đồng bộ trực tiếp qua MQTT.',
              },
              {
                icon: Zap,
                title: 'Command Pattern (Điều Khiển Rơ-Le)',
                desc: 'Bật/tắt thiết bị từ xa (Đèn, quạt, khóa cửa, còi) với tính năng Hoàn Tác (Undo) và lịch sử ngăn xếp lệnh.',
              },
              {
                icon: Flame,
                title: 'Strategy Pattern (Xử Lý Sự Cố)',
                desc: 'Tự động kích hoạt còi báo động, mở khóa cửa thoát hiểm và gửi thông báo khẩn khi vượt ngưỡng an toàn.',
              },
              {
                icon: ShieldCheck,
                title: 'Kiểm Soát Thẻ RFID & Offline Mode',
                desc: 'Ghi nhận lịch sử quẹt thẻ sinh viên, hỗ trợ Offline Mode lưu cache thẻ trên ESP32 NVS và đồng bộ queue khi có mạng.',
              },
              {
                icon: BarChart3,
                title: 'Time-Series Data (InfluxDB)',
                desc: 'Lưu trữ hàng triệu điểm dữ liệu vi khí hậu với InfluxDB, tối ưu hoá cho biểu đồ xu hướng và phân tích thời gian thực.',
              },
              {
                icon: Radio,
                title: 'Observer Pattern (Socket.IO)',
                desc: 'Phát sóng cập nhật đa điểm tới toàn bộ dashboard quản trị viên tức thời với độ trễ tính bằng mili-giây.',
              },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="admin-card p-6 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center mb-3 border border-blue-100/80">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1">{f.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-white border-t border-slate-200/80 py-6 px-6 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2 text-slate-900 font-bold">
            <Building2 className="w-4 h-4 text-blue-900" />
            <span>SmartDorm — Smart Campus & IoT Building Platform</span>
          </div>
          <p className="text-slate-400">
            Hệ Thống Quản Lý KTX Thông Minh & Telemetry IoT
          </p>
        </div>
      </footer>
    </div>
  );
}
