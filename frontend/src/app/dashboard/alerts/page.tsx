'use client';
import { useState } from 'react';
import { INITIAL_ALERTS, IncidentAlert } from '@/lib/smartdorm-data';
import { MetricCard } from '@/components/ui/MetricCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/ToastContext';
import { 
  Flame, 
  AlertTriangle, 
  ShieldCheck, 
  CheckCircle2, 
  Search, 
  Filter, 
  ArrowRight,
  Clock,
  MapPin,
  Layers,
  Sparkles
} from 'lucide-react';

export default function AlertsPage() {
  const { success } = useToast();
  const [alerts, setAlerts] = useState<IncidentAlert[]>(INITIAL_ALERTS);
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'RESOLVED'>('ALL');
  const [selectedAlert, setSelectedAlert] = useState<IncidentAlert | null>(null);

  const filtered = alerts.filter((a) => {
    if (filterSeverity === 'RESOLVED') return a.isResolved;
    if (filterSeverity === 'CRITICAL') return a.level === 'CRITICAL' && !a.isResolved;
    if (filterSeverity === 'WARNING') return a.level === 'WARNING' && !a.isResolved;
    return true;
  });

  function resolveAlert(id: string) {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, isResolved: true } : a));
    success('Đã đánh dấu xử lý sự cố an toàn!', 'Hoàn tất');
    if (selectedAlert?.id === id) {
      setSelectedAlert(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Trung Tâm Cảnh Báo & Sự Cố (Alerts & Incidents)</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Theo dõi phân loại cảnh báo vi khí hậu, phát hiện xâm nhập và quy trình xử lý theo Strategy Pattern.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="critical" size="md">
            {alerts.filter(a => !a.isResolved).length} Sự cố chưa giải quyết
          </Badge>
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="TỔNG SỐ SỰ CỐ"
          value={`0${alerts.length}`}
          subValue="Ghi nhận trong 24 giờ qua"
          tag="Tất cả sự cố"
          tagVariant="neutral"
          icon={<Layers className="w-4 h-4 text-slate-700" />}
          iconBg="bg-slate-100 text-slate-700"
        />

        <MetricCard
          label="SỰ CỐ CRITICAL (KHẨN CẤP)"
          value="02"
          subValue="Phòng B204 (Khói & Nhiệt cao)"
          tag="Ưu tiên 1"
          tagVariant="critical"
          highlight={true}
          icon={<Flame className="w-4 h-4 text-red-600" />}
          iconBg="bg-red-50 text-red-600"
        />

        <MetricCard
          label="CẢNH BÁO WARNING"
          value="01"
          subValue="Phòng A103 (Khí Gas 42%)"
          tag="Ưu tiên 2"
          tagVariant="warning"
          icon={<AlertTriangle className="w-4 h-4 text-amber-600" />}
          iconBg="bg-amber-50 text-amber-600"
        />

        <MetricCard
          label="ĐÃ XỬ LÝ (RESOLVED)"
          value="01"
          subValue="Phòng A201 (Khôi phục an toàn)"
          tag="Đã an toàn"
          tagVariant="success"
          icon={<ShieldCheck className="w-4 h-4 text-emerald-700" />}
          iconBg="bg-emerald-50 text-emerald-700"
        />
      </div>

      {/* Filter Tabs */}
      <div className="admin-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
          {[
            { id: 'ALL', label: 'Tất cả cảnh báo' },
            { id: 'CRITICAL', label: '🔴 Khẩn cấp (Critical)' },
            { id: 'WARNING', label: '🟠 Cảnh báo (Warning)' },
            { id: 'RESOLVED', label: '🟢 Đã giải quyết' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterSeverity(tab.id as any)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                filterSeverity === tab.id
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-400 font-mono hidden sm:inline">
          {filtered.length} kết quả
        </span>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filtered.map((alert) => (
          <div
            key={alert.id}
            className={`admin-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
              alert.isResolved
                ? 'bg-slate-50/70 border-slate-200 opacity-80'
                : alert.level === 'CRITICAL'
                ? 'bg-red-50/40 border-red-200 shadow-xs'
                : 'bg-amber-50/40 border-amber-200 shadow-xs'
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div
                className={`p-2.5 rounded-xl flex-shrink-0 mt-0.5 ${
                  alert.isResolved
                    ? 'bg-emerald-100 text-emerald-700'
                    : alert.level === 'CRITICAL'
                    ? 'bg-red-100 text-red-600'
                    : 'bg-amber-100 text-amber-600'
                }`}
              >
                {alert.isResolved ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : alert.type === 'FIRE' ? (
                  <Flame className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    variant={alert.isResolved ? 'success' : alert.level === 'CRITICAL' ? 'critical' : 'warning'}
                    size="sm"
                  >
                    {alert.isResolved ? 'RESOLVED' : alert.level}
                  </Badge>
                  <h3 className="font-bold text-sm text-slate-900">{alert.title}</h3>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                  {alert.description}
                </p>

                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono mt-2">
                  <span>Vị trí: <strong className="text-slate-700">Tòa Nhà {alert.buildingName} · Phòng {alert.roomNumber}</strong></span>
                  <span>•</span>
                  <span>{alert.timestamp}</span>
                  {alert.sensorValue && (
                    <>
                      <span>•</span>
                      <span className="text-red-600 font-bold">Giá trị đo: {alert.sensorValue}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 self-end md:self-center">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedAlert(alert)}
              >
                Xem chi tiết
              </Button>
              {!alert.isResolved && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => resolveAlert(alert.id)}
                  icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                >
                  Xác nhận xử lý
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Incident Detail Modal */}
      {selectedAlert && (
        <Modal
          isOpen={!!selectedAlert}
          onClose={() => setSelectedAlert(null)}
          title="Chi Tiết Sự Cố & Hành Động Strategy Pattern"
          description={`Mã Sự Cố: ${selectedAlert.id} • ${selectedAlert.timestamp}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900">{selectedAlert.title}</span>
                <Badge variant={selectedAlert.level === 'CRITICAL' ? 'critical' : 'warning'} size="md">
                  {selectedAlert.level}
                </Badge>
              </div>
              <p className="text-slate-600 leading-relaxed">{selectedAlert.description}</p>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-[11px] text-slate-500 font-mono">
                <span>Vị trí: Tòa {selectedAlert.buildingName} · Phòng {selectedAlert.roomNumber}</span>
                <span>Ngưỡng cảnh báo: {selectedAlert.threshold || 45.0}</span>
              </div>
            </div>

            {/* Automated Actions Taken */}
            <div>
              <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-2">
                Hành Động Hệ Thống Tự Động Thực Thi (Strategy Actions)
              </h4>
              <div className="space-y-1.5">
                {selectedAlert.actionsTaken.map((act, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{act}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setSelectedAlert(null)}>
                Đóng
              </Button>
              {!selectedAlert.isResolved && (
                <Button variant="primary" size="sm" onClick={() => resolveAlert(selectedAlert.id)}>
                  Xác nhận giải quyết xong
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
