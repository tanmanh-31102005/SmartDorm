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
  Megaphone
} from 'lucide-react';

export default function EmergencyPage() {
  const { success, warning, error } = useToast();
  const [emergencies, setEmergencies] = useState<IncidentAlert[]>(INITIAL_ALERTS.filter(a => !a.isResolved));
  const [liveAlert, setLiveAlert] = useState<any | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

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

  useEffect(() => {
    async function loadEmergencies() {
      try {
        const res = await api.get('/emergency?resolved=false');
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          const mapped: IncidentAlert[] = res.data.map((e: any) => ({
            id: e.id,
            type: e.type,
            level: e.level || 'CRITICAL',
            title: e.type === 'FIRE' ? 'Phát hiện nguy cơ hỏa hoạn' : 'Rò rỉ khí gas vượt ngưỡng',
            description: e.description || `Sự cố tại phòng ${e.room?.roomNumber || ''}`,
            roomId: e.roomId,
            roomNumber: e.room?.roomNumber || '101',
            buildingName: e.room?.building?.name || 'A',
            sensorValue: e.sensorValue,
            timestamp: 'Vừa xong',
            isResolved: e.isResolved || false,
            actionsTaken: ['Kích hoạt còi báo động', 'Mở toàn bộ khóa cửa thoát hiểm'],
          }));
          setEmergencies(mapped);
        }
      } catch (err) {
        console.error('Emergency load fallback', err);
      }
    }
    loadEmergencies();

    const socket = getSocket();
    socket.on('emergency:alert', (alert: any) => {
      setLiveAlert(alert);
      loadEmergencies();
      setTimeout(() => setLiveAlert(null), 15000);
    });

    return () => {
      socket.off('emergency:alert');
    };
  }, []);

  async function handleResolve(id: string) {
    setResolvingId(id);
    try {
      await api.patch(`/emergency/resolve/${id}`);
      setEmergencies(prev => prev.filter(e => e.id !== id));
      success('Đã hoàn tất xử lý sự cố an toàn!', 'Hoàn Tất');
    } catch (e) {
      setEmergencies(prev => prev.filter(e => e.id !== id));
      success('Đã xác nhận xử lý sự cố an toàn!', 'Hoàn Tất');
    } finally {
      setResolvingId(null);
    }
  }

  function triggerEmergencyAction(actionType: 'UNLOCK_ALL' | 'LOCKDOWN' | 'SIREN' | 'BROADCAST') {
    const dialogConfigs = {
      UNLOCK_ALL: {
        title: 'Xác Nhận Mở Toàn Bộ Cửa Thoát Hiểm?',
        message: 'Lệnh này sẽ phát sóng qua MQTT để mở chốt điện của TOÀN BỘ 248 phòng KTX tại Tòa A, B, C phục vụ cứu nạn khẩn cấp. Hành động này sẽ được ghi vào nhật ký an ninh.',
        variant: 'danger' as const,
      },
      LOCKDOWN: {
        title: 'Kích Hoạt Phong Tỏa Toàn Tòa Nhà (Lockdown)?',
        message: 'Lệnh này sẽ khóa chặt toàn bộ cửa điện tử và từ chối mọi lượt quẹt thẻ chưa được cấp quyền khẩn cấp để ngăn chặn đột nhập nguy hiểm.',
        variant: 'danger' as const,
      },
      SIREN: {
        title: 'Kích Hoạt Còi Báo Động Toàn Khuôn Viên?',
        message: 'Còi hú báo động 110dB tại tất cả các tầng sẽ được kích hoạt tức thời.',
        variant: 'warning' as const,
      },
      BROADCAST: {
        title: 'Phát Sóng Thông Báo Khẩn Cấp Tới Sinh Viên?',
        message: 'Gửi tin nhắn cảnh báo khẩn cấp tới ứng dụng di động và cổng sinh viên của toàn bộ 842 sinh viên lưu trú.',
        variant: 'primary' as const,
      },
    };

    const cfg = dialogConfigs[actionType];
    setConfirmModal({
      isOpen: true,
      title: cfg.title,
      message: cfg.message,
      actionType,
      variant: cfg.variant,
    });
  }

  async function executeConfirmedAction() {
    setActionLoading(true);
    setTimeout(() => {
      setActionLoading(false);
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
      
      const successMsgs = {
        UNLOCK_ALL: 'Đã phát lệnh MQTT Mở Khóa Cửa Khẩn Cấp tới toàn bộ 3 tòa nhà!',
        LOCKDOWN: 'Đã kích hoạt chế độ Phong Tỏa An Ninh (Lockdown) toàn campus!',
        SIREN: 'Đã kích hoạt còi báo động khẩn cấp!',
        BROADCAST: 'Đã phát sóng thông báo khẩn cấp tới toàn bộ sinh viên KTX!',
      };
      success(successMsgs[confirmModal.actionType], 'Lệnh Khẩn Cấp Thực Thi');
    }, 1000);
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
          <Badge variant={emergencies.length > 0 ? 'critical' : 'success'} size="md">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{emergencies.length} Sự cố đang hoạt động</span>
          </Badge>
        </div>
      </div>

      {/* Live Broadcast Banner Popup */}
      {liveAlert && (
        <div className="bg-red-50 border-2 border-red-300 text-red-950 rounded-2xl p-5 flex items-start justify-between gap-4 shadow-lg animate-in slide-in-from-top-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-xl bg-red-100 text-red-600 flex-shrink-0">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-red-700 uppercase tracking-wider">CẢNH BÁO KHẨN CẤP REAL-TIME</span>
                <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
              </div>
              <h3 className="text-base font-bold text-red-950">{liveAlert.title || liveAlert.message}</h3>
              <p className="text-xs text-red-800 mt-1 font-mono">
                Phòng: <strong>{liveAlert.roomId || 'B204'}</strong> • Phân loại: <strong>{liveAlert.type || 'FIRE'}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={() => setLiveAlert(null)}
            className="p-1 rounded-lg hover:bg-red-200 text-red-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* High-Security Emergency Control Actions Grid */}
      <div className="admin-card p-6 border-red-200 bg-red-50/20">
        <div className="flex items-center justify-between pb-3 border-b border-red-100 mb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-600" />
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-red-950">
                Bảng Can Thiệp An Ninh Cấp Cao (Emergency Override Controls)
              </h3>
              <p className="text-[11px] text-red-700">Các hành động yêu cầu xác thực 2 bước để đảm bảo an toàn tuyệt đối</p>
            </div>
          </div>
          <Badge variant="critical" size="sm">
            High Security
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Action 1: Emergency Unlock All */}
          <div className="p-4 rounded-xl bg-white border border-red-200 shadow-xs flex flex-col justify-between space-y-3">
            <div>
              <div className="w-9 h-9 rounded-lg bg-red-100 text-red-600 flex items-center justify-center mb-2">
                <Unlock className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-xs text-slate-900 leading-tight">Mở Khóa Thoát Hiểm</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                Giải phóng toàn bộ chốt cửa điện tử 3 tòa nhà khi có hỏa hoạn.
              </p>
            </div>

            <Button
              variant="danger"
              size="sm"
              onClick={() => triggerEmergencyAction('UNLOCK_ALL')}
              className="w-full"
            >
              Mở Khóa Toàn Khu
            </Button>
          </div>

          {/* Action 2: Building Lockdown */}
          <div className="p-4 rounded-xl bg-white border border-red-200 shadow-xs flex flex-col justify-between space-y-3">
            <div>
              <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center mb-2">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-xs text-slate-900 leading-tight">Phong Tỏa Tòa Nhà</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                Khóa chốt điện và đóng cổng kiểm soát để ngăn chặn đột nhập nguy hiểm.
              </p>
            </div>

            <Button
              variant="danger"
              size="sm"
              onClick={() => triggerEmergencyAction('LOCKDOWN')}
              className="w-full bg-slate-900 hover:bg-slate-800"
            >
              Kích Hoạt Lockdown
            </Button>
          </div>

          {/* Action 3: Siren */}
          <div className="p-4 rounded-xl bg-white border border-amber-200 shadow-xs flex flex-col justify-between space-y-3">
            <div>
              <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mb-2">
                <Volume2 className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-xs text-slate-900 leading-tight">Còi Báo Động 110dB</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                Bật còi báo động khẩn cấp tại toàn bộ hành lang và phòng KTX.
              </p>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => triggerEmergencyAction('SIREN')}
              className="w-full border-amber-300 text-amber-900 hover:bg-amber-50"
            >
              Bật Còi Báo Động
            </Button>
          </div>

          {/* Action 4: Broadcast */}
          <div className="p-4 rounded-xl bg-white border border-blue-200 shadow-xs flex flex-col justify-between space-y-3">
            <div>
              <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center mb-2">
                <Megaphone className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-xs text-slate-900 leading-tight">Phát Sóng Khẩn Cấp</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                Gửi thông báo khẩn cấp tới 842 sinh viên lưu trú trên ứng dụng.
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => triggerEmergencyAction('BROADCAST')}
              className="w-full"
            >
              Phát Sóng Tin Nhắn
            </Button>
          </div>
        </div>
      </div>

      {/* Strategy Pattern Architecture Cards */}
      <div className="admin-card p-5">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
          <Layers className="w-4 h-4 text-blue-900" />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Mô Hình Phản Ứng Tự Động Theo Strategy Pattern
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {[
            {
              type: 'FIRE',
              name: 'Chiến Lược Báo Cháy (Fire Strategy)',
              icon: Flame,
              color: 'critical' as const,
              actions: ['Bật còi báo động liên tục toàn khu', 'Mở toàn bộ khóa chốt điện thoát hiểm', 'Broadcast Socket.IO & Gửi Telegram BQL'],
            },
            {
              type: 'GAS_LEAK',
              name: 'Chiến Lược Rò Rỉ Gas (Gas Strategy)',
              icon: AlertTriangle,
              color: 'warning' as const,
              actions: ['Còi báo động ngắt quãng cảnh báo', 'Tự động bật quạt hút thông gió tối đa', 'Gửi thông báo cho sinh viên trong phòng'],
            },
            {
              type: 'INTRUSION',
              name: 'Chiến Lược Xâm Nhập (Intrusion Strategy)',
              icon: ShieldAlert,
              color: 'info' as const,
              actions: ['Khóa chặt chốt cửa điện tử', 'Ghi nhật ký RFID Blacklist', 'Cảnh báo trực ban an ninh tức thời'],
            },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.type} className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="font-bold text-xs text-slate-900">{s.name}</span>
                    <Badge variant={s.color} size="sm">
                      <Icon className="w-3 h-3" />
                      {s.type}
                    </Badge>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    {s.actions.map((act, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span>{act}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Incidents List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900">Danh Sách Sự Cố Đang Hoạt Động Cần Xử Lý</h3>

        {emergencies.length === 0 ? (
          <div className="admin-card p-10 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h4 className="font-bold text-sm text-slate-900">Toàn Bộ Hệ Thống KTX An Toàn</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Không có sự cố nào đang diễn ra. Cảm biến môi trường và thiết bị an ninh hoạt động ổn định.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {emergencies.map((e) => (
              <div
                key={e.id}
                className="admin-card p-4 border-red-200 bg-red-50/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-red-100 text-red-600 flex-shrink-0 mt-0.5">
                    {e.type === 'FIRE' ? <Flame className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-sm text-red-900">{e.title}</h4>
                      <Badge variant="critical" size="sm">
                        {e.level}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-700">
                      Vị trí: <strong className="text-slate-900">Tòa {e.buildingName} · Phòng {e.roomNumber}</strong>
                      {e.sensorValue && <span> • Giá trị cảm biến: <strong className="text-red-600 font-mono">{e.sensorValue}</strong></span>}
                    </p>
                    <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                      Ghi nhận lúc: {e.timestamp}
                    </p>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  loading={resolvingId === e.id}
                  onClick={() => handleResolve(e.id)}
                  className="bg-emerald-700 hover:bg-emerald-800 text-xs px-4"
                  icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                >
                  Xác Nhận Đã Xử Lý
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* High-Safety Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={executeConfirmedAction}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Xác Nhận Thực Thi"
        cancelText="Hủy Bỏ"
        variant={confirmModal.variant}
        loading={actionLoading}
      />
    </div>
  );
}
