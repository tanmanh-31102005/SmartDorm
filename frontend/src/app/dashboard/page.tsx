'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSocket } from '@/lib/socket';
import api from '@/lib/api';
import WokwiPanel from '@/components/WokwiPanel';
import { MetricCard } from '@/components/ui/MetricCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CardSkeleton } from '@/components/ui/Skeleton';
import {
  CAMPUS_KPI,
  BUILDINGS_DATA,
  INITIAL_ROOMS,
  INITIAL_ALERTS,
  ENERGY_TREND_DATA,
  RoomData,
  IncidentAlert,
  BuildingData
} from '@/lib/smartdorm-data';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { 
  Building2, 
  DoorClosed, 
  Users, 
  Cpu, 
  Zap, 
  Thermometer, 
  Droplets, 
  Flame, 
  Radio, 
  ShieldCheck, 
  ShieldAlert, 
  Activity, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowUpRight, 
  Sparkles,
  Server,
  Lock,
  Wind,
  Layers,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  RefreshCw
} from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [kpi, setKpi] = useState(CAMPUS_KPI);
  const [buildings, setBuildings] = useState<BuildingData[]>(BUILDINGS_DATA);
  const [rooms, setRooms] = useState<RoomData[]>(INITIAL_ROOMS);
  const [alerts, setAlerts] = useState<IncidentAlert[]>(INITIAL_ALERTS);
  const [realtimeLog, setRealtimeLog] = useState<any[]>([]);
  const [tempChart, setTempChart] = useState<any[]>([]);
  const [energyPeriod, setEnergyPeriod] = useState<'24h' | '7d' | '30d'>('24h');
  const [selectedBuildingFilter, setSelectedBuildingFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, roomsRes, emergencyRes, sensorsRes] = await Promise.allSettled([
        api.get('/analytics/dashboard'),
        api.get('/rooms/overview'),
        api.get('/emergency?resolved=false'),
        api.get('/sensors/recent?limit=20'),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value.data) {
        const d = statsRes.value.data;
        setKpi(prev => ({
          ...prev,
          totalRooms: d.totalRooms || prev.totalRooms,
          totalStudents: d.activeStudents || prev.totalStudents,
          activeAlertsCount: d.activeEmergencies !== undefined ? d.activeEmergencies : prev.activeAlertsCount,
        }));
      }

      if (roomsRes.status === 'fulfilled' && Array.isArray(roomsRes.value.data) && roomsRes.value.data.length > 0) {
        // Map backend rooms format to frontend UI format
        const mapped = roomsRes.value.data.map((r: any) => {
          const lastSensor = r.sensorData?.[0] || {};
          const hasEmergency = r.emergencies && r.emergencies.length > 0;
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
            status: hasEmergency ? 'critical' : (lastSensor.gasAlert || lastSensor.tempAlert ? 'warning' : 'normal'),
            devicesCount: r.devices?.length || 4,
            residents: r.users || [],
          } as RoomData;
        });
        setRooms(mapped);
      }

      if (sensorsRes.status === 'fulfilled' && Array.isArray(sensorsRes.value.data) && sensorsRes.value.data.length > 0) {
        const dbSensors = sensorsRes.value.data;
        const chartPoints = dbSensors.map((s: any) => ({
          time: new Date(s.recordedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          temp: Math.max(15, Math.min(50, Number(s.temperature) || 27.5)),
          humid: Math.max(20, Math.min(100, Number(s.humidity) || 65)),
        }));
        setTempChart(chartPoints);

        const logs = [...dbSensors].reverse().slice(0, 8).map((s: any) => ({
          time: new Date(s.recordedAt).toLocaleTimeString('vi-VN'),
          room: s.room?.roomNumber || '101',
          temp: s.temperature ?? 27.5,
          humid: s.humidity ?? 65,
          gas: s.gasLevel ?? 16,
          alert: s.gasAlert || s.tempAlert || false,
        }));
        setRealtimeLog(logs);
      }

      if (emergencyRes.status === 'fulfilled' && Array.isArray(emergencyRes.value.data) && emergencyRes.value.data.length > 0) {
        const mappedAlerts: IncidentAlert[] = emergencyRes.value.data.map((e: any) => ({
          id: e.id,
          type: e.type,
          level: e.level || 'CRITICAL',
          title: e.type === 'FIRE' ? 'Phát hiện khói & nguy cơ cháy' : e.type === 'GAS_LEAK' ? 'Rò rỉ khí gas' : 'Cảnh báo an ninh',
          description: e.description || `Sự cố tại phòng ${e.room?.building?.name || ''}${e.room?.roomNumber || ''}`,
          roomId: e.roomId,
          roomNumber: e.room?.roomNumber || '',
          buildingName: e.room?.building?.name || 'A',
          sensorValue: e.sensorValue,
          timestamp: 'Vừa cập nhật',
          isResolved: e.isResolved || false,
          actionsTaken: ['Kích hoạt còi báo động', 'Mở chốt khóa thoát hiểm'],
        }));
        setAlerts(mappedAlerts);
      }

      setLastSync(new Date().toLocaleTimeString('vi-VN'));
    } catch (err) {
      console.error('Data fetch fallback to mock datasets', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const socket = getSocket();

    socket.on('sensor:update', (data: any) => {
      const nowStr = new Date().toLocaleTimeString('vi-VN');
      setLastSync(nowStr);

      setRealtimeLog(prev => [
        {
          time: nowStr,
          room: data.room || data.roomId || '101',
          temp: data.temperature ?? 27.5,
          humid: data.humidity ?? 65,
          gas: data.gas_level ?? 18,
          alert: data.gas_alert || data.temp_alert || false,
        },
        ...prev
      ].slice(0, 8));

      setTempChart(prev => [
        ...prev.slice(-19),
        {
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          temp: Math.max(15, Math.min(50, Number(data.temperature) || 27.5)),
          humid: Math.max(20, Math.min(100, Number(data.humidity) || 65)),
        }
      ]);

      // Realtime update matching room card
      const rmNum = data.room || data.roomId || '101';
      setRooms(prev => prev.map(r => {
        if (r.roomNumber === rmNum || r.id === rmNum || r.id === data.roomId) {
          const temp = data.temperature ?? r.temperature;
          const humid = data.humidity ?? r.humidity;
          const gas = data.gas_level ?? r.gasLevel;
          const hasAlert = Boolean(data.gas_alert || data.temp_alert || temp > 50 || gas > 70);
          return {
            ...r,
            temperature: temp,
            humidity: humid,
            gasLevel: gas,
            gasAlert: data.gas_alert || false,
            tempAlert: data.temp_alert || false,
            status: hasAlert ? 'critical' : (gas > 40 ? 'warning' : 'normal'),
          };
        }
        return r;
      }));
    });


    socket.on('emergency:alert', (alert: any) => {
      fetchData();
    });

    const interval = setInterval(fetchData, 30000);
    return () => {
      socket.off('sensor:update');
      socket.off('emergency:alert');
      clearInterval(interval);
    };
  }, [fetchData]);

  const activeAlerts = alerts.filter(a => !a.isResolved);

  return (
    <div className="space-y-6">
      
      {/* 1. Page Header & Situational Status Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">SmartDorm Operations Dashboard</h1>
            <Badge variant="success" dot pulse>
              Live Telemetry
            </Badge>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Giám sát vi khí hậu KTX, điều khiển rơ-le thiết bị IoT, kiểm soát RFID và ứng phó khẩn cấp thời gian thực.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-600 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span suppressHydrationWarning>Đồng bộ: <strong className="font-mono text-slate-800">{lastSync || 'Vừa xong'}</strong></span>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={fetchData}
            icon={<RefreshCw className="w-3.5 h-3.5 text-slate-500" />}
          >
            Làm mới
          </Button>

          <Link href="/dashboard/emergency">
            <Button
              variant="danger"
              size="sm"
              icon={<ShieldAlert className="w-3.5 h-3.5" />}
            >
              Emergency Control
            </Button>
          </Link>
        </div>
      </div>

      {/* 1.5. AI Intelligence Live Insights Widget Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 rounded-2xl p-4 text-white border border-blue-900/60 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  SmartDorm AI Insights & Telemetry Intelligence
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  Active MLOps
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Đỉnh phụ tải dự kiến <strong>98.4 kW (19:30)</strong> · Phát hiện <strong>2 thiết bị quá tải</strong> · Đề xuất Pre-cooling cắt đỉnh tải 18.5%.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
            <Link href="/dashboard/intelligence/models">
              <button className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer">
                <Server className="w-3.5 h-3.5 text-blue-300" />
                Benchmark Models
              </button>
            </Link>
            <Link href="/dashboard/intelligence">
              <button className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer">
                Trung Tâm AI
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Four Key Enterprise KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            <MetricCard
              label="TỔNG SỐ PHÒNG KTX"
              value={kpi.totalRooms}
              change={{ value: kpi.totalRoomsChange, trend: 'up', label: 'vs tháng trước' }}
              subValue="221 phòng có sinh viên (90%)"
              tag="248 Phòng Tổng"
              tagVariant="neutral"
              icon={<DoorClosed className="w-4 h-4 text-blue-900" />}
              iconBg="bg-blue-50 text-blue-900"
              onClick={() => router.push('/dashboard/rooms')}
            />

            <MetricCard
              label="THIẾT BỊ IOT TRỰC TUYẾN"
              value={kpi.onlineDevicesCount}
              subValue={`${kpi.offlineDevicesCount} offline · ${kpi.warningDevicesCount} cảnh báo`}
              change={{ value: kpi.onlineDevicesPercent, trend: 'up', label: 'tỷ lệ hoạt động' }}
              tag="1,186 Tổng Thiết Bị"
              tagVariant="success"
              icon={<Cpu className="w-4 h-4 text-emerald-700" />}
              iconBg="bg-emerald-50 text-emerald-700"
              onClick={() => router.push('/dashboard/devices')}
            />

            <MetricCard
              label="TIÊU THỤ ĐIỆN NĂNG (KWH)"
              value={`${kpi.energyConsumptionKwh.toLocaleString('en-US')} kWh`}
              change={{ value: kpi.energyChangePercent, trend: 'down', label: 'tiết kiệm 8.6%' }}
              subValue="Ước tính ~42.3 triệu VNĐ"
              tag="Tối ưu năng lượng"
              tagVariant="info"
              icon={<Zap className="w-4 h-4 text-blue-700" />}
              iconBg="bg-blue-50 text-blue-700"
              onClick={() => router.push('/dashboard/energy')}
            />

            <MetricCard
              label="SỰ CỐ KHẨN CẤP & CẢNH BÁO"
              value={activeAlerts.length}
              subValue={activeAlerts.length > 0 ? `${activeAlerts.length} sự cố đang mở` : 'Tất cả phòng an toàn'}
              tag={activeAlerts.length > 0 ? 'Cần can thiệp' : 'An Toàn'}
              tagVariant={activeAlerts.length > 0 ? 'critical' : 'success'}
              highlight={activeAlerts.length > 0}
              icon={<Flame className="w-4 h-4 text-red-600" />}
              iconBg="bg-red-50 text-red-600"
              onClick={() => router.push('/dashboard/alerts')}
            />
          </>
        )}
      </div>

      {/* 2.5 AI INSIGHTS & Predictive Intelligence Widget */}
      <div className="admin-card p-5 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white border-blue-900/60 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-blue-600 text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-200">
                  AI Insights & Autonomous Intelligence
                </h3>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-bold px-2 py-0.5 rounded-full">
                  ML Pipeline Active
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Dự báo chuỗi thời gian phụ tải, phát hiện bất thường thiết bị và tối ưu năng lượng campus KTX.
              </p>
            </div>
          </div>

          <Link
            href="/dashboard/intelligence"
            className="text-xs font-semibold text-blue-300 hover:text-white flex items-center gap-1 transition-colors self-start sm:self-auto"
          >
            <span>Mở AI Intelligence Center</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* AI Card 1: Energy Projection */}
          <div
            onClick={() => router.push('/dashboard/intelligence/energy')}
            className="p-3.5 rounded-xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/10 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200">
                Dự Báo Phụ Tải 24h
              </span>
              <Zap className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-xl font-bold font-mono text-white mb-1">
              19,250 kWh
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-300 pt-2 border-t border-white/10">
              <span>Đỉnh: 19:30 @ 98.4 kW</span>
              <span className="text-emerald-400 font-bold font-mono">+8.2% vs T2</span>
            </div>
          </div>

          {/* AI Card 2: Critical Anomaly Alert */}
          <div
            onClick={() => router.push('/dashboard/intelligence/anomalies')}
            className="p-3.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 backdrop-blur-md border border-red-500/30 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-200">
                Bất Thường Thiết Bị
              </span>
              <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
            </div>
            <div className="text-xl font-bold font-mono text-red-100 mb-1">
              03 Thiết Bị
            </div>
            <div className="flex items-center justify-between text-[11px] text-red-200 pt-2 border-t border-red-500/20">
              <span className="truncate max-w-[140px]">Kẹt rơ-le P.B204 (48.5°C)</span>
              <span className="font-bold font-mono text-red-300">Score 96%</span>
            </div>
          </div>

          {/* AI Card 3: Occupancy Expectation */}
          <div
            onClick={() => router.push('/dashboard/intelligence/occupancy')}
            className="p-3.5 rounded-xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/10 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                Dự Đoán Lưu Trú
              </span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-bold font-mono text-white mb-1">
              91% Campus
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-300 pt-2 border-t border-white/10">
              <span>Đông nhất: 20h - 23h</span>
              <span className="text-emerald-400 font-bold font-mono">766 / 842 SV</span>
            </div>
          </div>

          {/* AI Card 4: Top Recommendation */}
          <div
            onClick={() => router.push('/dashboard/intelligence/recommendations')}
            className="p-3.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 backdrop-blur-md border border-purple-500/30 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-200">
                Khuyến Nghị AI Nổi Bật
              </span>
              <Sparkles className="w-4 h-4 text-purple-300" />
            </div>
            <div className="text-xs font-bold text-white line-clamp-1 mb-1">
              Pre-cooling Điều Hòa Tòa A
            </div>
            <div className="flex items-center justify-between text-[11px] text-purple-200 pt-2 border-t border-purple-500/20">
              <span>Tiết kiệm ~4.2 Tr ₫</span>
              <span className="font-bold font-mono text-purple-300">94% AI Conf</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. System Health & Campus Overview Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* System Health Status Panel */}
        <div className="lg:col-span-4 admin-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-blue-900" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  System Health & Services
                </h3>
              </div>
              <Badge variant="success" size="sm" dot>
                100% Sẵn sàng
              </Badge>
            </div>

            <div className="space-y-3">
              {[
                { name: 'IoT Network & ESP32 Nodes', status: 'Operational', port: '802.11 b/g/n', color: 'bg-emerald-500' },
                { name: 'MQTT Message Broker', status: 'Connected', port: 'Port 1883', color: 'bg-emerald-500' },
                { name: 'Backend Microservices (NestJS)', status: 'Operational', port: 'Port 3001', color: 'bg-emerald-500' },
                { name: 'Database & InfluxDB Time-Series', status: 'Operational', port: 'SQLite & Bucket', color: 'bg-emerald-500' },
                { name: 'Socket.IO Real-time Gateway', status: 'Connected', port: 'Observer Pattern', color: 'bg-emerald-500' },
              ].map((srv, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2 h-2 rounded-full ${srv.color}`} />
                    <span className="font-semibold text-slate-800">{srv.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{srv.port}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Độ trễ trung bình: <strong className="text-emerald-700 font-mono">14ms</strong></span>
            <span className="font-mono text-slate-400">Uptime: 99.98%</span>
          </div>
        </div>

        {/* Campus Buildings Overview */}
        <div className="lg:col-span-8 admin-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-900" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Campus Overview — Tỷ Lệ Lấp Đầy & Thiết Bị Theo Tòa
                </h3>
              </div>
              <Link href="/dashboard/buildings" className="text-xs font-semibold text-blue-900 hover:underline flex items-center gap-1">
                <span>Chi tiết các tòa</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {buildings.map((b) => (
                <div
                  key={b.id}
                  onClick={() => router.push('/dashboard/buildings')}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-900 text-white font-bold text-xs flex items-center justify-center">
                          {b.name}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900">Tòa Nhà {b.name}</div>
                          <div className="text-[10px] text-slate-400">{b.floors} Tầng · {b.totalRooms} Phòng</div>
                        </div>
                      </div>

                      {b.alertCount > 0 ? (
                        <Badge variant="critical" size="sm">
                          {b.alertCount} sự cố
                        </Badge>
                      ) : (
                        <Badge variant="success" size="sm">
                          An toàn
                        </Badge>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="my-3 space-y-1">
                      <div className="flex justify-between text-[11px] font-medium text-slate-500">
                        <span>Lấp đầy ({b.occupancyRate}%)</span>
                        <span className="font-semibold text-slate-800">{b.occupiedRooms}/{b.totalRooms} phòng</span>
                      </div>
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-900 rounded-full"
                          style={{ width: `${b.occupancyRate}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/80 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Thiết bị</span>
                      <span className="font-bold text-slate-800 font-mono">{b.deviceCount} nodes</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px]">Điện hôm nay</span>
                      <span className="font-bold text-blue-900 font-mono">{b.energyUsageTodayKwh} kWh</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500">
            <span>Tổng số sinh viên lưu trú: <strong className="text-slate-900">{kpi.totalStudents} sinh viên</strong></span>
            <span>Cửa kiểm soát ra vào: <strong className="text-emerald-700 font-mono">{kpi.doorsOnlineCount}/{kpi.totalDoorsCount} Online</strong></span>
          </div>
        </div>
      </div>

      {/* 4. Telemetry Real-time Chart & Live Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Environmental Microclimate Area Chart */}
        <div className="lg:col-span-8 admin-card p-6 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-900" />
                <h3 className="text-sm font-bold text-slate-900">Dữ Liệu Cảm Biến Vi Khí Hậu KTX (Live Telemetry)</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Biểu đồ nhiệt độ (°C) và độ ẩm (%) nhận trực tiếp từ ESP32 qua MQTT</p>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5 text-blue-900">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-900" />
                <span>Nhiệt độ (°C)</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <span>Độ ẩm (%)</span>
              </div>
            </div>
          </div>

          <div className="h-[280px] w-full">
            {tempChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={tempChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="humidGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.15}/>
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
                      fontWeight: 600
                    }}
                  />
                  <Area type="monotone" dataKey="temp" stroke="#1e3a8a" strokeWidth={2} fill="url(#tempGrad)" name="Nhiệt độ (°C)" dot={{ r: 3, fill: '#1e3a8a' }} />
                  <Area type="monotone" dataKey="humid" stroke="#059669" strokeWidth={2} fill="url(#humidGrad)" name="Độ ẩm (%)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                <Radio className="w-6 h-6 text-slate-300 mb-2 animate-pulse" />
                <p className="text-xs font-semibold text-slate-600">Đang lắng nghe gói tin cảm biến DHT22 từ MQTT Broker...</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Khởi chạy simulator hoặc Wokwi để thấy luồng dữ liệu thời gian thực</p>
              </div>
            )}
          </div>
        </div>

        {/* Live MQTT Event Feed */}
        <div className="lg:col-span-4 admin-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-blue-900" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Luồng MQTT Live Feed
              </h3>
            </div>
            <Badge variant="success" size="sm" dot pulse>
              Live
            </Badge>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 max-h-[280px] pr-1 font-mono text-xs">
            {realtimeLog.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                <Radio className="w-5 h-5 text-slate-300 mb-1.5 animate-spin" />
                <span className="text-xs font-medium">Chờ gói tin cảm biến...</span>
              </div>
            ) : (
              realtimeLog.map((log, i) => (
                <div 
                  key={i} 
                  className={`p-2.5 rounded-lg border flex items-center justify-between transition-colors ${
                    log.alert 
                      ? 'bg-red-50/90 border-red-200 text-red-700 font-semibold' 
                      : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">{log.time}</span>
                    <span className="font-bold text-blue-900">P.{log.room}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-blue-900 font-semibold">{log.temp}°C</span>
                    <span className="text-emerald-700 font-semibold">{log.humid}%</span>
                    {log.alert && (
                      <span className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                        ALARM
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-400 font-mono text-right">
            Topic: dormitory/+/+/telemetry
          </div>
        </div>
      </div>

      {/* 5. Environment & Security Monitoring Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Environment Quick Snapshot */}
        <div className="admin-card p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-blue-900" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Environment Monitoring Snapshot
              </h3>
            </div>
            <Link href="/dashboard/environment" className="text-xs font-semibold text-blue-900 hover:underline">
              Chi tiết →
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Nhiệt Độ TB</div>
              <div className="text-xl font-bold font-mono text-slate-900 my-0.5">27.4°C</div>
              <Badge variant="success" size="sm">Bình thường</Badge>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Độ Ẩm TB</div>
              <div className="text-xl font-bold font-mono text-emerald-700 my-0.5">64%</div>
              <Badge variant="success" size="sm">Bình thường</Badge>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Chất Lượng Khí (AQI)</div>
              <div className="text-xl font-bold font-mono text-blue-900 my-0.5">AQI 42</div>
              <Badge variant="info" size="sm">Trong lành</Badge>
            </div>
          </div>
        </div>

        {/* Security Overview */}
        <div className="admin-card p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Security Overview
              </h3>
            </div>
            <Link href="/dashboard/security" className="text-xs font-semibold text-blue-900 hover:underline">
              Chi tiết →
            </Link>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Cửa Online</div>
              <div className="text-base font-bold font-mono text-slate-900 my-0.5">196/198</div>
              <span className="text-[10px] text-emerald-700 font-semibold">99.0%</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Lượt Quẹt Thẻ</div>
              <div className="text-base font-bold font-mono text-slate-900 my-0.5">1,284</div>
              <span className="text-[10px] text-slate-500 font-medium">Hôm nay</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Từ Chối Thẻ</div>
              <div className="text-base font-bold font-mono text-red-600 my-0.5">04</div>
              <span className="text-[10px] text-red-700 font-semibold">Cần lưu ý</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Security Score</div>
              <div className="text-base font-bold font-mono text-emerald-700 my-0.5">98%</div>
              <span className="text-[10px] text-emerald-700 font-semibold">Tuyệt vời</span>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Active Alerts Banner & Incidents Feed */}
      <div className="admin-card p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-red-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Sự Cố & Cảnh Báo An Ninh Hoạt Động (Active Alerts)
            </h3>
          </div>
          <Link href="/dashboard/alerts" className="text-xs font-semibold text-blue-900 hover:underline">
            Xem tất cả cảnh báo ({alerts.length}) →
          </Link>
        </div>

        <div className="space-y-2.5">
          {activeAlerts.map(alert => (
            <div
              key={alert.id}
              className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                alert.level === 'CRITICAL'
                  ? 'border-red-200 bg-red-50/40 text-red-900'
                  : 'border-amber-200 bg-amber-50/40 text-amber-900'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${alert.level === 'CRITICAL' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'} flex-shrink-0 mt-0.5`}>
                  {alert.type === 'FIRE' ? <Flame className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant={alert.level === 'CRITICAL' ? 'critical' : 'warning'} size="sm">
                      {alert.level}
                    </Badge>
                    <span className="font-bold text-xs text-slate-900">{alert.title}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {alert.description}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono mt-1">
                    <span>Vị trí: <strong>Tòa {alert.buildingName} · Phòng {alert.roomNumber}</strong></span>
                    <span>•</span>
                    <span>{alert.timestamp}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <Link href="/dashboard/emergency">
                  <Button variant="danger" size="sm">
                    Xử lý khẩn cấp
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7. Wokwi ESP32 Hardware Simulator Widget */}
      <div>
        <WokwiPanel />
      </div>
    </div>
  );
}
