'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSocket } from '@/lib/socket';
import api from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastContext';
import { 
  Bell, 
  Flame, 
  AlertTriangle, 
  ShieldCheck, 
  CheckCircle2, 
  Info,
  Calendar,
  Sparkles,
  Zap,
  Fan,
  Unlock,
  DollarSign,
  ArrowRight
} from 'lucide-react';

export default function StudentAlertsPage() {
  const { success, error } = useToast();
  const [roomNumber, setRoomNumber] = useState('101');
  const [roomId, setRoomId] = useState('room-101');
  const [emergencyAlert, setEmergencyAlert] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [monthlyBill, setMonthlyBill] = useState<{
    kwh: number;
    totalAmount: number;
    perStudent: number;
    month: string;
  }>({
    kwh: 126.0,
    totalAmount: 284760,
    perStudent: 71190,
    month: `Tháng ${new Date().getMonth() + 1}/${new Date().getFullYear()}`,
  });

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.get('/rooms/overview');
        if (Array.isArray(res.data) && res.data.length > 0) {
          const myRoom = res.data.find((r: any) => r.roomNumber === '101' || r.roomNumber.includes('101')) || res.data[0];
          if (myRoom) {
            setRoomNumber(myRoom.roomNumber);
            setRoomId(myRoom.id);
            const lastSensor = myRoom.sensorData?.[0];
            if (lastSensor && (lastSensor.temperature > 48 || lastSensor.gasLevel > 60 || lastSensor.gasAlert || lastSensor.tempAlert)) {
              setEmergencyAlert({
                type: lastSensor.tempAlert || lastSensor.temperature > 48 ? 'FIRE' : 'GAS_LEAK',
                message: lastSensor.tempAlert || lastSensor.temperature > 48
                  ? `CẢNH BÁO: Nhiệt độ phòng bạn đang ở mức ${lastSensor.temperature}°C!`
                  : `CẢNH BÁO: Phát hiện nồng độ khí gas trong phòng (${lastSensor.gasLevel}%)!`,
                temp: lastSensor.temperature,
                gas: lastSensor.gasLevel,
                time: 'Vừa xong',
              });
            }
          }
        }

        // Fetch monthly bill calculation
        const billRes = await api.get(`/analytics/monthly-bill/101`);
        if (billRes.data) {
          setMonthlyBill({
            kwh: billRes.data.kwhConsumed || 126.0,
            totalAmount: billRes.data.totalVnd || 284760,
            perStudent: billRes.data.perStudentVnd || 71190,
            month: billRes.data.currentMonth || `Tháng ${new Date().getMonth() + 1}/${new Date().getFullYear()}`,
          });
        }
      } catch (e) {
        console.warn('Student alerts load fallback', e);
      }
    }
    loadData();

    const socket = getSocket();
    socket.on('emergency:alert', (alert: any) => {
      if (alert.roomId === roomId || alert.roomId?.includes('101')) {
        setEmergencyAlert({
          type: alert.type || 'FIRE',
          message: alert.message || 'Cảnh báo an toàn khẩn cấp tại phòng bạn!',
          time: 'Vừa xong',
        });
      }
    });

    socket.on('emergency:resolved', () => {
      setEmergencyAlert(null);
    });

    return () => {
      socket.off('emergency:alert');
      socket.off('emergency:resolved');
    };
  }, [roomId]);

  async function handleDeviceControl(deviceType: string, action: string) {
    const key = `${deviceType}_${action}`;
    setActionLoading(key);
    try {
      const targetRoom = roomId || roomNumber || '101';
      await api.post('/devices/command', {
        roomId: targetRoom,
        deviceType,
        action,
      });
      const deviceNames: Record<string, string> = {
        LIGHT: 'Đèn & nguồn điện',
        FAN: 'Quạt thông gió',
        DOOR_LOCK: 'Khóa cửa điện tử',
        BUZZER: 'Còi báo động',
      };
      success(`Đã thực thi thành công: ${action.toUpperCase()} ${deviceNames[deviceType] || deviceType} Phòng ${roomNumber}!`, 'Điều Khiển Khẩn Cấp');
    } catch (err: any) {
      error('Không thể kết nối máy chủ điều khiển thiết bị', 'Lỗi');
    } finally {
      setActionLoading(null);
    }
  }

  const roomAlerts = [
    {
      id: 'alt-bill',
      type: 'BILLING',
      title: `Thông báo tiền điện định kỳ ${monthlyBill.month}`,
      description: `Phòng ${roomNumber} đã tiêu thụ ${monthlyBill.kwh} kWh điện. Tổng tiền phòng: ${monthlyBill.totalAmount.toLocaleString('vi-VN')} ₫. Tiền điện của bạn (chia 4): ${monthlyBill.perStudent.toLocaleString('vi-VN')} ₫. Hạn thanh toán: Ngày 10 hàng tháng.`,
      time: 'Hôm nay',
      isRead: false,
    },
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
      title: 'Cập nhật phân quyền thẻ RFID phòng',
      description: `Thẻ sinh viên của bạn đã được gia hạn quyền mở khóa cửa phòng ${roomNumber} cho học kỳ mới.`,
      time: '12/08/2026',
      isRead: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Thông Báo & Cảnh Báo Phòng {roomNumber}</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Các thông báo hóa đơn điện định kỳ từ BQL và cảnh báo an toàn cảm biến trong phòng của bạn.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={emergencyAlert ? "critical" : "success"} size="md">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{emergencyAlert ? `Phòng ${roomNumber} CẦN CHÚ Ý` : `Phòng ${roomNumber} an toàn`}</span>
          </Badge>
        </div>
      </div>

      {/* Real-time Emergency Alert Card with Direct Controls if active */}
      {emergencyAlert && (
        <div className="admin-card p-5 bg-red-50/80 border-red-300 shadow-md space-y-3 animate-fade-in">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-red-600 text-white animate-pulse">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="critical" size="sm">KHẨN CẤP</Badge>
                  <h3 className="font-bold text-sm text-red-950">{emergencyAlert.message}</h3>
                </div>
                <p className="text-xs text-red-800 mt-1">
                  Hệ thống bảo vệ đã tự động gửi cảnh báo. Bạn có thể can thiệp thao tác nhanh các thiết bị phòng mình bên dưới:
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-red-500">{emergencyAlert.time}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-red-200">
            <button
              onClick={() => handleDeviceControl('LIGHT', 'off')}
              disabled={actionLoading === 'LIGHT_off'}
              className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 active:scale-98 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Ngắt Điện Phòng</span>
            </button>

            <button
              onClick={() => handleDeviceControl('FAN', 'on')}
              disabled={actionLoading === 'FAN_on'}
              className="px-3 py-1.5 bg-blue-900 text-white text-xs font-bold rounded-lg hover:bg-blue-800 active:scale-98 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Fan className="w-3.5 h-3.5" />
              <span>Bật Quạt Thông Gió</span>
            </button>

            <button
              onClick={() => handleDeviceControl('DOOR_LOCK', 'unlock')}
              disabled={actionLoading === 'DOOR_LOCK_unlock'}
              className="px-3 py-1.5 bg-amber-600 text-white text-xs font-bold rounded-lg hover:bg-amber-700 active:scale-98 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Mở Khóa Cửa</span>
            </button>
          </div>
        </div>
      )}

      {/* Alerts List */}
      <div className="space-y-3">
        {roomAlerts.map((alt) => (
          <div
            key={alt.id}
            className={`admin-card p-4.5 flex items-start gap-3.5 transition-all ${
              alt.type === 'BILLING' ? 'bg-blue-50/40 border-blue-200' : ''
            }`}
          >
            <div className={`p-2.5 rounded-xl flex-shrink-0 mt-0.5 ${
              alt.type === 'BILLING' ? 'bg-blue-100 text-blue-900' : 'bg-slate-100 text-slate-700'
            }`}>
              {alt.type === 'BILLING' ? <DollarSign className="w-5 h-5" /> : <Info className="w-5 h-5" />}
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  {alt.type === 'BILLING' && <Badge variant="info" size="sm">Định kỳ</Badge>}
                  <h3 className="font-bold text-xs text-slate-900">{alt.title}</h3>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">{alt.time}</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {alt.description}
              </p>

              {alt.type === 'BILLING' && (
                <div className="mt-2.5 pt-2 border-t border-blue-100 flex items-center justify-between">
                  <span className="text-[11px] text-blue-900 font-bold">
                    Tiền của bạn: {monthlyBill.perStudent.toLocaleString('vi-VN')} ₫
                  </span>
                  <Link
                    href="/student/energy"
                    className="text-xs text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1"
                  >
                    <span>Xem chi tiết & Tải hóa đơn</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
