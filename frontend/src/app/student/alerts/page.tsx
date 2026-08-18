'use client';
import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { 
  Bell, 
  Flame, 
  AlertTriangle, 
  ShieldCheck, 
  CheckCircle2, 
  Info,
  Calendar,
  Sparkles
} from 'lucide-react';

export default function StudentAlertsPage() {
  const roomAlerts = [
    {
      id: 'alt-1',
      type: 'INFO',
      title: 'Thông báo diễn tập phòng cháy chữa cháy KTX',
      description: 'Ban Quản Lý KTX thông báo diễn tập PCCC vào sáng Thứ Bảy tuần này lúc 08:30 tại sân Tòa A.',
      time: 'Hôm nay, 14:00',
      isRead: true,
    },
    {
      id: 'alt-2',
      type: 'INFO',
      title: 'Nhiệt độ phòng đã ổn định',
      description: 'Hệ thống cảm biến DHT22 ghi nhận nhiệt độ phòng A101 ở mức 27.2°C.',
      time: 'Hôm nay, 10:15',
      isRead: true,
    },
    {
      id: 'alt-3',
      type: 'SUCCESS',
      title: 'Xác thực thẻ RFID thành công',
      description: 'Thẻ sinh viên của bạn đã được cập nhật quyền mở khóa phòng A101 cho học kỳ mới.',
      time: '12/08/2026',
      isRead: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Thông Báo & Cảnh Báo Phòng Ở</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Các thông báo từ Ban Quản Lý KTX và cảnh báo an toàn cảm biến trong phòng của bạn.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="success" size="md">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Phòng A101 an toàn</span>
          </Badge>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {roomAlerts.map((alt) => (
          <div
            key={alt.id}
            className="admin-card p-4.5 flex items-start gap-3.5"
          >
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-900 flex-shrink-0 mt-0.5">
              <Info className="w-5 h-5" />
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h3 className="font-bold text-xs text-slate-900">{alt.title}</h3>
                <span className="text-[11px] text-slate-400 font-mono">{alt.time}</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {alt.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
