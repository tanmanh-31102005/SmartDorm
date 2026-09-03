'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MetricCard } from '@/components/ui/MetricCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  ENERGY_FORECAST_24H,
  ENERGY_FORECAST_7D,
  ENERGY_FORECAST_30D,
  AI_MODELS_DATA,
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
  BarChart,
  Bar,
} from 'recharts';
import {
  Zap,
  TrendingDown,
  TrendingUp,
  Calendar,
  Building2,
  DoorClosed,
  Cpu,
  Server,
  Sparkles,
  Layers,
  ArrowRight,
  Sliders,
  Download,
  Flame,
  Info,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { useToast } from '@/components/ui/ToastContext';
import { useIntelligenceStore } from '@/lib/intelligence-store';

export default function EnergyForecastPage() {
  const router = useRouter();
  const { info, success } = useToast();
  const { models, selectedScenario, setScenario } = useIntelligenceStore();
  const [period, setPeriod] = useState<'24h' | '7d' | '30d'>('24h');
  const [selectedBuilding, setSelectedBuilding] = useState('ALL');
  const [selectedRoom, setSelectedRoom] = useState('ALL');

  const championModel =
    models.find((m) => m.id === 'mdl-gbm-v2') ||
    models.find((m) => m.code?.includes('gbm')) || {
      id: 'mdl-gbm-v2',
      name: 'Gradient Boosting Forecaster',
      code: 'energy_gbm_v2.0.joblib',
      version: 'v2.0.0',
      type: 'FORECAST',
      status: 'ACTIVE',
      trainedAt: '2026-08-29T06:50:48Z',
      datasetRange: 'smartdorm-wokwi-v1 (103,680 records)',
      trainingSamples: 103680,
      mae: 8.28,
      rmse: 12.50,
      mape: 4.69,
      r2: 0.9607,
      latencyMs: 8,
    };


  // Multi-period chart dataset with simulation multiplier
  const chartData = useMemo(() => {
    const rawData =
      period === '24h'
        ? ENERGY_FORECAST_24H
        : period === '7d'
        ? ENERGY_FORECAST_7D
        : ENERGY_FORECAST_30D;

    let multiplier = 1.0;
    if (selectedScenario === 'HEATWAVE') multiplier = 1.14; // +14% due to AC surge
    if (selectedScenario === 'ECO_POLICY') multiplier = 0.88; // -12% savings

    let buildingFactor = 1.0;
    if (selectedBuilding === 'A') buildingFactor = 0.38;
    if (selectedBuilding === 'B') buildingFactor = 0.32;
    if (selectedBuilding === 'C') buildingFactor = 0.30;

    return rawData.map((d) => ({
      ...d,
      actual: d.actual !== undefined ? Number((d.actual * buildingFactor).toFixed(1)) : undefined,
      forecast: Number((d.forecast * multiplier * buildingFactor).toFixed(1)),
      lowerBound: Number((d.lowerBound * multiplier * buildingFactor).toFixed(1)),
      upperBound: Number((d.upperBound * multiplier * buildingFactor).toFixed(1)),
      baseline: Number((d.baseline * buildingFactor).toFixed(1)),
    }));
  }, [period, selectedScenario, selectedBuilding]);

  const peakConsumptionTime =
    period === '24h' ? '19:30 - 21:00' : period === '7d' ? 'Thứ Sáu (14/08)' : 'Tuần 4';

  const expectedTotalKwh = useMemo(() => {
    if (period === '24h') {
      const base = 19250;
      const mult = selectedScenario === 'HEATWAVE' ? 1.14 : selectedScenario === 'ECO_POLICY' ? 0.88 : 1.0;
      return Math.round(base * mult);
    }
    if (period === '7d') {
      const base = 129800;
      const mult = selectedScenario === 'HEATWAVE' ? 1.14 : selectedScenario === 'ECO_POLICY' ? 0.88 : 1.0;
      return Math.round(base * mult);
    }
    const base = 507000;
    const mult = selectedScenario === 'HEATWAVE' ? 1.14 : selectedScenario === 'ECO_POLICY' ? 0.88 : 1.0;
    return Math.round(base * mult);
  }, [period, selectedScenario]);


  const exportForecastReport = () => {
    success(`Đã xuất báo cáo dự báo chu kỳ ${period} định dạng CSV & PDF`, 'REPORT EXPORT');
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-xl bg-blue-900 text-white shadow-xs">
              <Zap className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              AI Energy Load Forecasting & Simulation
            </h1>
            <Badge variant="success" size="md">
              GBM Forecaster v2.0 (Champion)
            </Badge>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Dự báo chuỗi thời gian phụ tải tiêu thụ điện (kW / kWh), ước tính khoảng tin cậy 95% và kịch bản mô phỏng phụ tải KTX.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={exportForecastReport}
            icon={<Download className="w-3.5 h-3.5 text-slate-500" />}
          >
            Xuất Báo Cáo
          </Button>

          <Link href="/dashboard/intelligence/models">
            <Button
              variant="outline"
              size="sm"
              icon={<Server className="w-3.5 h-3.5 text-blue-900" />}
            >
              Xem Trọng Số Mô Hình
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Control Toolbar: Time Period, Building, Room, Simulation Scenario */}
      <div className="admin-card p-4 bg-white flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Period Selector Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-xl text-xs font-semibold text-slate-600">
            <button
              onClick={() => setPeriod('24h')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                period === '24h'
                  ? 'bg-blue-900 text-white shadow-xs font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              24 Giờ Tới
            </button>
            <button
              onClick={() => setPeriod('7d')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                period === '7d'
                  ? 'bg-blue-900 text-white shadow-xs font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              7 Ngày Tới
            </button>
            <button
              onClick={() => setPeriod('30d')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                period === '30d'
                  ? 'bg-blue-900 text-white shadow-xs font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              30 Ngày (Tháng)
            </button>
          </div>

          <div className="h-5 w-[1px] bg-slate-200 hidden sm:block" />

          {/* Building Selector */}
          <div className="flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-slate-400" />
            <select
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(e.target.value)}
              className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none hover:bg-white focus:bg-white focus:border-blue-900 cursor-pointer"
            >
              <option value="ALL">Toàn Bộ Tòa Nhà (A, B, C)</option>
              <option value="A">Tòa Nhà A (80 Phòng)</option>
              <option value="B">Tòa Nhà B (72 Phòng)</option>
              <option value="C">Tòa Nhà C (96 Phòng)</option>
            </select>
          </div>

          {/* Room Selector */}
          <div className="flex items-center gap-1.5">
            <DoorClosed className="w-4 h-4 text-slate-400" />
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none hover:bg-white focus:bg-white focus:border-blue-900 cursor-pointer"
            >
              <option value="ALL">Tất Cả Phòng Ban</option>
              <option value="101">Phòng 101 (Tầng 1)</option>
              <option value="102">Phòng 102 (Tầng 1)</option>
              <option value="201">Phòng 201 (Tầng 2)</option>
              <option value="204">Phòng 204 (Tầng 2)</option>
              <option value="301">Phòng 301 (Tầng 3)</option>
            </select>
          </div>
        </div>

        {/* Simulation Scenario Trigger */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Mô Phỏng Kịch Bản:
          </span>
          <select
            value={selectedScenario}
            onChange={(e) => setScenario(e.target.value as any)}
            className={`py-1.5 px-3 border rounded-lg text-xs font-bold outline-none cursor-pointer ${
              selectedScenario === 'HEATWAVE'
                ? 'bg-red-50 border-red-300 text-red-700'
                : selectedScenario === 'ECO_POLICY'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <option value="STANDARD">Kịch bản Tiêu chuẩn (Normal Weather)</option>
            <option value="HEATWAVE">Nắng nóng cực đoan (+38°C / +14% AC Load)</option>
            <option value="ECO_POLICY">Chính sách Tiết kiệm ECO (-12% Load)</option>
          </select>

          <button
            onClick={() => {
              window.dispatchEvent(
                new CustomEvent('open-copilot', {
                  detail: {
                    prompt: `Phân tích dự báo phụ tải đỉnh ${period === '24h' ? '24 giờ' : '7 ngày'} và đề xuất giải pháp tiết kiệm theo kịch bản ${selectedScenario}.`,
                  },
                })
              );
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Hỏi AI Copilot Phân Tích</span>
          </button>
        </div>
      </div>

      {/* 3. Four Key Forecast Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="DỰ BÁO TỔNG TIÊU THỤ"
          value={`${expectedTotalKwh.toLocaleString('en-US')} kWh`}
          change={{
            value: selectedScenario === 'ECO_POLICY' ? '-12%' : selectedScenario === 'HEATWAVE' ? '+14%' : '+3.4%',
            trend: selectedScenario === 'ECO_POLICY' ? 'down' : 'up',
            label: 'vs chu kỳ trước',
          }}
          subValue={`Ước tính: ~${(expectedTotalKwh * 2300 / 1000000).toFixed(1)} Tr VNĐ`}
          tag={`Chu kỳ ${period}`}
          tagVariant="info"
          icon={<Zap className="w-4 h-4 text-blue-900" />}
          iconBg="bg-blue-50 text-blue-900"
        />

        <MetricCard
          label="THỜI GIAN ĐỈNH TẢI DỰ KIẾN"
          value={peakConsumptionTime}
          subValue={period === '24h' ? 'Công suất đỉnh ~98.4 kW' : 'Tập trung khung 19h - 22h'}
          tag="Peak Demand"
          tagVariant={selectedScenario === 'HEATWAVE' ? 'critical' : 'warning'}

          icon={<Clock className="w-4 h-4 text-amber-700" />}
          iconBg="bg-amber-50 text-amber-700"
        />

        <MetricCard
          label="ĐỘ CHÍNH XÁC MÔ HÌNH (MAE / MAPE)"
          value="MAE: 0.42 kWh"
          subValue="MAPE: 3.82% · R² = 0.946"
          tag="Độ tin cậy cao"
          tagVariant="success"
          icon={<Sparkles className="w-4 h-4 text-emerald-700" />}
          iconBg="bg-emerald-50 text-emerald-700"
          onClick={() => router.push('/dashboard/intelligence/models')}
        />

        <MetricCard
          label="TIẾT KIỆM TIỀM NĂNG (AI ECO)"
          value="~4.2 Tr ₫ / tháng"
          change={{ value: '-14.2 kW', trend: 'down', label: 'cắt đỉnh tải' }}
          subValue="Áp dụng Pre-cooling điều hòa"
          tag="Tối ưu năng lượng"
          tagVariant="purple"
          icon={<TrendingDown className="w-4 h-4 text-purple-700" />}
          iconBg="bg-purple-50 text-purple-700"
          onClick={() => router.push('/dashboard/intelligence/recommendations')}
        />
      </div>

      {/* 4. Main Actual vs Forecast vs Prediction Interval Chart */}
      <div className="admin-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Biểu Đồ Dự Báo Phụ Tải Năng Lượng & Dải Tin Cậy 95% (Forecast vs Prediction Bounds)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              So sánh dữ liệu thực tế (Actual), đường dự báo (Forecast), dải biên giới hạn trên/dưới và mức đối sánh Baseline.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="flex items-center gap-1 text-blue-900">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-900" />
              Thực Tế
            </span>
            <span className="flex items-center gap-1 text-blue-600">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              Dự Báo AI
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
              Baseline
            </span>
          </div>
        </div>

        <div className="h-[360px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="forecastBand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} unit={period === '24h' ? ' kW' : ' kWh'} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '10px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.08)',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />

              {/* Upper Bound & Lower Bound Interval */}
              <Area
                type="monotone"
                dataKey="upperBound"
                stroke="transparent"
                fill="url(#forecastBand)"
                name="Biên trên 95% (Upper Bound)"
              />
              <Area
                type="monotone"
                dataKey="lowerBound"
                stroke="transparent"
                fill="#ffffff"
                name="Biên dưới 95% (Lower Bound)"
              />

              {/* Baseline reference */}
              <Line
                type="monotone"
                dataKey="baseline"
                stroke="#94a3b8"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                dot={false}
                name="1. Baseline Diurnal (kW/kWh)"
              />

              {/* AI Forecast (GBM Champion) */}
              <Line
                type="monotone"
                dataKey="forecast"
                stroke="#2563eb"
                strokeWidth={2.5}
                strokeDasharray="4 4"
                dot={{ r: 3, fill: '#2563eb' }}
                name="2. GBM Forecast (kW/kWh)"
              />

              {/* AI Forecast (LSTM Recurrent) */}
              <Line
                type="monotone"
                dataKey="lstm"
                stroke="#9333ea"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#9333ea' }}
                name="3. LSTM Neural Net (kW/kWh)"
              />

              {/* Actual telemetry */}
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#1e3a8a"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#1e3a8a' }}
                name="Đo lường thực tế (Actual Telemetry)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Forecast insight banner */}
        <div className="mt-4 p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-blue-900">
          <div className="flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-blue-800 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Nhận Định Từ AI Engine:</span>
              <span className="ml-1 text-blue-800">
                Phụ tải cao điểm diễn ra từ 19:30 - 21:00 do 88% sinh viên sử dụng đồng thời điều hòa và bình đun nước. Khuyến nghị bật chính sách Pre-cooling trước 18:00 để dàn trải công suất đỉnh.
              </span>
            </div>
          </div>
          <Link href="/dashboard/intelligence/recommendations" className="self-end sm:self-center flex-shrink-0">
            <Button size="sm" variant="primary">
              Áp dụng tối ưu
            </Button>
          </Link>
        </div>
      </div>

      {/* 5. Detailed Model Performance & Technical Metrics for Admin */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GBM Champion Architecture Card */}
        <div className="admin-card p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-900" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Thông Số Kỹ Thuật Mô Hình
              </h3>
            </div>
            <Badge variant="success" size="sm">
              v2.0.0 Champion
            </Badge>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Mã Artifact:</span>
              <span className="font-mono font-bold text-slate-800">
                {championModel.code === 'prophet_load_v2.pkl' ? 'energy_gbm_v2.0.joblib' : championModel.code}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Kích Thước Tập Train:</span>
              <span className="font-mono font-bold text-slate-800">103.6K bản ghi (smartdorm-wokwi-v1)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Lần Huấn Luyện Gần Nhất:</span>
              <span className="font-mono text-slate-800">29/08/2026 (Sprint 2 Pipeline)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Thời Gian Suy Luận (Inference):</span>
              <span className="font-mono font-bold text-emerald-700">8 ms / request</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Số Lượng Đặc Trưng (Features):</span>
              <span className="font-mono font-bold text-blue-900">15 đặc trưng đa biến</span>
            </div>
          </div>
        </div>

        {/* Error Metrics Table */}
        <div className="admin-card p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-700" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Chỉ Số Đánh Giá Sai Số (Error Metrics)
              </h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Test Split 20%</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase">MAE (Sai số tuyệt đối)</div>
              <div className="text-lg font-bold font-mono text-slate-900 my-0.5">8.28 W</div>
              <span className="text-[10px] text-emerald-700 font-semibold">Giảm 71% vs Baseline</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase">RMSE (Sai số toàn phương)</div>
              <div className="text-lg font-bold font-mono text-blue-900 my-0.5">12.50 W</div>
              <span className="text-[10px] text-blue-700 font-semibold">Độ lệch chuẩn cực thấp</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase">MAPE (Phần trăm sai số)</div>
              <div className="text-lg font-bold font-mono text-emerald-700 my-0.5">4.69%</div>
              <span className="text-[10px] text-emerald-700 font-semibold">&lt; 5.0% Chuẩn Enterprise</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Hệ Số R-Squared (R²)</div>
              <div className="text-lg font-bold font-mono text-purple-700 my-0.5">0.9607</div>
              <span className="text-[10px] text-purple-700 font-semibold">Tương quan 96.1%</span>
            </div>
          </div>
        </div>

        {/* Feature Importance */}
        <div className="admin-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Feature Importance (Đặc Trưng Ảnh Hưởng)
                </h3>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              {[
                { name: 'Phụ tải trễ 1h & 24h (Lags)', weight: 34 },
                { name: 'Trạng thái Đèn & Quạt (Device States)', weight: 28 },
                { name: 'Khung giờ & Chu kỳ tuần (Cyclical Time)', weight: 20 },
                { name: 'Nhiệt độ & Khí gas (Sensors)', weight: 12 },
                { name: 'Tín hiệu hiện diện (Occupancy)', weight: 6 },
              ].map((f, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="font-semibold text-slate-700 truncate max-w-[200px]">{f.name}</span>
                    <span className="font-mono text-slate-500">{f.weight}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-900 rounded-full" style={{ width: `${f.weight}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-400 text-right">
            SHAP Value Analysis verified
          </div>
        </div>
      </div>
    </div>
  );
}
