'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MetricCard } from '@/components/ui/MetricCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  AI_MODELS_DATA,
  DEVICE_ANOMALIES_DATA,
  AI_RECOMMENDATIONS_DATA,
  OCCUPANCY_HEATMAP_DATA,
  ENERGY_FORECAST_24H,
} from '@/lib/intelligence-data';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Sparkles,
  Zap,
  AlertTriangle,
  Users,
  Server,
  Activity,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Flame,
  Cpu,
  ChevronRight,
  Sliders,
  Play,
  Layers,
  BarChart2,
  Info,
  Check,
} from 'lucide-react';
import { useToast } from '@/components/ui/ToastContext';
import { Modal } from '@/components/ui/Modal';
import { useIntelligenceStore } from '@/lib/intelligence-store';

export default function IntelligenceOverviewPage() {
  const router = useRouter();
  const { success, info } = useToast();
  const {
    recommendations,
    anomalies,
    models,
    occupancyRooms,
    acceptRecommendation,
    retrainAllModels,
  } = useIntelligenceStore();

  const [activeTab, setActiveTab] = useState<'ALL' | 'CRITICAL' | 'WARNING'>('ALL');
  const [executingRec, setExecutingRec] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const activeAnomalies = anomalies.filter((a) => a.status === 'OPEN');
  const criticalAnomalies = activeAnomalies.filter((a) => a.severity === 'CRITICAL');
  const pendingRecs = recommendations.filter((r) => r.status === 'PENDING');

  const filteredAnomalies = anomalies.filter((a) => {
    if (activeTab === 'ALL') return true;
    return a.severity === activeTab;
  });

  const handleExecuteRec = (rec: any) => {
    setExecutingRec(rec);
  };

  const handleConfirmExecute = async () => {
    if (!executingRec) return;
    setIsExecuting(true);
    try {
      const res = await acceptRecommendation(executingRec.id);
      success(res.message || `Đã thực thi thành công khuyến nghị: ${executingRec.title}`, 'AI AUTOMATION');
    } catch (e) {
      success(`Đã thực thi chính sách: ${executingRec.title}`, 'AI AUTOMATION');
    } finally {
      setIsExecuting(false);
      setExecutingRec(null);
    }
  };


  return (
    <div className="space-y-6">
      {/* 1. Page Header & Live AI Engine Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-xl bg-blue-900 text-white shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              SmartDorm AI Intelligence Center
            </h1>
            <Badge variant="purple" size="md" dot pulse>
              AI Engine v2.4 Active
            </Badge>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Trung tâm trí tuệ nhân tạo giám sát phụ tải năng lượng, phát hiện bất thường thiết bị (Isolation Forest) và tối ưu điều phối lưu trú tự động.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/dashboard/intelligence/models">
            <Button
              variant="secondary"
              size="sm"
              icon={<Server className="w-3.5 h-3.5 text-blue-900" />}
            >
              Mô Hình & Hiệu Năng
            </Button>
          </Link>

          <Link href="/dashboard/intelligence/recommendations">
            <Button
              variant="primary"
              size="sm"
              icon={<Sparkles className="w-3.5 h-3.5" />}
            >
              Xem Khuyến Nghị AI ({pendingRecs.length})
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="DỰ BÁO TIÊU THỤ 24H"
          value="19,250 kWh"
          change={{ value: '+8.2%', trend: 'up', label: 'vs hôm qua' }}
          subValue="Đỉnh tải: 19:30 @ 98.4 kW"
          tag="Prophet v2"
          tagVariant="info"
          icon={<Zap className="w-4 h-4 text-blue-900" />}
          iconBg="bg-blue-50 text-blue-900"
          onClick={() => router.push('/dashboard/intelligence/energy')}
        />

        <MetricCard
          label="BẤT THƯỜNG THIẾT BỊ"
          value={activeAnomalies.length > 0 ? `0${activeAnomalies.length} cảnh báo` : '00'}
          subValue={`${criticalAnomalies.length} Critical · Cần ngắt nguồn ngay`}
          tag={criticalAnomalies.length > 0 ? 'Nguy cơ cao' : 'An toàn'}
          tagVariant={criticalAnomalies.length > 0 ? 'critical' : 'success'}
          highlight={criticalAnomalies.length > 0}
          icon={<AlertTriangle className="w-4 h-4 text-red-600" />}
          iconBg="bg-red-50 text-red-600"
          onClick={() => router.push('/dashboard/intelligence/anomalies')}
        />

        <MetricCard
          label="DỰ ĐOÁN LƯU TRÚ ĐỈNH"
          value="91% Campus"
          change={{ value: '766 SV', trend: 'up', label: 'có mặt lúc 20:00' }}
          subValue="72/80 phòng đang có người"
          tag="XGBoost Classifier"
          tagVariant="success"
          icon={<Users className="w-4 h-4 text-emerald-700" />}
          iconBg="bg-emerald-50 text-emerald-700"
          onClick={() => router.push('/dashboard/intelligence/occupancy')}
        />

        <MetricCard
          label="KHUYẾN NGHỊ CHỜ DUYỆT"
          value={`0${pendingRecs.length} Actionable`}
          subValue="Ước tính tiết kiệm ~11.5 Tr ₫"
          tag="AI Recommender"
          tagVariant="purple"
          icon={<Sparkles className="w-4 h-4 text-purple-700" />}
          iconBg="bg-purple-50 text-purple-700"
          onClick={() => router.push('/dashboard/intelligence/recommendations')}
        />
      </div>

      {/* 3. AI Health & Model Status Banner */}
      <div className="admin-card p-5 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white border-blue-950 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
                AI Inference Pipeline Health & Active Models
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                4/4 Models Online
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Pipeline suy luận tự động chạy mỗi 60 giây, phân tích 1.186 nút cảm biến và đồng bộ dự báo phụ tải với InfluxDB.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {AI_MODELS_DATA.map((m) => (
              <div
                key={m.id}
                onClick={() => router.push('/dashboard/intelligence/models')}
                className="bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-xl p-2.5 border border-white/10 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-300 truncate max-w-[90px]">{m.name.split(' ')[0]}</span>
                  <span className={`w-2 h-2 rounded-full ${m.isStale ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                </div>
                <div className="text-xs font-bold font-mono text-white">
                  {m.mae !== undefined ? `MAE: ${m.mae}` : `F1: ${(m.f1Score! * 100).toFixed(0)}%`}
                </div>
                <div className="text-[10px] text-blue-200/80 font-mono mt-0.5">
                  ⚡ {m.latencyMs}ms
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Energy Forecast Chart & Telemetry Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 admin-card p-6 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-900" />
                <h3 className="text-sm font-bold text-slate-900">
                  Dự Báo Phụ Tải 24h: Actual vs AI Forecast & Prediction Interval (95%)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Mô hình Prophet v2 phân tách chu kỳ thời tiết & thói quen sinh hoạt
              </p>
            </div>

            <Link
              href="/dashboard/intelligence/energy"
              className="text-xs font-semibold text-blue-900 hover:underline flex items-center gap-1"
            >
              <span>Chi tiết dự báo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ENERGY_FORECAST_24H} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  {/* Prediction interval band */}
                  <linearGradient id="confidenceBand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} unit=" kW" />
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
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                
                {/* Confidence Interval Upper/Lower */}
                <Area
                  type="monotone"
                  dataKey="upperBound"
                  stroke="transparent"
                  fill="url(#confidenceBand)"
                  name="Dải tin cậy 95% (Upper)"
                />
                <Area
                  type="monotone"
                  dataKey="lowerBound"
                  stroke="transparent"
                  fill="#ffffff"
                  name="Dải tin cậy 95% (Lower)"
                />

                {/* AI Forecast Line */}
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: '#2563eb' }}
                  name="AI Forecast (kW)"
                />

                {/* Actual Realtime Line */}
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#1e3a8a"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#1e3a8a' }}
                  name="Thực tế (kW)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <span>Đỉnh phụ tải dự kiến: <strong className="text-slate-900 font-mono">19:30 - 21:00</strong></span>
              <span>Sai số MAE: <strong className="text-emerald-700 font-mono">0.42 kW (3.8%)</strong></span>
            </div>
            <span className="text-[11px] text-blue-900 font-semibold">Cập nhật mỗi 15 phút</span>
          </div>
        </div>

        {/* Quick Top Recommendations Timeline */}
        <div className="lg:col-span-4 admin-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-700" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Top Khuyến Nghị AI Nổi Bật
              </h3>
            </div>
            <Link
              href="/dashboard/intelligence/recommendations"
              className="text-xs font-semibold text-blue-900 hover:underline"
            >
              Tất cả ({pendingRecs.length}) →
            </Link>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] pr-1">
            {pendingRecs.slice(0, 3).map((rec) => (
              <div
                key={rec.id}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-slate-300 hover:shadow-2xs transition-all"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Badge
                    variant={
                      rec.severity === 'CRITICAL'
                        ? 'critical'
                        : rec.severity === 'HIGH'
                        ? 'warning'
                        : 'purple'
                    }
                    size="sm"
                  >
                    {rec.category} · {rec.confidence}% AI
                  </Badge>
                  <span className="text-[10px] text-slate-400 font-mono">{rec.createdAt}</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 line-clamp-1 mb-1">
                  {rec.title}
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-2.5">
                  {rec.description}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/80">
                  <span className="text-[10px] font-bold text-emerald-700">
                    {rec.savingsEstimate || rec.potentialImpact}
                  </span>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleExecuteRec(rec)}
                  >
                    Thực thi
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 text-right">
            Hỗ trợ cơ chế Command Pattern & Undo an toàn
          </div>
        </div>
      </div>

      {/* 5. Device Anomalies Quick Table & Live Isolation Forest Status */}
      <div className="admin-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Bất Thường Thiết Bị Phát Hiện Gần Đây (Isolation Forest Engine)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Tự động phân tích profile dòng tải, nhiệt độ và độ trễ phản hồi rơ-le để bắt lỗi phần cứng
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex p-1 bg-slate-100 rounded-lg text-xs font-semibold text-slate-600">
              <button
                onClick={() => setActiveTab('ALL')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'ALL' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'hover:text-slate-900'
                }`}
              >
                Tất cả ({DEVICE_ANOMALIES_DATA.length})
              </button>
              <button
                onClick={() => setActiveTab('CRITICAL')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'CRITICAL' ? 'bg-white text-red-700 shadow-2xs font-bold' : 'hover:text-slate-900'
                }`}
              >
                Critical ({criticalAnomalies.length})
              </button>
              <button
                onClick={() => setActiveTab('WARNING')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'WARNING' ? 'bg-white text-amber-700 shadow-2xs font-bold' : 'hover:text-slate-900'
                }`}
              >
                Warning
              </button>
            </div>

            <Link href="/dashboard/intelligence/anomalies">
              <Button variant="secondary" size="sm">
                Chi tiết →
              </Button>
            </Link>
          </div>
        </div>

        {/* Anomaly Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="pb-3 pl-2">Thiết Bị</th>
                <th className="pb-3">Vị Trí</th>
                <th className="pb-3 text-center">Anomaly Score</th>
                <th className="pb-3">Mức Độ</th>
                <th className="pb-3">Thời Gian Phát Hiện</th>
                <th className="pb-3">Hiện Trạng</th>
                <th className="pb-3 text-right pr-2">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAnomalies.map((anom) => (
                <tr
                  key={anom.id}
                  onClick={() => router.push('/dashboard/intelligence/anomalies')}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                >
                  <td className="py-3.5 pl-2 font-bold text-slate-900 flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        anom.severity === 'CRITICAL'
                          ? 'bg-red-500 animate-ping'
                          : anom.severity === 'HIGH'
                          ? 'bg-amber-500'
                          : 'bg-blue-500'
                      }`}
                    />
                    <span>{anom.deviceName}</span>
                  </td>
                  <td className="py-3.5 text-slate-600 font-medium">
                    Tòa {anom.buildingName} · P.{anom.roomNumber}
                  </td>
                  <td className="py-3.5 text-center">
                    <span
                      className={`font-mono font-bold px-2 py-0.5 rounded ${
                        anom.anomalyScore > 0.85
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : anom.anomalyScore > 0.65
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {(anom.anomalyScore * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="py-3.5">
                    <Badge
                      variant={
                        anom.severity === 'CRITICAL'
                          ? 'critical'
                          : anom.severity === 'HIGH'
                          ? 'warning'
                          : anom.severity === 'WARNING'
                          ? 'warning'
                          : 'neutral'
                      }
                      size="sm"
                    >
                      {anom.severity}
                    </Badge>
                  </td>
                  <td className="py-3.5 text-slate-400 font-mono">{anom.detectedAt}</td>
                  <td className="py-3.5 text-slate-600 font-medium max-w-xs truncate">
                    {anom.currentBehavior}
                  </td>
                  <td className="py-3.5 text-right pr-2">
                    <Button
                      size="sm"
                      variant={anom.severity === 'CRITICAL' ? 'danger' : 'secondary'}
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push('/dashboard/intelligence/anomalies');
                      }}
                    >
                      Kiểm tra
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Occupancy Overview Heatmap Grid */}
      <div className="admin-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-900" />
              <h3 className="text-sm font-bold text-slate-900">
                Bản Đồ Mật Độ Lưu Trú & Trạng Thái HVAC Dự Báo (Occupancy Heatmap)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Ước tính số lượng sinh viên theo thời gian thực và đề xuất cấu hình điều hòa ECO / Comfort
            </p>
          </div>

          <Link href="/dashboard/intelligence/occupancy">
            <Button variant="secondary" size="sm">
              Xem toàn bộ phòng →
            </Button>
          </Link>
        </div>

        {/* Heatmap Room Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
          {occupancyRooms.map((room) => {
            const isHigh = room.predictedOccupancyRate >= 80;
            const isMid = room.predictedOccupancyRate >= 40 && room.predictedOccupancyRate < 80;
            const isVacant = room.predictedOccupancyRate < 40;


            return (
              <div
                key={room.roomId}
                onClick={() => router.push('/dashboard/intelligence/occupancy')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer hover:scale-105 hover:shadow-xs ${
                  isHigh
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                    : isMid
                    ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <div className="text-[10px] font-bold text-slate-400">
                  Tòa {room.buildingName}
                </div>
                <div className="text-sm font-bold font-mono my-0.5 text-slate-900">
                  P.{room.roomNumber}
                </div>
                <div className="text-xs font-bold font-mono">
                  {room.predictedOccupancyRate}%
                </div>
                <div className="text-[9px] mt-1 font-semibold flex items-center justify-center gap-1">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isHigh ? 'bg-emerald-600' : isMid ? 'bg-amber-500' : 'bg-slate-400'
                    }`}
                  />
                  <span>{room.recommendedHvacState}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-4 mt-4 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-md bg-emerald-500" />
              <span>Đầy (≥ 80% · Comfort Mode)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-md bg-amber-500" />
              <span>Vừa (40 - 79% · ECO Mode)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-md bg-slate-300" />
              <span>Trống (&lt; 40% · Standby)</span>
            </div>
          </div>
          <span>Thuật toán XGBoost độ chính xác F1: <strong>92.8%</strong></span>
        </div>
      </div>

      {/* Execution Confirmation Modal */}
      <Modal
        isOpen={!!executingRec}
        onClose={() => setExecutingRec(null)}
        title="Xác Nhận Thực Thi Hành Động AI"
        description="Hệ thống sẽ gửi các lệnh điều khiển IoT thông qua Broker MQTT"
        maxWidth="lg"
      >
        {executingRec && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900">
              <h4 className="font-bold text-sm mb-1">{executingRec.title}</h4>
              <p className="leading-relaxed text-blue-800">{executingRec.reason}</p>
            </div>

            <div>
              <div className="font-bold text-slate-800 mb-2 uppercase text-[10px] tracking-wider">
                Kế Hoạch Thực Thi Từng Bước:
              </div>
              <div className="space-y-2">
                {executingRec.executionPlan.map((step: any) => (
                  <div
                    key={step.step}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-xs"
                  >
                    <span className="w-5 h-5 rounded-full bg-blue-900 text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                      {step.step}
                    </span>
                    <div>
                      <div className="font-semibold text-slate-800">{step.description}</div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                        Target: {step.target}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-slate-500 font-medium">
                Độ tin cậy: <strong className="text-purple-700">{executingRec.confidence}% AI Confidence</strong>
              </span>

              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={() => setExecutingRec(null)}>
                  Hủy Bỏ
                </Button>
                <Button
                  variant="primary"
                  loading={isExecuting}
                  onClick={handleConfirmExecute}
                  icon={<Check className="w-3.5 h-3.5" />}
                >
                  Xác Nhận & Kích Hoạt
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
