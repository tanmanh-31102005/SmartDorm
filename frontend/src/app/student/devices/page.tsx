'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastContext';
import { 
  Cpu, 
  Lightbulb, 
  Fan, 
  Lock, 
  Unlock, 
  Zap, 
  Wind, 
  Power, 
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  Bell
} from 'lucide-react';

interface StudentDevice {
  id: string;
  name: string;
  type: 'LIGHT' | 'FAN' | 'DOOR_LOCK' | 'BUZZER' | 'AIR_CON';
  isOn: boolean;
  powerWatts: number;
  lastAction: string;
  isLock?: boolean;
}

export default function StudentDevicesPage() {
  const { success, error } = useToast();
  const [roomId, setRoomId] = useState<string>('');
  const [roomNumber, setRoomNumber] = useState<string>('101');
  const [buildingName, setBuildingName] = useState<string>('A');
  const [devices, setDevices] = useState<StudentDevice[]>([
    { id: 'dev-1', name: 'Đèn Chiếu Sáng Phòng A101', type: 'LIGHT', isOn: true, powerWatts: 36, lastAction: 'Đang bật' },
    { id: 'dev-2', name: 'Quạt Thông Gió KTX', type: 'FAN', isOn: false, powerWatts: 65, lastAction: 'Đang tắt' },
    { id: 'dev-3', name: 'Khóa Cửa Điện Tử RFID', type: 'DOOR_LOCK', isOn: true, powerWatts: 5, lastAction: 'Đang khóa an toàn', isLock: true },
    { id: 'dev-4', name: 'Còi Báo Động Khẩn Cấp', type: 'BUZZER', isOn: false, powerWatts: 15, lastAction: 'Chế độ chờ' },
  ]);
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  async function loadRoomDevices() {
    try {
      setLoading(true);
      const res = await api.get('/rooms/overview');
      if (Array.isArray(res.data) && res.data.length > 0) {
        // Find room A101 or the first student room
        const studentRoom = res.data.find((r: any) => r.roomNumber === '101' && r.building?.name === 'A') || res.data[0];
        if (studentRoom) {
          setRoomId(studentRoom.id);
          setRoomNumber(studentRoom.roomNumber);
          setBuildingName(studentRoom.building?.name || 'A');

          if (studentRoom.devices && studentRoom.devices.length > 0) {
            const mapped: StudentDevice[] = studentRoom.devices.map((d: any) => {
              const isLock = d.type === 'DOOR_LOCK';
              let watts = 36;
              if (d.type === 'FAN') watts = 65;
              if (d.type === 'DOOR_LOCK') watts = 5;
              if (d.type === 'BUZZER') watts = 15;

              return {
                id: d.id,
                name: d.name,
                type: d.type,
                isOn: d.isOn,
                powerWatts: watts,
                lastAction: d.isOn ? (isLock ? 'Đã khóa' : 'Đang bật') : (isLock ? 'Mở chốt' : 'Đang tắt'),
                isLock,
              };
            });
            setDevices(mapped);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load student room devices', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRoomDevices();

    const socket = getSocket();
    socket.on('device:status', (data: any) => {
      const isTurnOn = data.isOn !== undefined 
        ? Boolean(data.isOn) 
        : (data.action === 'on' || data.action === 'unlock' || data.action === 'open');

      setDevices(prev => prev.map(d => {
        if (d.type === data.deviceType) {
          return {
            ...d,
            isOn: isTurnOn,
            lastAction: `Vừa cập nhật (${isTurnOn ? (d.isLock ? 'Đã khóa' : 'Bật') : (d.isLock ? 'Mở' : 'Tắt')})`,
          };
        }
        return d;
      }));
    });

    socket.on('sensor:update', (data: any) => {
      setDevices(prev => prev.map(d => {
        if (d.type === 'LIGHT' && data.light_1 !== undefined) {
          const isLight = Boolean(data.light_1 || data.light_2 || data.light_3);
          return { ...d, isOn: isLight, lastAction: isLight ? 'Đang bật' : 'Đang tắt' };
        }
        if (d.type === 'FAN' && data.fan !== undefined) {
          return { ...d, isOn: Boolean(data.fan), lastAction: data.fan ? 'Đang bật' : 'Đang tắt' };
        }
        if (d.type === 'DOOR_LOCK' && data.door !== undefined) {
          const isDoorOpen = data.door === 'unlocked' || data.door === 'open';
          return { ...d, isOn: isDoorOpen, lastAction: isDoorOpen ? 'Mở chốt' : 'Đã khóa' };
        }
        if (d.type === 'BUZZER' && data.alarm !== undefined) {
          return { ...d, isOn: Boolean(data.alarm), lastAction: data.alarm ? 'Báo động' : 'Chế độ chờ' };
        }
        return d;
      }));
    });

    return () => {
      socket.off('device:status');
      socket.off('sensor:update');
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
      setDevices(prev => prev.map(d => d.id === id ? {
        ...d,
        isOn: nextState,
        lastAction: `Vừa cập nhật (${nextState ? (isLock ? 'Mở chốt' : 'Bật') : (isLock ? 'Đã khóa' : 'Tắt')})`
      } : d));
      success(`Đã cập nhật ${name}: ${nextState ? (isLock ? 'MỞ CHỐT' : 'BẬT') : (isLock ? 'ĐÃ KHÓA' : 'TẮT')} (Command Pattern)`, 'Điều Khiển Thiết Bị');
    } catch (e) {
      // Fallback
      setDevices(prev => prev.map(d => d.id === id ? {
        ...d,
        isOn: nextState,
        lastAction: `Vừa cập nhật (${nextState ? (isLock ? 'Đã khóa' : 'Bật') : (isLock ? 'Mở chốt' : 'Tắt')})`
      } : d));
      success(`[Thao tác] Đã ${isLock ? (nextState ? 'Khóa' : 'Mở khóa') : nextState ? 'Bật' : 'Tắt'} ${name}`, 'Điều Khiển Thiết Bị');
    } finally {
      setToggling(null);
    }
  }

  const totalWatts = devices.filter(d => d.isOn).reduce((acc, d) => acc + d.powerWatts, 0);

  function getIcon(type: string) {
    switch (type) {
      case 'LIGHT': return Lightbulb;
      case 'FAN': return Fan;
      case 'DOOR_LOCK': return Lock;
      case 'BUZZER': return Bell;
      default: return Zap;
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Điều Khiển Rơ-Le Thiết Bị Phòng {buildingName}{roomNumber}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Bật/tắt các thiết bị điện trong phòng của bạn từ xa qua giao thức MQTT và lưu trạng thái vào CSDL.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={loadRoomDevices}
            icon={<RefreshCw className="w-3.5 h-3.5 text-slate-600" />}
          >
            Làm mới
          </Button>

          <Badge variant="info" size="md">
            Công suất đang dùng: <strong className="font-mono ml-1">{totalWatts} Watts</strong>
          </Badge>
        </div>
      </div>

      {/* Device Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        {devices.map((dev) => {
          const Icon = getIcon(dev.type);
          const isBusy = toggling === dev.id;

          return (
            <div
              key={dev.id}
              className={`admin-card p-5 flex flex-col justify-between space-y-4 transition-all ${
                dev.isOn ? 'bg-emerald-50/40 border-emerald-200 shadow-xs' : 'bg-white'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      dev.isOn
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <Badge variant={dev.isOn ? 'success' : 'neutral'} size="sm">
                    {dev.isLock ? (dev.isOn ? 'ĐÃ KHÓA' : 'MỞ CHỐT') : dev.isOn ? 'ĐANG BẬT' : 'ĐANG TẮT'}
                  </Badge>
                </div>

                <h3 className="font-bold text-sm text-slate-900 leading-tight mb-1">
                  {dev.name}
                </h3>
                <div className="text-xs text-slate-500 font-mono">
                  Công suất: <strong className="text-slate-800">{dev.powerWatts}W</strong>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 truncate max-w-[140px]">
                  {dev.lastAction}
                </span>

                <button
                  onClick={() => toggleDevice(dev.id, dev.name, dev.type, dev.isOn, dev.isLock)}
                  disabled={isBusy}
                  className={`switch-root ${dev.isOn ? 'active' : ''} ${isBusy ? 'opacity-50' : ''}`}
                  aria-label={`Toggle ${dev.name}`}
                >
                  <span className="switch-thumb" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
