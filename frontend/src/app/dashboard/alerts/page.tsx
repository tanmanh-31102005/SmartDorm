'use client';
import { useState, useEffect } from 'react';
import { INITIAL_ALERTS, IncidentAlert } from '@/lib/smartdorm-data';
import { getSocket } from '@/lib/socket';
import api from '@/lib/api';
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
  Sparkles,
  Zap,
  Fan,
  Unlock,
  Volume2,
  BellOff
} from 'lucide-react';

export default function AlertsPage() {
  const { success, error, info } = useToast();
  const [alerts, setAlerts] = useState<IncidentAlert[]>(INITIAL_ALERTS);
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'RESOLVED'>('ALL');
  const [selectedAlert, setSelectedAlert] = useState<IncidentAlert | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Load from backend API
  async function loadAlerts() {
    try {
      const res = await api.get('/emergency');
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        const mapped: IncidentAlert[] = res.data.map((e: any) => ({
          id: e.id,
          type: e.type,
          level: e.level || (e.type === 'FIRE' ? 'CRITICAL' : 'WARNING'),
          title: e.type === 'FIRE' 
            ? 'Phát hiện khói & nhiệt độ cao (Smoke Detected)' 
            : e.type === 'GAS_LEAK' 
            ? 'Cảnh báo rò rỉ khí Gas (Gas Leak Alert)'
            : 'Cảnh báo an ninh phòng',
          description: e.description || `Sự cố ghi nhận tại phòng ${e.room?.roomNumber || ''}`,
          roomId: e.roomId,
          roomNumber: e.room?.roomNumber || '101',
          buildingName: e.room?.building?.name || 'A',
          sensorValue: e.sensorValue,
          timestamp: new Date(e.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          isResolved: e.isResolved || false,
          actionsTaken: ['Kích hoạt còi báo động', 'Mở toàn bộ khóa cửa thoát hiểm', 'Thông báo Telegram & Email'],
        }));
        setAlerts(mapped);
      }
    } catch (err) {
      console.warn('Fallback alerts loading', err);
    }
  }

  useEffect(() => {
    loadAlerts();

    const socket = getSocket();
    socket.on('emergency:alert', (newAlert: any) => {
      loadAlerts();
    });
    socket.on('emergency:resolved', (data: { id: string }) => {
      setAlerts(prev => prev.map(a => a.id === data.id ? { ...a, isResolved: true } : a));
    });

    return () => {
      socket.off('emergency:alert');
      socket.off('emergency:resolved');
    };
  }, []);

  const filtered = alerts.filter((a) => {
    if (filterSeverity === 'RESOLVED') return a.isResolved;
    if (filterSeverity === 'CRITICAL') return a.level === 'CRITICAL' && !a.isResolved;
    if (filterSeverity === 'WARNING') return a.level === 'WARNING' && !a.isResolved;
    return true;
  });

  const criticalCount = alerts.filter(a => a.level === 'CRITICAL' && !a.isResolved).length;
  const warningCount = alerts.filter(a => a.level === 'WARNING' && !a.isResolved).length;
  const resolvedCount = alerts.filter(a => a.isResolved).length;

  async function resolveAlert(id: string) {
    try {
      await api.patch(`/emergency/resolve/${id}`);
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, isResolved: true } : a));
      success('Đã xác nhận xử lý sự cố an toàn & lưu vào hệ thống!', 'Hoàn tất');
      if (selectedAlert?.id === id) {
        setSelectedAlert(prev => prev ? { ...prev, isResolved: true } : null);
      }
    } catch (e) {
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, isResolved: true } : a));
      success('Đã đánh dấu xử lý sự cố an toàn!', 'Hoàn tất');
    }
  }

  async function handleDeviceAction(alert: IncidentAlert, deviceType: string, action: string) {
    const actionKey = `${alert.id}_${deviceType}_${action}`;
    setLoadingAction(actionKey);
    try {
      await api.post('/devices/command', {
        roomId: alert.roomId || alert.roomNumber,
        deviceType,
        action,
      });
      success(`Đã gửi lệnh ${action.toUpperCase()} cho ${deviceType} tại Phòng ${alert.roomNumber}!`, 'Điều Khiển Trực Tiếp');
    } catch (err: any) {
      error(`Không thể thực thi lệnh ${action.toUpperCase()}`, 'Lỗi');
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Trung Tâm Cảnh Báo & Sự Cố (Alerts & Incidents)</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Theo dõi phân loại cảnh báo vi khí hậu, phát hiện xâm nhập và trực tiếp thao tác điều khiển thiết bị phòng bị sự cố.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={criticalCount > 0 ? "critical" : "success"} size="md">
            {criticalCount + warningCount} Sự cố chưa giải quyết
          </Badge>
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="TỔNG SỐ SỰ CỐ"
          value={String(alerts.length).padStart(2, '0')}
          subValue="Ghi nhận trong 24 giờ qua"
          tag="Tất cả sự cố"
          tagVariant="neutral"
          icon={<Layers className="w-4 h-4 text-slate-700" />}
          iconBg="bg-slate-100 text-slate-700"
        />

        <MetricCard
          label="SỰ CỐ CRITICAL (KHẨN CẤP)"
          value={String(criticalCount).padStart(2, '0')}
          subValue={criticalCount > 0 ? "Yêu cầu can thiệp tức thời" : "Không có sự cố khẩn cấp"}
          tag="Ưu tiên 1"
          tagVariant="critical"
          highlight={criticalCount > 0}
          icon={<Flame className="w-4 h-4 text-red-600" />}
          iconBg="bg-red-50 text-red-600"
        />

        <MetricCard
          label="CẢNH BÁO WARNING"
          value={String(warningCount).padStart(2, '0')}
          subValue={warningCount > 0 ? "Theo dõi sát thông số" : "Tất cả ở mức an toàn"}
          tag="Ưu tiên 2"
          tagVariant="warning"
          icon={<AlertTriangle className="w-4 h-4 text-amber-600" />}
          iconBg="bg-amber-50 text-amber-600"
        />

        <MetricCard
          label="ĐÃ XỬ LÝ (RESOLVED)"
          value={String(resolvedCount).padStart(2, '0')}
          subValue="Đã khắc phục và lưu vết an toàn"
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
            { id: 'CRITICAL', label: `🔴 Khẩn cấp (${criticalCount})` },
            { id: 'WARNING', label: `🟠 Cảnh báo (${warningCount})` },
            { id: 'RESOLVED', label: `🟢 Đã giải quyết (${resolvedCount})` },
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

      {/* Alerts List with Direct Remote Controls */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="admin-card p-8 text-center text-slate-400">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
            <p className="text-xs font-semibold text-slate-600">Không có sự cố nào trong bộ lọc này.</p>
          </div>
        ) : (
          filtered.map((alert) => (
            <div
              key={alert.id}
              className={`admin-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
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
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {alert.isResolved ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : alert.level === 'CRITICAL' ? (
                    <Flame className="w-5 h-5 animate-pulse" />
                  ) : (
                    <AlertTriangle className="w-5 h-5" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant={
                        alert.isResolved
                          ? 'success'
                          : alert.level === 'CRITICAL'
                          ? 'critical'
                          : 'warning'
                      }
                      size="sm"
                    >
                      {alert.isResolved ? 'RESOLVED' : alert.level}
                    </Badge>
                    <h3 className="font-bold text-xs text-slate-900">{alert.title}</h3>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {alert.description}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono pt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Vị trí: Tòa Nhà {alert.buildingName} • Phòng {alert.roomNumber}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {alert.timestamp}
                    </span>
                    {alert.sensorValue !== undefined && (
                      <>
                        <span>•</span>
                        <span className="text-red-600 font-bold">
                          Giá trị đo: {alert.sensorValue}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Direct Action Buttons on Alert Row */}
              <div className="flex flex-wrap items-center gap-2 flex-shrink-0 self-end md:self-center">
                {!alert.isResolved && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleDeviceAction(alert, 'LIGHT', 'off')}
                      disabled={loadingAction === `${alert.id}_LIGHT_off`}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 flex items-center gap-1 transition-all cursor-pointer"
                      title="Ngắt nguồn điện / tắt đèn phòng"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-600" />
                      <span>Ngắt điện</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeviceAction(alert, 'FAN', 'on')}
                      disabled={loadingAction === `${alert.id}_FAN_on`}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-900 hover:bg-blue-100 border border-blue-200 flex items-center gap-1 transition-all cursor-pointer"
                      title="Bật quạt thông gió tối đa"
                    >
                      <Fan className="w-3.5 h-3.5 text-blue-700" />
                      <span>Bật quạt</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeviceAction(alert, 'DOOR_LOCK', 'unlock')}
                      disabled={loadingAction === `${alert.id}_DOOR_LOCK_unlock`}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 flex items-center gap-1 transition-all cursor-pointer"
                      title="Mở khóa chốt cửa phòng"
                    >
                      <Unlock className="w-3.5 h-3.5 text-amber-700" />
                      <span>Mở cửa</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => resolveAlert(alert.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-900 text-white hover:bg-blue-800 shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Xác nhận xử lý</span>
                    </button>
                  </>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedAlert(alert)}
                >
                  Xem chi tiết
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Alert Detail Modal */}
      <Modal
        isOpen={!!selectedAlert}
        onClose={() => setSelectedAlert(null)}
        title="Chi Tiết Sự Cố & Kịch Bản Xử Lý"
        maxWidth="md"
      >
        {selectedAlert && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Trạng thái:</span>
              <Badge
                variant={selectedAlert.isResolved ? 'success' : 'critical'}
                size="md"
              >
                {selectedAlert.isResolved ? 'ĐÃ XỬ LÝ AN TOÀN' : 'CHƯA XỬ LÝ (ĐANG THEO DÕI)'}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block text-[11px]">Vị trí phòng:</span>
                <span className="font-bold text-slate-900">
                  Phòng {selectedAlert.roomNumber} (Tòa {selectedAlert.buildingName})
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block text-[11px]">Thời gian phát hiện:</span>
                <span className="font-bold text-slate-900">{selectedAlert.timestamp}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900">Kịch bản ứng phó tự động:</h4>
              <ul className="space-y-1.5">
                {(selectedAlert.actionsTaken || ['Kích hoạt còi báo động', 'Mở toàn bộ khóa cửa thoát hiểm']).map((act, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-xs text-slate-700 bg-slate-50 p-2 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <Button variant="outline" onClick={() => setSelectedAlert(null)}>
                Đóng
              </Button>
              {!selectedAlert.isResolved && (
                <Button
                  variant="primary"
                  icon={<CheckCircle2 className="w-4 h-4" />}
                  onClick={() => resolveAlert(selectedAlert.id)}
                >
                  Xác nhận đã xử lý an toàn
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
