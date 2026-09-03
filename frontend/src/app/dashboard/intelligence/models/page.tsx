'use client';
import { useState } from 'react';
import Link from 'next/link';
import { MetricCard } from '@/components/ui/MetricCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import {
  AI_MODELS_DATA,
  MODEL_BENCHMARK_COMPARISON,
  ModelMetric,
} from '@/lib/intelligence-data';
import {
  Server,
  Cpu,
  Zap,
  Activity,
  AlertTriangle,
  RotateCw,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  Sparkles,
  Sliders,
  Check,
  FileCode,
  ShieldCheck,
  Database,
  BarChart3,
  Clock,
  Users,
  Award,
  ArrowUpRight,
  TrendingDown,
} from 'lucide-react';
import { useToast } from '@/components/ui/ToastContext';
import { useIntelligenceStore } from '@/lib/intelligence-store';

export default function ModelPerformancePage() {
  const { success, warning, info } = useToast();
  const { models, retrainModel, retrainAllModels } = useIntelligenceStore();
  const [activeTab, setActiveTab] = useState<'REGISTRY' | 'BENCHMARK' | 'DRIFT'>('BENCHMARK');
  const [retrainingModel, setRetrainingModel] = useState<ModelMetric | null>(null);
  const [retrainProgress, setRetrainProgress] = useState(0);
  const [isRetraining, setIsRetraining] = useState(false);
  const [activeForecaster, setActiveForecaster] = useState('energy-gbm-forecaster');

  const activeModelsCount = models.filter((m) => m.status === 'ACTIVE').length;
  const staleModelsCount = models.filter((m) => m.isStale).length;

  const handleStartRetrain = (model: ModelMetric) => {
    setRetrainingModel(model);
    setRetrainProgress(15);
    setIsRetraining(true);

    let progress = 15;
    const interval = setInterval(async () => {
      progress += 25;
      if (progress >= 100) {
        clearInterval(interval);
        setRetrainProgress(100);
        setIsRetraining(false);
        await retrainModel(model.id);
        success(`Đã hoàn tất tái huấn luyện mô hình ${model.name}`, 'MODEL RETRAIN');
      } else {
        setRetrainProgress(progress);
      }
    }, 450);
  };

  const handlePromote = (modelCode: string, modelName: string) => {
    setActiveForecaster(modelCode);
    success(`Đã thăng cấp mô hình '${modelName}' làm mô hình dự báo chính thức (ACTIVE).`, 'MODEL PROMOTION');
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-xl bg-blue-900 text-white shadow-xs">
              <Server className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              AI Models Performance & MLOps Lifecycle
            </h1>
            <Badge variant="success" size="md">
              {models.length} Models Deployed
            </Badge>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Quản lý vòng đời mô hình học máy (Model Registry, So sánh Benchmark, Auto-Promotion, Drift Monitoring và Tái huấn luyện).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/dashboard/intelligence">
            <Button variant="secondary" size="sm">
              AI Overview
            </Button>
          </Link>
          <Link href="/dashboard/intelligence/energy">
            <Button variant="primary" size="sm" icon={<Zap className="w-3.5 h-3.5" />}>
              Kiểm Tra Dự Báo
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="MÔ HÌNH HOẠT ĐỘNG (ACTIVE)"
          value={activeModelsCount.toString()}
          subValue="Sẵn sàng phục vụ inference"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          iconBg="bg-emerald-50 text-emerald-600"
          tag="Healthy"
          tagVariant="success"
        />
        <MetricCard
          label="SAI SỐ MAE TỐT NHẤT"
          value="0.38 kW"
          subValue="Mô hình LSTM Neural Network"
          icon={<TrendingDown className="w-4 h-4 text-blue-600" />}
          iconBg="bg-blue-50 text-blue-600"
          tag="-9.5% MAE"
          tagVariant="info"
        />
        <MetricCard
          label="ĐỘ TRỄ TRUNG BÌNH (LATENCY)"
          value="8.2 ms"
          subValue="Thời gian phản hồi suy luận"
          icon={<Activity className="w-4 h-4 text-purple-600" />}
          iconBg="bg-purple-50 text-purple-600"
          tag="Ultra Fast"
          tagVariant="neutral"
        />
        <MetricCard
          label="CẢNH BÁO MÔ HÌNH CŨ (STALE)"
          value={staleModelsCount.toString()}
          subValue="Baseline > 30 ngày chưa retrain"
          icon={<AlertTriangle className="w-4 h-4 text-amber-600" />}
          iconBg="bg-amber-50 text-amber-600"
          tag={staleModelsCount > 0 ? 'Cần Retrain' : 'Tối Ưu'}
          tagVariant={staleModelsCount > 0 ? 'warning' : 'success'}
        />
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('BENCHMARK')}
            className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'BENCHMARK'
                ? 'border-blue-900 text-blue-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            So Sánh Mô Hình (Benchmark & Promotion)
          </button>
          <button
            onClick={() => setActiveTab('REGISTRY')}
            className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'REGISTRY'
                ? 'border-blue-900 text-blue-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            Model Registry ({models.length})
          </button>
          <button
            onClick={() => setActiveTab('DRIFT')}
            className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'DRIFT'
                ? 'border-blue-900 text-blue-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Activity className="w-4 h-4" />
            Data Drift & Staleness Monitor
          </button>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={<RotateCw className="w-3.5 h-3.5" />}
          onClick={() => handleStartRetrain(models[0])}
        >
          Chạy Retrain Pipeline
        </Button>
      </div>

      {/* 4. Tab 1: Benchmark & Comparison */}
      {activeTab === 'BENCHMARK' && (
        <div className="space-y-6">
          {/* Executive Benchmark Summary */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent pointer-events-none" />
            <div className="relative z-10 space-y-3">
              <div className="flex items-center gap-2">
                <div className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-bold border border-blue-400/30 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-300" />
                  Mô Hình Tối Ưu Nhất: {MODEL_BENCHMARK_COMPARISON.bestPerformingModel}
                </div>
                <Badge variant="success" size="sm">
                  Sai số MAE thấp hơn {MODEL_BENCHMARK_COMPARISON.maeDeltaPercent}%
                </Badge>
              </div>
              <h2 className="text-lg font-bold">
                Đối Soát Hiệu Năng: Baseline vs Gradient Boosting (GBM) vs LSTM Neural Network
              </h2>
              <p className="text-xs text-blue-200/90 max-w-3xl leading-relaxed">
                Đánh giá độc lập trên tập kiểm định Time-series Chronological Split (70% Train, 15% Validation, 15% Test) với 1.65 triệu bản ghi đo đạc thực tế từ Wokwi và thiết bị IoT.
              </p>
            </div>
          </div>

          {/* Benchmark Comparison Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-900" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Bảng Đối Soát Chỉ Số Hiệu Năng Mô Hình (Model Benchmark Matrix)
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Cập nhật lúc: {new Date(MODEL_BENCHMARK_COMPARISON.evaluationTimestamp).toLocaleTimeString('vi-VN')}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/60 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Mô Hình / Thuật Toán</th>
                    <th className="py-3 px-4">Loại Kiến Trúc</th>
                    <th className="py-3 px-4 text-center">Trạng Thái</th>
                    <th className="py-3 px-4 text-right">MAE (kW)</th>
                    <th className="py-3 px-4 text-right">RMSE (kW)</th>
                    <th className="py-3 px-4 text-right">MAPE (%)</th>
                    <th className="py-3 px-4 text-right">Hệ Số R²</th>
                    <th className="py-3 px-4 text-right">Độ Trễ</th>
                    <th className="py-3 px-4 text-center">Hành Động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {MODEL_BENCHMARK_COMPARISON.models.map((m) => {
                    // Model đang ACTIVE: check theo code hoặc theo type ENSEMBLE (GBM)
                    const isCurrentActive = activeForecaster === m.code ||
                      (activeForecaster === 'energy-gbm-forecaster' && m.type === 'ENSEMBLE');
                    // Best model: MAPE thấp nhất trong 3 models (GBM = 4.69%)
                    const isBest = m.metrics.mape === Math.min(...MODEL_BENCHMARK_COMPARISON.models.map(x => x.metrics.mape));

                    return (
                      <tr key={m.modelId} className={`hover:bg-slate-50/80 transition-colors ${isCurrentActive ? 'bg-blue-50/40' : ''}`}>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            {isBest && <Award className="w-4 h-4 text-amber-500 shrink-0" />}
                            <div>
                              <div className="font-bold text-slate-900">{m.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{m.code}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            {m.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <Badge variant={isCurrentActive ? 'success' : m.status === 'STANDBY' ? 'info' : 'warning'} size="sm">
                            {isCurrentActive ? 'ACTIVE (Chính Thức)' : m.status}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                          {m.metrics.mae.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                          {m.metrics.rmse.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-emerald-600 font-bold">
                          {m.metrics.mape.toFixed(2)}%
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-900 font-bold">
                          {m.metrics.r2Score.toFixed(3)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                          {m.latencyMs} ms
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {isCurrentActive ? (
                            <span className="text-[11px] font-bold text-emerald-700 flex items-center justify-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Đang Dùng
                            </span>
                          ) : (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handlePromote(m.code, m.name)}
                            >
                              Thăng Cấp
                            </Button>
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
      )}

      {/* 5. Tab 2: Model Registry */}
      {activeTab === 'REGISTRY' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {models.map((model) => (
            <div
              key={model.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 hover:border-slate-300 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{model.name}</h3>
                    <Badge variant={model.status === 'ACTIVE' ? 'success' : 'neutral'} size="sm">
                      {model.status}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">{model.code} · {model.version}</p>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 text-slate-600 border border-slate-200">
                  <Cpu className="w-4 h-4" />
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {model.description}
              </p>

              <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100 text-center font-mono">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-sans">Độ Trễ</div>
                  <div className="text-xs font-bold text-slate-800">{model.latencyMs} ms</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-sans">{model.f1Score ? 'F1-Score' : 'R² Score'}</div>
                  <div className="text-xs font-bold text-emerald-600">{model.f1Score ? model.f1Score.toFixed(3) : model.r2?.toFixed(3) || '0.946'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-sans">Mẫu Train</div>
                  <div className="text-xs font-bold text-slate-800">{(model.trainingSamples / 1000).toFixed(0)}k</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-400 text-[11px] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Train: {new Date(model.trainedAt).toLocaleDateString('vi-VN')}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<RotateCw className="w-3 h-3" />}
                  onClick={() => handleStartRetrain(model)}
                >
                  Tái Huấn Luyện
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 6. Tab 3: Data Drift Monitor */}
      {activeTab === 'DRIFT' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Giám Sát Độ Trôi Dữ Liệu & Tuổi Mô Hình (Drift & Staleness Monitoring)</h3>
            <p className="text-xs text-slate-500 mt-1">
              Hệ thống tự động theo dõi sai số dự báo MAE theo thời gian thực và phát hiện phân phối tải mới làm giảm chất lượng mô hình.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900">Gradient Boosting Forecaster (v2.0.0)</span>
                <Badge variant="success" size="sm">HEALTHY</Badge>
              </div>
              <p className="text-xs text-slate-600">Độ tuổi mô hình: 7 ngày · Độ trôi sai số: +1.8% (Ngưỡng cảnh báo: 20%). Không phát hiện Concept Drift.</p>
            </div>

            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900">Moving Average Baseline (v1.1)</span>
                <Badge variant="warning" size="sm">STALE (&gt;30 Days)</Badge>
              </div>
              <p className="text-xs text-slate-600">Độ tuổi mô hình: 47 ngày · Cần kích hoạt chạy pipeline tái huấn luyện với chuỗi telemetry mới nhất.</p>
            </div>
          </div>
        </div>
      )}

      {/* 7. Retraining Progress Modal */}
      <Modal
        isOpen={isRetraining}
        onClose={() => setIsRetraining(false)}
        title="Đang Tái Huấn Luyện Mô Hình AI..."
      >
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-center py-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-blue-900 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center font-mono font-bold text-xs text-blue-900">
                {retrainProgress}%
              </div>
            </div>
          </div>
          <div className="text-center space-y-1">
            <p className="text-xs font-bold text-slate-800">
              Trích xuất dữ liệu Telemetry và huấn luyện mạng nơ-ron...
            </p>
            <p className="text-[11px] text-slate-500 font-mono">
              Chronological split 70/15/15 · Tối ưu Adam Optimizer
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
