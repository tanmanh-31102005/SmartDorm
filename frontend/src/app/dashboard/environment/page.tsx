'use client';
import { useEffect, useState, useCallback } from 'react';
import { INITIAL_ROOMS, RoomData } from '@/lib/smartdorm-data';
import api from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { MetricCard } from '@/components/ui/MetricCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { 
  Thermometer, 
  Droplets, 
  Flame, 
  Wind, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Filter, 
  Radio,
  RefreshCw
} from 'lucide-react';

export default function EnvironmentPage() {
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [search, setSearch] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState('ALL');
  const [rooms, setRooms] = useState<RoomData[]>(INITIAL_ROOMS);
  const [envTrendData, setEnvTrendData] = useState<any[]>([
    { time: '00:00', temp: 26.2, humid: 68, aqi: 35 },
    { time: '04:00', temp: 25.8, humid: 72, aqi: 32 },
    { time: '08:00', temp: 27.4, humid: 65, aqi: 45 },
    { time: '12:00', temp: 29.5, humid: 58, aqi: 52 },
    { time: '16:00', temp: 28.8, humid: 60, aqi: 48 },
    { time: '20:00', temp: 27.6, humid: 64, aqi: 42 },
  ]);

  const loadEnvironmentData = useCallback(async () => {
    try {
      const [roomsRes, sensorsRes] = await Promise.allSettled([
        api.get('/rooms/overview'),
        api.get('/sensors/recent?limit=20'),
      ]);

      if (roomsRes.status === 'fulfilled' && Array.isArray(roomsRes.value.data) && roomsRes.value.data.length > 0) {
        const mapped = roomsRes.value.data.map((r: any) => {
          const lastSensor = r.sensorData?.[0] || {};
          const isCritical = (lastSensor.temperature > 50) || lastSensor.tempAlert || (r.emergencies && r.emergencies.length > 0);
          const isWarning = lastSensor.gasAlert || (lastSensor.gasLevel > 40);

          return {
            id: r.id,
            roomNumber: r.roomNumber,
            floor: r.floor,
            capacity: r.capacity || 4,
            occupied: r.users?.length || 0,
            buildingId: r.buildingId,
            buildingName: r.building?.name || 'A',
            temperature: lastSensor.temperature ?? 27.2,
            humidity: lastSensor.humidity ?? 64,
            gasLevel: lastSensor.gasLevel ?? 18,
            gasAlert: lastSensor.gasAlert || false,
            tempAlert: lastSensor.tempAlert || false,
            status: isCritical ? 'critical' : isWarning ? 'warning' : 'normal',
            devicesCount: r.devices?.length || 4,
            residents: r.users || [],
          } as RoomData;
        });
        setRooms(mapped);
      }

      if (sensorsRes.status === 'fulfilled' && Array.isArray(sensorsRes.value.data) && sensorsRes.value.data.length > 0) {
        const dbSensors = sensorsRes.value.data;
        const chartPoints = dbSensors.map((s: any) => ({
          time: new Date(s.recordedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          temp: s.temperature ?? 27.5,
          humid: s.humidity ?? 65,
          aqi: Math.min(100, Math.round((s.gasLevel ?? 20) * 1.2)),
        }));
        setEnvTrendData(chartPoints);
      }
    } catch (e) {
      console.error('Environment load fallback', e);
    }
  }, []);

  useEffect(() => {
    loadEnvironmentData();

    const socket = getSocket();
    socket.on('sensor:update', (data: any) => {
      const rmNum = data.room || data.roomId || '101';
      setRooms(prev => prev.map(r => {
        if (r.roomNumber === rmNum || r.id === rmNum) {
          const temp = data.temperature ?? r.temperature;
          const humid = data.humidity ?? r.humidity;
          const gas = data.gas_level ?? r.gasLevel;
          const isCritical = temp > 50 || data.temp_alert;
          const isWarning = gas > 40 || data.gas_alert;

          return {
            ...r,
            temperature: temp,
            humidity: humid,
            gasLevel: gas,
            gasAlert: data.gas_alert || false,
            tempAlert: data.temp_alert || false,
            status: isCritical ? 'critical' : isWarning ? 'warning' : 'normal',
          };
        }
        return r;
      }));

      setEnvTrendData(prev => [
        ...prev.slice(-15),
        {
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          temp: data.temperature ?? 27.5,
          humid: data.humidity ?? 65,
          aqi: Math.min(100, Math.round((data.gas_level ?? 20) * 1.2)),
        }
      ]);
    });

    return () => {
      socket.off('sensor:update');
    };
  }, [loadEnvironmentData]);

  const avgTemp = rooms.length > 0
    ? (rooms.reduce((acc, r) => acc + (r.temperature || 27), 0) / rooms.length).toFixed(1)
    : '27.4';

  const avgHumid = rooms.length > 0
    ? Math.round(rooms.reduce((acc, r) => acc + (r.humidity || 64), 0) / rooms.length)
    : 64;

  const gasAlertCount = rooms.filter(r => r.gasLevel > 40 || r.gasAlert || r.status === 'warning').length;
  const criticalCount = rooms.filter(r => r.status === 'critical' || r.temperature > 50).length;

  const filteredRooms = rooms.filter(r => {
    const matchSearch = `${r.buildingName}${r.roomNumber}`.toLowerCase().includes(search.toLowerCase());
    const matchBuilding = selectedBuilding === 'ALL' || r.buildingName === selectedBuilding;
    return matchSearch && matchBuilding;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Giám Sát Vi Khí Hậu & Chất Lượng Môi Trường</h1>
            <Badge variant="success" size="sm" dot pulse>
              Live Telemetry
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Thu thập dữ liệu cảm biến DHT22, khí gas MQ-2 và phân tích chất lượng không khí toàn KTX.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadEnvironmentData}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Làm mới
          </Button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="NHIỆT ĐỘ TRUNG BÌNH"
          value={`${avgTemp}°C`}
          subValue={Number(avgTemp) > 35 ? 'CẢNH BÁO: Nhiệt độ KTX tăng cao' : 'Ngưỡng an toàn: 20°C - 32°C'}
          tag={Number(avgTemp) > 50 ? 'BÁO ĐỘNG QUÁ NHIỆT' : Number(avgTemp) > 32 ? 'Nóng' : 'Ổn định'}
          tagVariant={Number(avgTemp) > 50 ? 'danger' : Number(avgTemp) > 32 ? 'warning' : 'success'}
          icon={<Thermometer className={`w-4 h-4 ${Number(avgTemp) > 50 ? 'text-red-600 animate-bounce' : 'text-blue-900'}`} />}
          iconBg={Number(avgTemp) > 50 ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-900'}
        />

        <MetricCard
          label="ĐỘ ẨM KHÔNG KHÍ"
          value={`${avgHumid}%`}
          subValue="Ngưỡng khuyến nghị: 55% - 75%"
          tag="Lý tưởng"
          tagVariant="success"
          icon={<Droplets className="w-4 h-4 text-emerald-700" />}
          iconBg="bg-emerald-50 text-emerald-700"
        />

        <MetricCard
          label="SỰ CỐ QUÁ NHIỆT / CHÁY"
          value={`${criticalCount} Phòng`}
          subValue={criticalCount > 0 ? 'Phát hiện nhiệt độ phòng > 50°C' : 'Tất cả phòng trong ngưỡng an toàn'}
          tag={criticalCount > 0 ? 'CẦN XỬ LÝ GẤP' : 'An Toàn'}
          tagVariant={criticalCount > 0 ? 'danger' : 'success'}
          icon={<Flame className="w-4 h-4 text-red-600" />}
          iconBg={criticalCount > 0 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-red-50 text-red-600'}
        />

        <MetricCard
          label="CẢNH BÁO NỒNG ĐỘ GAS"
          value={`${gasAlertCount} Phòng`}
          subValue={gasAlertCount > 0 ? 'Phát hiện rò rỉ khí gas vượt ngưỡng' : 'Không có nguy cơ rò rỉ gas'}
          tag={gasAlertCount > 0 ? 'Nguy hiểm' : 'Bình thường'}
          tagVariant={gasAlertCount > 0 ? 'warning' : 'success'}
          icon={<AlertTriangle className="w-4 h-4 text-amber-600" />}
          iconBg="bg-amber-50 text-amber-600"
        />
      </div>

      {/* Environmental Trend Chart */}
      <div className="admin-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Biểu Đồ Xu Hướng Vi Khí Hậu & AQI Thời Gian Thực</h3>
            <p className="text-xs text-slate-500 mt-0.5">Dữ liệu tổng hợp từ các trạm cảm biến DHT22 & InfluxDB</p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {[
              { id: '1h', label: '1 Giờ' },
              { id: '24h', label: '24 Giờ' },
              { id: '7d', label: '7 Ngày' },
              { id: '30d', label: '30 Ngày' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTimeRange(t.id as any)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  timeRange === t.id ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={envTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="tempG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="humidG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              />
              <Area type="monotone" dataKey="temp" name="Nhiệt độ (°C)" stroke="#1e3a8a" strokeWidth={2} fill="url(#tempG)" />
              <Area type="monotone" dataKey="humid" name="Độ ẩm (%)" stroke="#059669" strokeWidth={2} fill="url(#humidG)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Room Environmental Matrix Table */}
      <div className="admin-card overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-900" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Bảng Đo Vi Khí Hậu Từng Phòng
            </h3>
          </div>
          <span className="text-xs text-slate-400">Đồng bộ tự động qua WebSocket</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Số Phòng</th>
                <th className="py-3 px-4">Tòa Nhà & Tầng</th>
                <th className="py-3 px-4">Nhiệt Độ (DHT22)</th>
                <th className="py-3 px-4">Độ Ẩm (DHT22)</th>
                <th className="py-3 px-4">Nồng Độ Khí Gas (MQ-2)</th>
                <th className="py-3 px-4">Đánh Giá Môi Trường</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRooms.map((room) => {
                const isOverheat = room.temperature > 50 || room.tempAlert;
                const isGasAlarm = room.gasLevel > 40 || room.gasAlert;

                return (
                  <tr
                    key={room.id}
                    className={`transition-colors ${
                      isOverheat ? 'bg-red-50/70 hover:bg-red-100/70 font-semibold' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="py-3.5 px-4 font-bold text-blue-900">
                      Phòng {room.buildingName}{room.roomNumber}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      Tòa Nhà {room.buildingName} · Tầng {room.floor}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold">
                      <span className={isOverheat ? 'text-red-600 font-extrabold text-sm animate-pulse' : 'text-slate-900'}>
                        {room.temperature}°C
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-emerald-700">
                      {room.humidity}%
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold">
                      <span className={isGasAlarm ? 'text-amber-600 font-bold' : 'text-slate-800'}>
                        {room.gasLevel}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {isOverheat ? (
                        <Badge variant="danger" size="sm">🔥 CẢNH BÁO QUÁ NHIỆT / CHÁY</Badge>
                      ) : isGasAlarm ? (
                        <Badge variant="warning" size="sm">⚠️ RÒ RỈ GAS</Badge>
                      ) : (
                        <Badge variant="success" size="sm">Bình thường</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
