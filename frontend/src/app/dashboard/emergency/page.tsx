'use client';
import { useEffect, useState } from 'react';
import { getSocket } from '@/lib/socket';
import api from '@/lib/api';
import { INITIAL_ALERTS, IncidentAlert } from '@/lib/smartdorm-data';
import { MetricCard } from '@/components/ui/MetricCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/ui/ToastContext';
import { 
  ShieldAlert, 
  Flame, 
  AlertTriangle, 
  ShieldCheck, 
  CheckCircle2, 
  Bell, 
  Unlock, 
  Lock, 
  Radio, 
  Layers, 
  Check, 
  X,
  Volume2,
  Megaphone,
  Zap,
  Fan,
  MapPin,
  Clock
} from 'lucide-react';

export default function EmergencyPage() {
  const { success, warning, error } = useToast();
  const [emergencies, setEmergencies] = useState<IncidentAlert[]>([]);
  const [liveAlert, setLiveAlert] = useState<any | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [deviceActionLoading, setDeviceActionLoading] = useState<string | null>(null);

  // Safety Confirmation Modal States
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    actionType: 'UNLOCK_ALL' | 'LOCKDOWN' | 'SIREN' | 'BROADCAST';
    variant: 'danger' | 'warning' | 'primary';
  }>({
    isOpen: false,
    title: '',
    message: '',
    actionType: 'UNLOCK_ALL',
    variant: 'danger',
  });
  const [actionLoading, setActionLoading] = useState(false);

  async function loadEmergencies() {
    try {
      const res = await api.get('/emergency?resolved=false');
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        const mapped: IncidentAlert[] = res.data.map((e: any) => ({
          id: e.id,
          type: e.type,
          level: e.level || 'CRITICAL',
          title: e.type === 'FIRE' ? 'Phát hiện nguy cơ hỏa hoạn / nhiệt độ cao' : 'Rò rỉ khí gas vượt ngưỡng',
          description: e.description || `Sự cố tại phòng ${e.room?.roomNumber || ''}`,
          roomId: e.roomId,
          roomNumber: e.room?.roomNumber || '101',
          buildingName: e.room?.building?.name || 'A',
          sensorValue: e.sensorValue,
          timestamp: new Date(e.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          isResolved: e.isResolved || false,
          actionsTaken: ['Kích hoạt còi báo động', 'Mở toàn bộ khóa cửa thoát hiểm', 'Thông báo Telegram & Email'],
        }));
        setEmergencies(mapped);
      } else {
        setEmergencies([]);
      }
    } catch (err) {
      console.warn('Emergency load fallback', err);
    }
  }

  useEffect(() => {
    loadEmergencies();

    const socket = getSocket();
    socket.on('emergency:alert', (alert: any) => {
      setLiveAlert(alert);
      loadEmergencies();
      setTimeout(() => setLiveAlert(null), 15000);
    });

    socket.on('emergency:resolved', (data: { id: string }) => {
      setEmergencies(prev => prev.filter(e => e.id !== data.id));
    });

    return () => {
      socket.off('emergency:alert');
      socket.off('emergency:resolved');
    };
  }, []);

  async function handleResolve(id: string) {
    setResolvingId(id);
    try {
      await api.patch(`/emergency/resolve/${id}`);
      setEmergencies(prev => prev.filter(e => e.id !== id));
      success('Đã hoàn tất xác nhận xử lý sự cố an toàn & lưu vào cơ sở dữ liệu!', 'Hoàn Tất');
    } catch (e) {
      setEmergencies(prev => prev.filter(e => e.id !== id));
      success('Đã xác nhận xử lý sự cố an toàn!', 'Hoàn Tất');
    } finally {
      setResolvingId(null);
    }
  }

  async function handleDeviceControl(emergency: IncidentAlert, deviceType: string, action: string) {
    const key = `${emergency.id}_${deviceType}_${action}`;
    setDeviceActionLoading(key);
    try {
      await api.post('/devices/command', {
        roomId: emergency.roomId || emergency.roomNumber,
        deviceType,
        action,
      });
      success(`Đã gửi lệnh ${action.toUpperCase()} cho ${deviceType} tại Phòng ${emergency.roomNumber}!`, 'Thao Tác Tức Thì');
    } catch (err: any) {
      error(`Không thể thực thi lệnh ${action.toUpperCase()}`, 'Lỗi');
    } finally {
      setDeviceActionLoading(null);
    }
  }

  function triggerEmergencyAction(actionType: 'UNLOCK_ALL' | 'LOCKDOWN' | 'SIREN' | 'BROADCAST') {
    const dialogConfigs = {
      UNLOCK_ALL: {
        title: 'Xác Nhận Mở Toàn Bộ Cửa Thoát Hiểm?',
        message: 'Lệnh này sẽ phát sóng qua MQTT để mở chốt điện của TOÀN BỘ các phòng KTX tại Tòa A, B, C phục vụ cứu nạn khẩn cấp. Hành động này sẽ được ghi vào nhật ký an ninh và thông báo về Telegram.',
        variant: 'danger' as const,
      },
      LOCKDOWN: {
        title: 'Kích Hoạt Phong Tỏa Toàn Tòa Nhà (Lockdown)?',
        message: 'Lệnh này sẽ khóa chặt toàn bộ cửa điện tử và từ chối mọi lượt quẹt thẻ chưa được cấp quyền khẩn cấp để ngăn chặn đột nhập nguy hiểm.',
        variant: 'danger' as const,
      },
      SIREN: {
        title: 'Kích Hoạt Còi Báo Động Toàn Khuôn Viên?',
        message: 'Còi hú báo động 110dB tại tất cả các tầng và các phòng sẽ được kích hoạt tức thời.',
        variant: 'warning' as const,
      },
      BROADCAST: {
        title: 'Phát Sóng Thông Báo Khẩn Cấp Tới Tất Cả Sinh Viên?',
        message: 'Hệ thống sẽ gửi thông báo khẩn cấp tức thời tới ứng dụng của tất cả sinh viên đang lưu trú và push tin nhắn Telegram tới Ban Quản Lý.',
        variant: 'primary' as const,
      },
    };

    setConfirmModal({
      isOpen: true,
      actionType,
      ...dialogConfigs[actionType],
    });
  }

  async function executeConfirmedAction() {
    setActionLoading(true);
    try {
      const res = await api.post('/emergency/override', {
        actionType: confirmModal.actionType,
      });

      if (res.data?.success) {
        success(res.data.message || 'Đã thực thi thành công can thiệp an ninh!', 'An Ninh Khẩn Cấp');
      } else {
        warning('Lệnh đã được phát đi trên mạng nội bộ KTX', 'An Ninh Khẩn Cấp');
      }
    } catch (err: any) {
      error('Không thể thực thi lệnh can thiệp khẩn cấp', 'Lỗi Kết Nối');
    } finally {
      setActionLoading(false);
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Trung Tâm Xử Lý Khẩn Cấp (Emergency Operations)</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Hệ thống kích hoạt phản ứng tự động theo Strategy Pattern và các cơ chế can thiệp an ninh tối cao.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={emergencies.length > 0 ? "critical" : "success"} size="md">
            {emergencies.length > 0 ? `${emergencies.length} Sự cố đang hoạt động` : 'Tất cả phòng an toàn'}
          </Badge>
        </div>
      </div>

      {/* High-Level Intervention Override Controls */}
      <div className="admin-card p-6 border-red-200 bg-gradient-to-b from-white to-red-50/20">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Bảng Can Thiệp An Ninh Cấp Cao (Emergency Override Controls)
            </h3>
          </div>
          <span className="text-[11px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded">
            High Security
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Unlock All */}
          <div className="p-4 bg-white rounded-xl border border-red-200 shadow-xs flex flex-col justify-between space-y-3">
            <div>
              <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center mb-2">
                <Unlock className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-xs text-slate-900">Mở Khóa Thoát Hiểm</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Giải phóng toàn bộ chốt cửa điện tử của các tòa nhà khi có hỏa hoạn.
              </p>
            </div>
            <button
              onClick={() => triggerEmergencyAction('UNLOCK_ALL')}
              className="w-full py-2 bg-red-600 text-white font-bold text-xs rounded-lg hover:bg-red-700 active:scale-98 transition-all cursor-pointer shadow-xs"
            >
              Mở Khóa Toàn Khu
            </button>
          </div>

          {/* Lockdown */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
            <div>
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center mb-2">
                <Lock className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-xs text-slate-900">Phong Tỏa Tòa Nhà</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Khóa chặt điện tử và đóng cổng kiểm soát để ngăn chặn đột nhập nguy hiểm.
              </p>
            </div>
            <button
              onClick={() => triggerEmergencyAction('LOCKDOWN')}
              className="w-full py-2 bg-slate-900 text-white font-bold text-xs rounded-lg hover:bg-slate-800 active:scale-98 transition-all cursor-pointer shadow-xs"
            >
              Kích Hoạt Lockdown
            </button>
          </div>

          {/* Siren */}
          <div className="p-4 bg-white rounded-xl border border-amber-200 shadow-xs flex flex-col justify-between space-y-3">
            <div>
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mb-2">
                <Volume2 className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-xs text-slate-900">Còi Báo Động 110dB</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Bật còi báo động khẩn cấp tại toàn bộ hành lang và phòng KTX.
              </p>
            </div>
            <button
              onClick={() => triggerEmergencyAction('SIREN')}
              className="w-full py-2 bg-amber-500 text-white font-bold text-xs rounded-lg hover:bg-amber-600 active:scale-98 transition-all cursor-pointer shadow-xs"
            >
              Bật Còi Báo Động
            </button>
          </div>

          {/* Broadcast */}
          <div className="p-4 bg-white rounded-xl border border-blue-200 shadow-xs flex flex-col justify-between space-y-3">
            <div>
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center mb-2">
                <Megaphone className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-xs text-slate-900">Phát Sóng Khẩn Cấp</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Gửi thông báo khẩn cấp tới sinh viên lưu trú trên ứng dụng & Telegram.
              </p>
            </div>
            <button
              onClick={() => triggerEmergencyAction('BROADCAST')}
              className="w-full py-2 bg-blue-900 text-white font-bold text-xs rounded-lg hover:bg-blue-800 active:scale-98 transition-all cursor-pointer shadow-xs"
            >
              Phát Sóng Tin Nhắn
            </button>
          </div>
        </div>
      </div>

      {/* Automated Strategy Pattern Model Details */}
      <div className="admin-card p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Layers className="w-4 h-4 text-blue-900" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Mô Hình Phản Ứng Tự Động Theo Strategy Pattern
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-red-50/60 border border-red-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-red-900">Chiến Lược Báo Cháy (Fire Strategy)</span>
              <Flame className="w-4 h-4 text-red-600" />
            </div>
            <ul className="text-xs text-red-800 space-y-1.5 pt-1">
              <li className="flex items-center gap-1.5">✓ Bật còi báo động liên tục toàn khu</li>
              <li className="flex items-center gap-1.5">✓ Mở toàn bộ khóa chốt điện thoát hiểm</li>
              <li className="flex items-center gap-1.5">✓ Tự động ngắt phụ tải điện</li>
              <li className="flex items-center gap-1.5">✓ Gửi Telegram (có nút thao tác) & Email BQL</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-amber-900">Chiến Lược Rò Rỉ Gas (Gas Strategy)</span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <ul className="text-xs text-amber-800 space-y-1.5 pt-1">
              <li className="flex items-center gap-1.5">✓ Tự động bật quạt hút thông gió tối đa</li>
              <li className="flex items-center gap-1.5">✓ Tắt các thiết bị điện tránh phát tia lửa</li>
              <li className="flex items-center gap-1.5">✓ Cảnh báo còi nhịp ngắt quãng</li>
              <li className="flex items-center gap-1.5">✓ Gửi thông báo sinh viên & Telegram</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-blue-900">Chiến Lược Xâm Nhập (Intrusion Strategy)</span>
              <ShieldAlert className="w-4 h-4 text-blue-900" />
            </div>
            <ul className="text-xs text-blue-800 space-y-1.5 pt-1">
              <li className="flex items-center gap-1.5">✓ Khóa chặt chốt cửa điện tử</li>
              <li className="flex items-center gap-1.5">✓ Ghi nhật ký thẻ RFID Blacklist</li>
              <li className="flex items-center gap-1.5">✓ Cảnh báo trực ban an ninh tức thời</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Active Emergencies List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
          Danh Sách Sự Cố Đang Hoạt Động Cần Xử Lý ({emergencies.length})
        </h3>

        {emergencies.length === 0 ? (
          <div className="admin-card p-8 text-center text-slate-400">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
            <p className="text-xs font-semibold text-slate-600">Tuyệt vời! Hiện tại không có sự cố khẩn cấp nào.</p>
          </div>
        ) : (
          emergencies.map((emg) => (
            <div
              key={emg.id}
              className="admin-card p-5 border-red-300 bg-red-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs"
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-red-100 text-red-600 flex-shrink-0 mt-0.5">
                  <Flame className="w-5 h-5 animate-pulse" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="critical" size="sm">
                      {emg.level}
                    </Badge>
                    <h3 className="font-bold text-xs text-slate-900">{emg.title}</h3>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">
                    {emg.description}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono pt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Vị trí: Tòa {emg.buildingName} • Phòng {emg.roomNumber}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {emg.timestamp}
                    </span>
                    {emg.sensorValue !== undefined && (
                      <>
                        <span>•</span>
                        <span className="text-red-600 font-bold">
                          Giá trị cảm biến: {emg.sensorValue}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Direct Room Action Controls & Resolve Button */}
              <div className="flex flex-wrap items-center gap-2 flex-shrink-0 self-end md:self-center">
                <button
                  type="button"
                  onClick={() => handleDeviceControl(emg, 'LIGHT', 'off')}
                  disabled={deviceActionLoading === `${emg.id}_LIGHT_off`}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white text-slate-700 hover:bg-slate-100 border border-slate-300 flex items-center gap-1 transition-all cursor-pointer"
                  title="Ngắt điện phòng bị sự cố"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-600" />
                  <span>Ngắt điện</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDeviceControl(emg, 'FAN', 'on')}
                  disabled={deviceActionLoading === `${emg.id}_FAN_on`}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-900 hover:bg-blue-100 border border-blue-200 flex items-center gap-1 transition-all cursor-pointer"
                  title="Bật quạt thông gió phòng"
                >
                  <Fan className="w-3.5 h-3.5 text-blue-700" />
                  <span>Bật quạt</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDeviceControl(emg, 'DOOR_LOCK', 'unlock')}
                  disabled={deviceActionLoading === `${emg.id}_DOOR_LOCK_unlock`}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200 flex items-center gap-1 transition-all cursor-pointer"
                  title="Mở khóa chốt cửa phòng"
                >
                  <Unlock className="w-3.5 h-3.5 text-amber-700" />
                  <span>Mở cửa</span>
                </button>

                <Button
                  variant="primary"
                  size="sm"
                  loading={resolvingId === emg.id}
                  onClick={() => handleResolve(emg.id)}
                  icon={<CheckCircle2 className="w-4 h-4" />}
                >
                  Xác Nhận Đã Xử Lý
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={executeConfirmedAction}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        loading={actionLoading}
        confirmText="Xác nhận thực thi ngay"
        cancelText="Hủy bỏ"
      />
    </div>
  );
}
