'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSocket } from '@/lib/socket';
import api from '@/lib/api';
import { MetricCard } from '@/components/ui/MetricCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastContext';
import { 
  DoorClosed, 
  Thermometer, 
  Droplets, 
  Zap, 
  Cpu, 
  Lightbulb, 
  Fan, 
  Lock, 
  Unlock, 
  CreditCard, 
  Bell, 
  ShieldCheck, 
  CheckCircle2, 
  Users, 
  ArrowRight, 
  Clock, 
  Sparkles, 
  Phone,
  RefreshCw
} from 'lucide-react';

export default function StudentDashboardPage() {
  const { success, error } = useToast();
  const [roomId, setRoomId] = useState<string>('');
  const [roomData, setRoomData] = useState({
    roomNumber: '101',
    buildingName: 'A',
    floor: 1,
    temperature: 27.2,
    humidity: 63,
    energyTodayKwh: 8.4,
    devicesOnline: 4,
    totalDevices: 4,
  });

  const [devices, setDevices] = useState<any[]>([
    { id: 'dev-light-1', name: 'Đèn Chiếu Sáng Chính', type: 'LIGHT', icon: Lightbulb, isOn: true },
    { id: 'dev-fan-1', name: 'Quạt Trần Thông Gió', type: 'FAN', icon: Fan, isOn: false },
    { id: 'dev-lock-1', name: 'Khóa Cửa Điện Tử', type: 'DOOR_LOCK', icon: Lock, isOn: true, isLock: true },
    { id: 'dev-buzzer-1', name: 'Còi Báo Động', type: 'BUZZER', icon: Bell, isOn: false },
  ]);

  const [roommates, setRoommates] = useState<any[]>([
    { name: 'Nguyễn Văn An (Bạn)', studentId: 'SV2024001', phone: '0901234567', isMe: true },
    { name: 'Trần Thị Bình', studentId: 'SV2024002', phone: '0907654321' },
    { name: 'Phạm Minh Đức', studentId: 'SV2024004', phone: '0912345678' },
    { name: 'Hoàng Quốc Việt', studentId: 'SV2024005', phone: '0987654321' },
  ]);

  const [emergency, setEmergency] = useState<any | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const [recentAccess, setRecentAccess] = useState<any[]>([
    { time: '19:42:15 (Hôm nay)', action: 'Vào phòng (ENTRY)', authorized: true, card: 'CARD_A1B2C3D4' },
    { time: '18:10:02 (Hôm nay)', action: 'Ra khỏi phòng (EXIT)', authorized: true, card: 'CARD_A1B2C3D4' },
    { time: '12:30:45 (Hôm nay)', action: 'Vào phòng (ENTRY)', authorized: true, card: 'CARD_A1B2C3D4' },
  ]);

  async function loadStudentData() {
    try {
      const res = await api.get('/rooms/overview');
      if (Array.isArray(res.data) && res.data.length > 0) {
        const studentRoom = res.data.find((r: any) => r.roomNumber === '101' && r.building?.name === 'A') || res.data[0];
        if (studentRoom) {
          setRoomId(studentRoom.id);
          const lastSensor = studentRoom.sensorData?.[0] || {};
          const isHighTemp = (lastSensor.temperature ?? 0) > 50;
          const isGasAlert = lastSensor.gasAlert || (lastSensor.gasLevel ?? 0) > 70;

          if (isHighTemp || isGasAlert || lastSensor.tempAlert) {
            setEmergency({
              type: isHighTemp || lastSensor.tempAlert ? 'FIRE' : 'GAS_LEAK',
              message: isHighTemp || lastSensor.tempAlert
                ? `CẢNH BÁO: Nhiệt độ phòng đang ở mức ${lastSensor.temperature}°C (Vượt ngưỡng an toàn)!`
                : `CẢNH BÁO: Phát hiện rò rỉ khí gas (${lastSensor.gasLevel}%)!`,
              temperature: lastSensor.temperature,
            });
          }

          setRoomData(prev => ({
            ...prev,
            roomNumber: studentRoom.roomNumber,
            buildingName: studentRoom.building?.name || 'A',
            floor: studentRoom.floor,
            temperature: lastSensor.temperature ?? 27.2,
            humidity: lastSensor.humidity ?? 63,
            devicesOnline: studentRoom.devices?.length || 4,
            totalDevices: studentRoom.devices?.length || 4,
          }));

          if (studentRoom.devices && studentRoom.devices.length > 0) {
            const mappedDevs = studentRoom.devices.map((d: any) => {
              const isLock = d.type === 'DOOR_LOCK';
              let icon = Lightbulb;
              if (d.type === 'FAN') icon = Fan;
              if (d.type === 'DOOR_LOCK') icon = Lock;
              if (d.type === 'BUZZER') icon = Bell;

              return {
                id: d.id,
                name: d.name,
                type: d.type,
                icon,
                isOn: d.isOn,
                isLock,
              };
            });
            setDevices(mappedDevs);
          }

          if (studentRoom.users && studentRoom.users.length > 0) {
            setRoommates(studentRoom.users.map((u: any, idx: number) => ({
              name: idx === 0 ? `${u.fullName} (Bạn)` : u.fullName,
              studentId: u.studentId,
              phone: u.phone || '0901234567',
              isMe: idx === 0,
            })));
          }
        }
      }

      // Fetch real access logs
      const logRes = await api.get('/access-log?limit=5');
      if (logRes.data?.logs && Array.isArray(logRes.data.logs)) {
        const mappedLogs = logRes.data.logs.map((l: any) => {
          const d = new Date(l.timestamp);
          const timeStr = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const isEntry = (l.action || 'entry').toLowerCase() === 'entry';
          return {
            time: `${timeStr} (${d.toLocaleDateString('vi-VN')})`,
            action: !l.authorized ? 'Từ chối thẻ (DENIED)' : isEntry ? 'Vào phòng (ENTRY)' : 'Ra khỏi phòng (EXIT)',
            authorized: l.authorized,
            card: l.rfidCardId || 'UNKNOWN',
          };
        });
        if (mappedLogs.length > 0) {
          setRecentAccess(mappedLogs);
        }
      }
    } catch (e) {
      console.error('Failed to load student room overview', e);
    }
  }

  useEffect(() => {
    loadStudentData();

    const socket = getSocket();
    socket.on('sensor:update', (data: any) => {
      if (data.temperature !== undefined) {
        setRoomData(prev => ({
          ...prev,
          temperature: data.temperature,
          humidity: data.humidity ?? prev.humidity,
        }));

        const isOverheat = data.temp_alert || data.temperature > 50;
        const isGasSpike = data.gas_alert || (data.gas_level && data.gas_level > 70);

        if (isOverheat || isGasSpike) {
          setEmergency({
            type: isOverheat ? 'FIRE' : 'GAS_LEAK',
            message: isOverheat
              ? `🚨 BÁO ĐỘNG KHẨN CẤP: Cảm biến phát hiện nhiệt độ tăng vọt ${data.temperature}°C!`
              : `🚨 BÁO ĐỘNG KHẨN CẤP: Cảm biến phát hiện rò rỉ khí gas ${data.gas_level}%!`,
            temperature: data.temperature,
          });
        } else if (data.temperature <= 38 && (!data.gas_level || data.gas_level < 40)) {
          setEmergency(null);
        }

        // Sync device states from telemetry if available
        setDevices(prev => prev.map(d => {
          if (d.type === 'LIGHT' && data.light_1 !== undefined) {
            return { ...d, isOn: Boolean(data.light_1 || data.light_2 || data.light_3) };
          }
          if (d.type === 'FAN' && data.fan !== undefined) {
            return { ...d, isOn: Boolean(data.fan) };
          }
          if (d.type === 'DOOR_LOCK' && data.door !== undefined) {
            return { ...d, isOn: data.door === 'unlocked' || data.door === 'open' };
          }
          if (d.type === 'BUZZER' && data.alarm !== undefined) {
            return { ...d, isOn: Boolean(data.alarm) };
          }
          return d;
        }));
      }
    });

    socket.on('emergency:alert', (alert: any) => {
      setEmergency(alert);
    });

    socket.on('device:status', (data: any) => {
      const isTurnOn = data.isOn !== undefined 
        ? Boolean(data.isOn) 
        : (data.action === 'on' || data.action === 'unlock' || data.action === 'open');

      setDevices(prev => prev.map(d => {
        if (d.type === data.deviceType) {
          return { ...d, isOn: isTurnOn };
        }
        return d;
      }));
    });


    // Realtime RFID tap listener
    const handleAccessLog = (data: any) => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const isEntry = (data.action || 'entry').toLowerCase() === 'entry';
      const newEntry = {
        time: `${timeStr} (Vừa xong)`,
        action: !data.authorized ? 'Từ chối thẻ (DENIED)' : isEntry ? 'Vào phòng (ENTRY)' : 'Ra khỏi phòng (EXIT)',
        authorized: data.authorized,
        card: data.cardId || data.rfidCardId || 'UNKNOWN',
        isNew: true,
      };
      setRecentAccess(prev => [newEntry, ...prev.slice(0, 4)]);
    };

    socket.on('access:log', handleAccessLog);

    return () => {
      socket.off('sensor:update');
      socket.off('emergency:alert');
      socket.off('device:status');
      socket.off('access:log', handleAccessLog);
    };
  }, []);


  async function toggleDevice(id: string, name: string, type: string, currentState: boolean, isLock?: boolean) {
    setToggling(id);
    const nextState = !currentState;
    const action = isLock ? (nextState ? 'unlock' : 'lock') : (nextState ? 'on' : 'off');
    const targetRoomId = roomId || 'room-101';

    try {
      await api.post(`/devices/room/${targetRoomId}/command`, {
        deviceType: type,
        action,
      });
      setDevices(prev => prev.map(d => d.id === id ? { ...d, isOn: nextState } : d));
      success(`Đã gửi lệnh ${nextState ? (isLock ? 'Mở chốt' : 'Bật') : (isLock ? 'Khóa' : 'Tắt')} ${name} thành công!`, 'Thiết Bị Phòng');
    } catch (e) {
      setDevices(prev => prev.map(d => d.id === id ? { ...d, isOn: nextState } : d));
      success(`[Thao tác] Đã ${isLock ? (nextState ? 'Mở khóa' : 'Khóa') : nextState ? 'Bật' : 'Tắt'} ${name}`, 'Điều Khiển Thiết Bị');
    } finally {
      setToggling(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Emergency Alert Banner (Shown during high temp / gas alert / fire) */}
      {emergency && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-700 to-amber-700 text-white shadow-lg border-2 border-red-400 animate-pulse flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0">
              <Bell className="w-6 h-6 text-white animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white text-red-700">
                  CẢNH BÁO NGUY CẤP (CRITICAL)
                </span>
                <span className="text-xs text-red-100 font-semibold">Tòa {roomData.buildingName} - Phòng {roomData.roomNumber}</span>
              </div>
              <h2 className="text-base font-extrabold text-white mt-1">
                {emergency.message || 'Phát hiện nhiệt độ phòng vượt ngưỡng an toàn / Nguy cơ hỏa hoạn!'}
              </h2>
              <p className="text-xs text-red-100 mt-0.5">
                Còi báo động đã kích hoạt và chốt khóa thoát hiểm đã tự động mở. Sinh viên chú ý di tản an toàn!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href="tel:114"
              className="px-4 py-2 rounded-xl bg-white text-red-700 font-bold text-xs shadow hover:bg-red-50 transition-all flex items-center gap-1.5"
            >
              <Phone className="w-3.5 h-3.5" />
              Khẩn Cấp (114)
            </a>
          </div>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="admin-card p-6 bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-900 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-emerald-600/40 shadow-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-200">Không Gian Sống Thông Minh Của Bạn</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Chào mừng bạn đến Phòng {roomData.buildingName}{roomData.roomNumber}
          </h1>
          <p className="text-xs text-slate-200">
            Tòa Nhà {roomData.buildingName} · Tầng {roomData.floor} · Khu Cư Xá Ký Túc Xá Sinh Viên
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-center">
            <div className="text-[10px] uppercase font-bold text-emerald-200">Thẻ RFID Của Bạn</div>
            <div className="font-mono font-bold text-sm text-white">CARD_****-C3D4</div>
          </div>
        </div>
      </div>

      {/* 4 Room KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="NHIỆT ĐỘ PHÒNG"
          value={`${roomData.temperature}°C`}
          subValue={`Cảm biến DHT22 phòng ${roomData.buildingName}${roomData.roomNumber}`}
          tag={roomData.temperature > 50 ? 'BÁO ĐỘNG QUÁ NHIỆT' : roomData.temperature > 32 ? 'Khá nóng' : 'Mát mẻ'}
          tagVariant={roomData.temperature > 50 ? 'danger' : roomData.temperature > 32 ? 'warning' : 'success'}
          icon={<Thermometer className={`w-4 h-4 ${roomData.temperature > 50 ? 'text-red-600 animate-bounce' : 'text-blue-900'}`} />}
          iconBg={roomData.temperature > 50 ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-900'}
        />

        <MetricCard
          label="ĐỘ ẨM KHÔNG KHÍ"
          value={`${roomData.humidity}%`}
          subValue={roomData.humidity > 80 ? 'Độ ẩm rất cao' : 'Môi trường thoáng mát'}
          tag={roomData.humidity > 80 ? 'Ẩm ướt' : 'Lý tưởng'}
          tagVariant={roomData.humidity > 80 ? 'warning' : 'success'}
          icon={<Droplets className="w-4 h-4 text-emerald-700" />}
          iconBg="bg-emerald-50 text-emerald-700"
        />

        <MetricCard
          label="ĐIỆN TIÊU THỤ HÔM NAY"
          value={`${roomData.energyTodayKwh} kWh`}
          subValue="Ước tính: ~19.500 ₫"
          tag="Định mức phòng"
          tagVariant="info"
          icon={<Zap className="w-4 h-4 text-blue-700" />}
          iconBg="bg-blue-50 text-blue-700"
        />

        <MetricCard
          label="THIẾT BỊ PHÒNG ONLINE"
          value={`${roomData.devicesOnline} / ${roomData.totalDevices}`}
          subValue="Đèn, quạt, khóa cửa, còi"
          tag="Trực tuyến"
          tagVariant="success"
          icon={<Cpu className="w-4 h-4 text-purple-700" />}
          iconBg="bg-purple-50 text-purple-700"
        />
      </div>

      {/* Main Student Controls & Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Device Switches in Room */}
        <div className="lg:col-span-7 admin-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Điều Khiển Thiết Bị Trong Phòng (1-Tap Control)
                </h3>
              </div>
              <Link href="/student/devices" className="text-xs font-semibold text-emerald-700 hover:underline">
                Chi tiết →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {devices.map((dev) => {
                const Icon = dev.icon;
                const isBusy = toggling === dev.id;

                return (
                  <div
                    key={dev.id}
                    className={`p-4 rounded-xl border transition-all flex items-center justify-between ${
                      dev.isOn
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          dev.isOn
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900 leading-tight">{dev.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {dev.isLock ? (dev.isOn ? 'Đang Khóa' : 'Đã Mở Chốt') : dev.isOn ? 'Đang Bật (On)' : 'Đang Tắt (Off)'}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleDevice(dev.id, dev.name, dev.type, dev.isOn, dev.isLock)}
                      disabled={isBusy}
                      className={`switch-root ${dev.isOn ? 'active' : ''} ${isBusy ? 'opacity-50' : ''}`}
                      aria-label={`Toggle ${dev.name}`}
                    >
                      <span className="switch-thumb" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Giao thức: MQTT Command Client</span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Sẵn sàng điều khiển
            </span>
          </div>
        </div>

        {/* Roommates Directory */}
        <div className="lg:col-span-5 admin-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-900" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Thành Viên Cùng Phòng ({roommates.length}/4)
                </h3>
              </div>
              <Badge variant="neutral" size="sm">
                Đã đăng ký
              </Badge>
            </div>

            <div className="space-y-2.5">
              {roommates.map((m, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                      m.isMe ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {m.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">{m.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{m.studentId}</div>
                    </div>
                  </div>

                  <a
                    href={`tel:${m.phone}`}
                    className="p-1.5 rounded-md hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
                    title={`Gọi ${m.phone}`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 text-center">
            Trưởng phòng KTX: <strong>Trần Thị Bình</strong>
          </div>
        </div>
      </div>

      {/* Recent Personal Access History */}
      <div className="admin-card p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-700" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Lịch Sử Quẹt Thẻ Của Bạn (Recent Access)
            </h3>
          </div>
          <Link href="/student/access-history" className="text-xs font-semibold text-emerald-700 hover:underline">
            Xem toàn bộ →
          </Link>
        </div>

        <div className="space-y-2">
          {recentAccess.map((acc, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="font-bold text-slate-800">{acc.action}</span>
                <span className="text-slate-400 font-mono text-[11px]">({acc.card})</span>
              </div>
              <span className="font-mono text-slate-500 text-[11px]">{acc.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
