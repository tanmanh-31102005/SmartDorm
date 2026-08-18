'use client';
import { useState } from 'react';
import { MetricCard } from '@/components/ui/MetricCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  ShieldCheck, 
  ShieldAlert, 
  DoorClosed, 
  DoorOpen, 
  CreditCard, 
  AlertTriangle, 
  Lock, 
  Unlock, 
  Building2, 
  MapPin, 
  CheckCircle2, 
  XCircle,
  Radio,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function SecurityPage() {
  const [selectedZone, setSelectedZone] = useState<'ALL' | 'A' | 'B' | 'C'>('ALL');

  const securityZones = [
    {
      building: 'A',
      name: 'Khu Vực Tòa Nhà A',
      doorsTotal: 80,
      doorsOnline: 79,
      status: 'SECURE',
      lastEvent: 'Quẹt thẻ hợp lệ P.A101 lúc 19:42',
      riskScore: '98%',
    },
    {
      building: 'B',
      name: 'Khu Vực Tòa Nhà B',
      doorsTotal: 72,
      doorsOnline: 71,
      status: 'INCIDENT',
      lastEvent: 'Cửa phòng B204 tự động mở thoát hiểm lúc 19:30',
      riskScore: '89%',
    },
    {
      building: 'C',
      name: 'Khu Vực Tòa Nhà C',
      doorsTotal: 96,
      doorsOnline: 96,
      status: 'WARNING',
      lastEvent: 'Phát hiện mở cửa không quẹt thẻ P.C301 lúc 19:15',
      riskScore: '94%',
    },
  ];

  const securityEvents = [
    {
      id: 'sec-1',
      time: '19:30:15',
      zone: 'Tòa Nhà B · Cửa P.B204',
      type: 'FIRE_STRATEGY_UNLOCK',
      title: 'Mở khóa cửa khẩn cấp tự động',
      description: 'Strategy Pattern tự động giải phóng chốt cửa để thoát hiểm khi phát hiện khói.',
      severity: 'CRITICAL',
    },
    {
      id: 'sec-2',
      time: '19:28:44',
      zone: 'Tòa Nhà A · Cửa P.A103',
      type: 'UNAUTHORIZED_CARD',
      title: 'Quẹt thẻ không hợp lệ (Access Denied)',
      description: 'Thẻ UID CARD_UNKNOWN_8841 bị từ chối mở cửa.',
      severity: 'WARNING',
    },
    {
      id: 'sec-3',
      time: '19:15:20',
      zone: 'Tòa Nhà C · Cửa P.C301',
      type: 'DOOR_FORCED_OPEN',
      title: 'Cửa bị cạy mở trái phép',
      description: 'Cảm biến chốt từ phát hiện cửa mở mà không có lệnh mở khóa RFID.',
      severity: 'WARNING',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Trung Tâm An Ninh & Kiểm Soát Cửa Điện Tử</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Giám sát chốt cửa điện từ tử xa, kiểm soát danh sách đen RFID và ngăn chặn xâm nhập trái phép.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="success" size="md">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Điểm An Ninh: 98% (Tuyệt Vời)</span>
          </Badge>
        </div>
      </div>

      {/* 4 Security KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="CỬA TRỰC TUYẾN"
          value="196 / 198"
          subValue="99.0% chốt điện hoạt động"
          tag="Online"
          tagVariant="success"
          icon={<Lock className="w-4 h-4 text-emerald-700" />}
          iconBg="bg-emerald-50 text-emerald-700"
        />

        <MetricCard
          label="SỰ KIỆN QUẸT THẺ HÔM NAY"
          value="1,284"
          subValue="1,280 hợp lệ · 4 từ chối"
          tag="99.7% Hợp lệ"
          tagVariant="info"
          icon={<CreditCard className="w-4 h-4 text-blue-900" />}
          iconBg="bg-blue-50 text-blue-900"
        />

        <MetricCard
          label="TRUY CẬP KHÔNG HỢP LỆ"
          value="04 Lần"
          subValue="Thẻ chưa đăng ký / sai phòng"
          tag="Đã chặn"
          tagVariant="warning"
          icon={<AlertTriangle className="w-4 h-4 text-amber-600" />}
          iconBg="bg-amber-50 text-amber-600"
        />

        <MetricCard
          label="SỰ CỐ AN NINH HOẠT ĐỘNG"
          value="02 Vụ"
          subValue="Cửa B204 thoát hiểm & C301"
          tag="Cần rà soát"
          tagVariant="critical"
          highlight={true}
          icon={<ShieldAlert className="w-4 h-4 text-red-600" />}
          iconBg="bg-red-50 text-red-600"
        />
      </div>

      {/* Simplified Building Topology Access Zones */}
      <div className="admin-card p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Sơ Đồ Phân Vùng An Ninh Campus (Building Topology)</h3>
            <p className="text-xs text-slate-500 mt-0.5">Trạng thái an ninh của các cổng kiểm soát và hành lang theo tòa nhà</p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {['ALL', 'A', 'B', 'C'].map((z) => (
              <button
                key={z}
                onClick={() => setSelectedZone(z as any)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  selectedZone === z ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {z === 'ALL' ? 'Tất cả phân vùng' : `Phân vùng ${z}`}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {securityZones
            .filter((z) => selectedZone === 'ALL' || z.building === selectedZone)
            .map((zone) => (
              <div key={zone.building} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-900 text-white font-bold text-xs flex items-center justify-center">
                      {zone.building}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900">{zone.name}</div>
                      <div className="text-[11px] text-slate-400">{zone.doorsOnline}/{zone.doorsTotal} Cửa Trực Tuyến</div>
                    </div>
                  </div>

                  <Badge variant={zone.status === 'INCIDENT' ? 'critical' : zone.status === 'WARNING' ? 'warning' : 'success'} size="sm">
                    {zone.status === 'INCIDENT' ? 'Sự cố' : zone.status === 'WARNING' ? 'Lưu ý' : 'An toàn'}
                  </Badge>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-600">
                  <div className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Sự kiện gần nhất</div>
                  <div className="truncate">{zone.lastEvent}</div>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-500 pt-1">
                  <span>Chỉ số an toàn: <strong className="text-emerald-700 font-mono">{zone.riskScore}</strong></span>
                  <span className="text-blue-900 font-semibold cursor-pointer hover:underline">Chi tiết →</span>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Security Incidents & Intrusions Log */}
      <div className="admin-card p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Nhật Ký Sự Kiện An Ninh & Xâm Nhập Bất Thường
            </h3>
          </div>
          <span className="text-xs text-slate-400">Ghi nhận tự động từ RFID Gateway</span>
        </div>

        <div className="space-y-3">
          {securityEvents.map((evt) => (
            <div
              key={evt.id}
              className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                evt.severity === 'CRITICAL' ? 'bg-red-50/40 border-red-200' : 'bg-amber-50/40 border-amber-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${evt.severity === 'CRITICAL' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'} flex-shrink-0 mt-0.5`}>
                  {evt.severity === 'CRITICAL' ? <XCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant={evt.severity === 'CRITICAL' ? 'critical' : 'warning'} size="sm">
                      {evt.severity}
                    </Badge>
                    <span className="font-bold text-xs text-slate-900">{evt.title}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{evt.description}</p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono mt-1">
                    <span>{evt.zone}</span>
                    <span>•</span>
                    <span>Lúc {evt.time}</span>
                  </div>
                </div>
              </div>

              <Button variant="secondary" size="sm" className="self-end sm:self-center">
                Xem chi tiết
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
