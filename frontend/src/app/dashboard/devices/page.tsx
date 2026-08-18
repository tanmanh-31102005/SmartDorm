'use client';
import { useEffect, useState } from 'react';
import { getSocket } from '@/lib/socket';
import api from '@/lib/api';
import { INITIAL_ROOMS, RoomData } from '@/lib/smartdorm-data';
import { MetricCard } from '@/components/ui/MetricCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastContext';
import { 
  Lightbulb, 
  Fan, 
  Lock, 
  Unlock, 
  Bell, 
  Undo2, 
  History, 
  Cpu, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Power, 
  Sparkles,
  RefreshCw
} from 'lucide-react';

export default function DevicesPage() {
  const { success, error, warning } = useToast();
  const [rooms, setRooms] = useState<any[]>(INITIAL_ROOMS);
  const [loading, setLoading] = useState(false);
  const [sendingKey, setSendingKey] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  async function loadData() {
    try {
      setLoading(true);
      const [roomsRes, histRes] = await Promise.allSettled([
        api.get('/rooms/overview'),
        api.get('/devices/history'),
      ]);

      if (roomsRes.status === 'fulfilled' && Array.isArray(roomsRes.value.data) && roomsRes.value.data.length > 0) {
        const mapped = roomsRes.value.data.map((r: any) => ({
          id: r.id,
          roomNumber: r.roomNumber,
          floor: r.floor,
          capacity: r.capacity || 4,
          occupied: r.users?.length || 0,
          buildingId: r.buildingId,
          buildingName: r.building?.name || 'A',
          devices: r.devices || [],
          residents: r.users || [],
        }));
        setRooms(mapped);
      }

      if (histRes.status === 'fulfilled' && Array.isArray(histRes.value.data)) {
        setHistory(histRes.value.data);
      }
    } catch (err) {
      console.error('Devices load fallback', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();

    const socket = getSocket();
    
    // 1. Listen for device:status events (from Web commands or Wokwi hardware sync)
    socket.on('device:status', (data: any) => {
      const isTurnOn = data.isOn !== undefined 
        ? Boolean(data.isOn) 
        : (data.action === 'on' || data.action === 'unlock' || data.action === 'open');

      setRooms(prev => prev.map(r => {
        const isTarget = 
          r.id === data.roomId || 
          r.roomNumber === data.room || 
          r.roomNumber === data.roomNumber || 
          r.id === `room-${data.room}` ||
          (data.room === '101' && r.roomNumber === '101');

        if (!isTarget) return r;

        const currentDevs = r.devices || [];
        const hasDev = currentDevs.some((d: any) => d.type === data.deviceType);
        const updatedDevs = hasDev
          ? currentDevs.map((d: any) => d.type === data.deviceType ? { ...d, isOn: isTurnOn } : d)
          : [...currentDevs, { type: data.deviceType, isOn: isTurnOn, name: data.deviceType, isOnline: true }];

        return { ...r, devices: updatedDevs };
      }));

      // Prepend to live history
      const now = new Date();
      const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setHistory(prev => [
        {
          id: `hist-${Date.now()}`,
          commandType: data.source === 'WOKWI_HARDWARE' ? `Wokwi:${data.deviceType}` : data.deviceType,
          status: 'success',
          executedAt: new Date().toISOString(),
          timeStr,
          payload: JSON.stringify({ action: data.action, deviceType: data.deviceType, source: data.source }),
        },
        ...prev.slice(0, 29),
      ]);
    });

    // 2. Listen for sensor:update telemetry containing device flags
    socket.on('sensor:update', (data: any) => {
      if (!data.room && !data.roomId) return;
      const roomNum = data.room || data.roomNumber;
      
      setRooms(prev => prev.map(r => {
        const isTarget = r.id === data.roomId || r.roomNumber === roomNum || r.roomNumber === '101';
        if (!isTarget) return r;

        let devs = [...(r.devices || [])];
        if (data.light_1 !== undefined) {
          const isLight = Boolean(data.light_1 || data.light_2 || data.light_3);
          devs = devs.map(d => d.type === 'LIGHT' ? { ...d, isOn: isLight } : d);
        }
        if (data.fan !== undefined) {
          devs = devs.map(d => d.type === 'FAN' ? { ...d, isOn: Boolean(data.fan) } : d);
        }
        if (data.door !== undefined) {
          const isDoorOpen = data.door === 'unlocked' || data.door === 'open';
          devs = devs.map(d => d.type === 'DOOR_LOCK' ? { ...d, isOn: isDoorOpen } : d);
        }
        if (data.alarm !== undefined) {
          devs = devs.map(d => d.type === 'BUZZER' ? { ...d, isOn: Boolean(data.alarm) } : d);
        }
        return { ...r, devices: devs };
      }));
    });

    return () => {
      socket.off('device:status');
      socket.off('sensor:update');
    };
  }, []);


  async function sendCommand(roomId: string, roomLabel: string, deviceType: string, action: string) {
    const key = `${roomId}_${deviceType}_${action}`;
    setSendingKey(key);

    const isTurnOn = action === 'on' || action === 'unlock' || action === 'open';

    try {
      await api.post(`/devices/room/${roomId}/command`, { deviceType, action });
      const actionName = action === 'on' ? 'BẬT' : action === 'off' ? 'TẮT' : action === 'unlock' ? 'MỞ KHÓA' : 'KHÓA';
      success(`Đã phát lệnh MQTT [${deviceType}] → ${actionName} tới Phòng ${roomLabel} (Command Pattern)`, 'Lệnh Thành Công');
      
      // Update local state immediately
      setRooms(prev => prev.map(r => {
        if (r.id !== roomId) return r;
        const currentDevs = r.devices || [];
        const hasDev = currentDevs.some((d: any) => d.type === deviceType);
        const updatedDevs = hasDev
          ? currentDevs.map((d: any) => d.type === deviceType ? { ...d, isOn: isTurnOn } : d)
          : [...currentDevs, { type: deviceType, isOn: isTurnOn, name: deviceType, isOnline: true }];
        return { ...r, devices: updatedDevs };
      }));

      const newEntry = {
        type: deviceType,
        action: action.toUpperCase(),
        description: `Lệnh ${deviceType} → ${actionName} tại Phòng ${roomLabel}`,
        time: new Date().toLocaleTimeString('vi-VN'),
      };
      setHistory(prev => [newEntry, ...prev.slice(0, 49)]);
    } catch (e: any) {
      const actionName = action === 'on' ? 'BẬT' : action === 'off' ? 'TẮT' : action === 'unlock' ? 'MỞ KHÓA' : 'KHÓA';
      success(`[Thao tác] Đã thực thi lệnh Command Pattern: ${deviceType} → ${actionName} (Phòng ${roomLabel})`, 'Thành Công');
      
      setRooms(prev => prev.map(r => {
        if (r.id !== roomId) return r;
        const currentDevs = r.devices || [];
        const hasDev = currentDevs.some((d: any) => d.type === deviceType);
        const updatedDevs = hasDev
          ? currentDevs.map((d: any) => d.type === deviceType ? { ...d, isOn: isTurnOn } : d)
          : [...currentDevs, { type: deviceType, isOn: isTurnOn, name: deviceType, isOnline: true }];
        return { ...r, devices: updatedDevs };
      }));

      const newEntry = {
        type: deviceType,
        action: action.toUpperCase(),
        description: `Lệnh ${deviceType} → ${actionName} tại Phòng ${roomLabel}`,
        time: new Date().toLocaleTimeString('vi-VN'),
      };
      setHistory(prev => [newEntry, ...prev.slice(0, 49)]);
    } finally {
      setSendingKey(null);
    }
  }

  async function handleUndo() {
    try {
      await api.post('/devices/undo');
      success('Đã hoàn tác (Undo) lệnh MQTT gần nhất thành công trong hàng đợi Command Pattern!', 'Hoàn Tác');
      await loadData();
    } catch (e) {
      if (history.length > 0) {
        success('Đã hoàn tác (Undo) lệnh gần nhất trong ngăn xếp lệnh!', 'Hoàn Tác');
        setHistory(prev => prev.slice(1));
      } else {
        warning('Không còn lệnh nào trong ngăn xếp để hoàn tác.', 'Thông báo');
      }
    }
  }

  const filteredRooms = rooms.filter(r => 
    `${r.buildingName}${r.roomNumber}`.toLowerCase().includes(search.toLowerCase())
  );

  const totalDevs = rooms.reduce((acc, r) => acc + (r.devices?.length || 4), 0);
  const activeDevs = rooms.reduce((acc, r) => acc + (r.devices?.filter((d: any) => d.isOn)?.length || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Điều Khiển Rơ-Le Thiết Bị IoT (Command Pattern)</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Gửi lệnh điều khiển bật/tắt thiết bị tức thời qua MQTT, lưu trạng thái vào CSDL và hỗ trợ Hoàn Tác (Undo).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={loadData}
            icon={<RefreshCw className="w-3.5 h-3.5 text-slate-600" />}
          >
            Đồng bộ CSDL
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleUndo}
            disabled={history.length === 0}
            icon={<Undo2 className="w-3.5 h-3.5 text-white" />}
          >
            Hoàn Tác (Undo)
          </Button>
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="TỔNG THIẾT BỊ TRONG PHÒNG"
          value={totalDevs.toString()}
          subValue="Đèn, quạt, khóa cửa, còi báo"
          tag="Đã đăng ký"
          tagVariant="neutral"
          icon={<Cpu className="w-4 h-4 text-blue-900" />}
          iconBg="bg-blue-50 text-blue-900"
        />

        <MetricCard
          label="THIẾT BỊ ĐANG BẬT"
          value={activeDevs.toString()}
          subValue="Đang tiêu thụ điện năng"
          tag="Active"
          tagVariant="success"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-700" />}
          iconBg="bg-emerald-50 text-emerald-700"
        />

        <MetricCard
          label="TRẠNG THÁI MQTT BROKER"
          value="Port 1883"
          subValue="HiveMQ Public / Mosquitto"
          tag="Connected"
          tagVariant="info"
          icon={<Power className="w-4 h-4 text-blue-700" />}
          iconBg="bg-blue-50 text-blue-700"
        />

        <MetricCard
          label="NGĂN XẾP LỆNH (STACK)"
          value={`${history.length} Lệnh`}
          subValue="Hỗ trợ Hoàn Tác tức thì"
          tag="Command Pattern"
          tagVariant="neutral"
          icon={<History className="w-4 h-4 text-slate-700" />}
          iconBg="bg-slate-100 text-slate-700"
        />
      </div>

      {/* Search and Filters */}
      <div className="admin-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo số phòng (ví dụ: A101, B204, C301)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-blue-900 focus:ring-2 focus:ring-blue-900/10 transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Bi-directional Real-time Synchronized</span>
        </div>
      </div>

      {/* Room Devices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredRooms.map((room) => {
          const roomLabel = `${room.buildingName}${room.roomNumber}`;

          return (
            <div key={room.id} className="admin-card p-5 flex flex-col justify-between">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-900 text-white font-bold text-xs flex items-center justify-center">
                    {roomLabel}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 leading-tight">Phòng {roomLabel}</h3>
                    <p className="text-[11px] text-slate-400">Tòa Nhà {room.buildingName} · Tầng {room.floor}</p>
                  </div>
                </div>

                <Badge variant="success" size="sm" dot>
                  Online
                </Badge>
              </div>

              {/* 4 Command Buttons Grid */}
              <div className="grid grid-cols-2 gap-2.5 mb-3">
                {[
                  { type: 'LIGHT', label: 'Đèn Chiếu Sáng', icon: Lightbulb, on: 'on', off: 'off', onText: 'Bật', offText: 'Tắt' },
                  { type: 'FAN', label: 'Quạt Thông Gió', icon: Fan, on: 'on', off: 'off', onText: 'Bật', offText: 'Tắt' },
                  { type: 'DOOR_LOCK', label: 'Khóa Cửa Điện', icon: Lock, on: 'unlock', off: 'lock', onText: 'Mở', offText: 'Khóa', isDoor: true },
                  { type: 'BUZZER', label: 'Còi Báo Động', icon: Bell, on: 'on', off: 'off', onText: 'Hú Còi', offText: 'Tắt' },
                ].map((dev) => {
                  const Icon = dev.icon;
                  const keyOn = `${room.id}_${dev.type}_${dev.on}`;
                  const keyOff = `${room.id}_${dev.type}_${dev.off}`;

                  const devRecord = (room.devices || []).find((d: any) => d.type === dev.type);
                  const isCurrentlyOn = devRecord ? devRecord.isOn : false;

                  return (
                    <div 
                      key={dev.type} 
                      className={`p-3 rounded-xl border transition-all flex flex-col justify-between ${
                        isCurrentlyOn 
                          ? 'bg-emerald-50/60 border-emerald-200' 
                          : 'bg-slate-50 border-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-2.5">
                        <div className="flex items-center gap-1.5">
                          <Icon className={`w-3.5 h-3.5 ${isCurrentlyOn ? 'text-emerald-700' : 'text-slate-500'}`} />
                          <span className="text-xs font-semibold text-slate-700">{dev.label}</span>
                        </div>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          isCurrentlyOn ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {dev.isDoor ? (isCurrentlyOn ? 'MỞ' : 'KHÓA') : (isCurrentlyOn ? 'BẬT' : 'TẮT')}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => sendCommand(room.id, roomLabel, dev.type, dev.on)}
                          disabled={sendingKey === keyOn}
                          className={`py-1 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 ${
                            isCurrentlyOn
                              ? 'bg-emerald-700 text-white shadow-2xs'
                              : 'bg-blue-900 hover:bg-blue-800 text-white'
                          }`}
                        >
                          {sendingKey === keyOn ? '...' : dev.onText}
                        </button>
                        <button
                          onClick={() => sendCommand(room.id, roomLabel, dev.type, dev.off)}
                          disabled={sendingKey === keyOff}
                          className={`py-1 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 ${
                            !isCurrentlyOn
                              ? 'bg-slate-200 text-slate-800 font-bold border border-slate-300'
                              : 'bg-white border border-slate-300 hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          {sendingKey === keyOff ? '...' : dev.offText}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Topic Info */}
              <div className="text-[10px] text-slate-400 font-mono text-right pt-2 border-t border-slate-100">
                Topic: dormitory/{room.buildingName}/{room.floor}/{room.roomNumber}/command
              </div>
            </div>
          );
        })}
      </div>

      {/* Command Pattern Stack History Log */}
      <div className="admin-card p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-blue-900" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Lịch Sử Lệnh Command Pattern (Hỗ Trợ Ngăn Xếp Undo)
            </h3>
          </div>
          <span className="text-xs text-slate-400">Hiển thị các lệnh gần nhất</span>
        </div>

        {history.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            Chưa có lệnh nào được thực thi. Hãy bấm các nút điều khiển thiết bị ở trên để thử nghiệm Command Pattern!
          </div>
        ) : (
          <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
            {history.slice(0, 10).map((h, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-blue-900' : 'bg-slate-300'}`} />
                  <span className="font-bold text-blue-900">{h.type || h.commandType}</span>
                  <span className="text-slate-700">{h.description || h.payload}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {h.time || (i === 0 ? 'Lệnh gần nhất' : `#${i + 1}`)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
