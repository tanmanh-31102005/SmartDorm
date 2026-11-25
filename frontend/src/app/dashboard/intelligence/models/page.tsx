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
  GBM_FEATURE_IMPORTANCES,
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
  Layers,
  ShieldCheck,
  Database,
  BarChart3,
  Clock,
  Award,
  Sliders,
  Check,
  TrendingUp,
  FileCode,
  Gauge,
  Workflow,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { useToast } from '@/components/ui/ToastContext';
import { useIntelligenceStore } from '@/lib/intelligence-store';

export default function ModelPerformancePage() {
  const { success } = useToast();
  const { models, retrainModel } = useIntelligenceStore();
  const [activeTab, setActiveTab] = useState<'CHAMPION_GBM' | 'REGISTRY' | 'DRIFT'>('CHAMPION_GBM');
  const [retrainingModel, setRetrainingModel] = useState<ModelMetric | null>(null);
  const [retrainProgress, setRetrainProgress] = useState(0);
  const [retrainStepLabel, setRetrainStepLabel] = useState('');
  const [isRetraining, setIsRetraining] = useState(false);

  // GBM Champion model from store or default
  const gbmModel = models.find((m) => m.id === 'mdl-gbm-v2') || AI_MODELS_DATA[0];
  const activeModelsCount = models.filter((m) => m.status === 'ACTIVE').length;

  const handleStartRetrain = (model?: ModelMetric) => {
    const targetModel = model || gbmModel;
    setRetrainingModel(targetModel);
    setRetrainProgress(15);
    setRetrainStepLabel('Đang tải 103,680 bản ghi từ smartdorm-wokwi-v1.csv...');
    setIsRetraining(true);

    const steps = [
      { p: 35, text: 'Trích xuất 13 đặc trưng chu kỳ thời gian & cảm biến DHT22...' },
      { p: 65, text: 'Huấn luyện Gradient Boosting Regressor (200 Trees, Huber Loss)...' },
      { p: 85, text: 'Đánh giá độ chính xác (R² = 0.961, MAE = 4.28%) trên tập Test...' },
      { p: 100, text: 'Xuất model artifact telemetry_gbm_v2.0.joblib và đồng bộ Registry!' },
    ];

    let currentStep = 0;
    const interval = setInterval(async () => {
      if (currentStep < steps.length) {
        setRetrainProgress(steps[currentStep].p);
        setRetrainStepLabel(steps[currentStep].text);
        currentStep++;
      } else {
        clearInterval(interval);
        setIsRetraining(false);
        await retrainModel(targetModel.id);
        success(`Đã hoàn tất tái huấn luyện mô hình ${targetModel.name}!`, 'GBM RETRAIN SUCCESS');
      }
    }, 550);
  };

  const getCategoryBadge = (cat: 'TIME' | 'SENSOR' | 'DEVICE') => {
    switch (cat) {
      case 'TIME':
        return <Badge variant="info" size="sm">Thời Gian</Badge>;
      case 'DEVICE':
        return <Badge variant="warning" size="sm">Thiết Bị</Badge>;
      case 'SENSOR':
        return <Badge variant="success" size="sm">Cảm Biến</Badge>;
    }
  };

  const getCategoryColor = (cat: 'TIME' | 'SENSOR' | 'DEVICE') => {
    switch (cat) {
      case 'TIME':
        return 'bg-blue-600';
      case 'DEVICE':
        return 'bg-amber-500';
      case 'SENSOR':
        return 'bg-emerald-500';
    }
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
              AI Champion Model & MLOps Lifecycle
            </h1>
            <Badge variant="success" size="md">
              GBM Champion Active
            </Badge>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Quản lý và giám sát mô hình học máy duy nhất (Champion Gradient Boosting), Feature Importance, Model Registry và Data Drift.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/dashboard/intelligence">
            <Button variant="secondary" size="sm">
              AI Overview
            </Button>
          </Link>
          <Button
            variant="primary"
            size="sm"
            icon={<RotateCw className="w-3.5 h-3.5" />}
            onClick={() => handleStartRetrain(gbmModel)}
          >
            Tái Huấn Luyện GBM
          </Button>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="MÔ HÌNH SẢN XUẤT (ACTIVE)"
          value="GBM Forecaster"
          subValue="Đơn mô hình Champion duy nhất"
          icon={<Award className="w-4 h-4 text-blue-600" />}
          iconBg="bg-blue-50 text-blue-600"
          tag="v2.0 Active"
          tagVariant="info"
        />
        <MetricCard
          label="HỆ SỐ XÁC ĐỊNH R² SCORE"
          value="0.961"
          subValue="Giải thích 96.1% biến thiên tải"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          iconBg="bg-emerald-50 text-emerald-600"
          tag="Rất Cao"
          tagVariant="success"
        />
        <MetricCard
          label="SAI SỐ TUYỆT ĐỐI (MAE)"
          value="4.28%"
          subValue="MAPE 3.69% · RMSE 6.50%"
          icon={<Gauge className="w-4 h-4 text-purple-600" />}
          iconBg="bg-purple-50 text-purple-600"
          tag="Chuẩn Xác"
          tagVariant="neutral"
        />
        <MetricCard
          label="ĐỘ TRỄ SUY LUẬN (LATENCY)"
          value="8.0 ms"
          subValue="Inference siêu tốc trên CPU"
          icon={<Activity className="w-4 h-4 text-emerald-600" />}
          iconBg="bg-emerald-50 text-emerald-600"
          tag="Ultra Fast"
          tagVariant="success"
        />
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('CHAMPION_GBM')}
            className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'CHAMPION_GBM'
                ? 'border-blue-900 text-blue-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Award className="w-4 h-4" />
            Kiến Trúc Mô Hình Champion (GBM)
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
            Giám Sát Độ Trôi Dữ Liệu & Sensor Health
          </button>
        </div>

        <span className="hidden sm:inline-flex text-[11px] text-slate-500 font-medium">
          Dataset: <strong className="text-slate-700 ml-1">smartdorm-wokwi-v1 (103,680 mẫu)</strong>
        </span>
      </div>

      {/* 4. Tab 1: Champion GBM Deep-Dive */}
      {activeTab === 'CHAMPION_GBM' && (
        <div className="space-y-6">
          {/* Executive Champion Hero Banner */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent pointer-events-none" />
            <div className="relative z-10 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-bold border border-blue-400/30 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-300" />
                  Mô Hình Champion Độc Tôn: Gradient Boosting Regressor v2.0
                </div>
                <Badge variant="success" size="sm">
                  Độ Chính Xác R²: 0.9607 (96.1%)
                </Badge>
                <Badge variant="info" size="sm">
                  Độ Trễ Phản Hồi: 8 ms
                </Badge>
              </div>

              <div>
                <h2 className="text-lg font-bold">
                  Kiến Trúc AI Tối Ưu: Gradient Boosting Machine (GBM) với Huber Loss
                </h2>
                <p className="text-xs text-blue-200/90 max-w-3xl leading-relaxed mt-1">
                  Hệ thống SmartDorm sử dụng duy nhất mô hình <strong>Gradient Boosting (GBM)</strong> làm động cơ dự báo phụ tải chính thức.
                  Toàn bộ các mô hình rườm rà trước đây đã được loại bỏ để tập trung tài nguyên, đảm bảo tính ổn định thời gian thực, độ tin cậy tuyệt đối và không phát sinh chi phí hạ tầng GPU.
                </p>
              </div>

              {/* Quick Spec Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10">
                  <div className="text-[10px] text-blue-200 uppercase font-semibold">Tập Dữ Liệu Huấn Luyện</div>
                  <div className="text-sm font-bold text-white mt-0.5">103,680 bản ghi</div>
                  <div className="text-[10px] text-blue-300/80 mt-0.5">smartdorm-wokwi-v1.csv</div>
                </div>
                <div className="p-3 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10">
                  <div className="text-[10px] text-blue-200 uppercase font-semibold">Cây Quyết Định (Trees)</div>
                  <div className="text-sm font-bold text-white mt-0.5">200 Estimators</div>
                  <div className="text-[10px] text-blue-300/80 mt-0.5">Max Depth: 4 · LR: 0.05</div>
                </div>
                <div className="p-3 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10">
                  <div className="text-[10px] text-blue-200 uppercase font-semibold">Hàm Tổn Thất (Loss)</div>
                  <div className="text-sm font-bold text-white mt-0.5">Huber Loss</div>
                  <div className="text-[10px] text-blue-300/80 mt-0.5">Kháng nhiễu đột biến (Outliers)</div>
                </div>
                <div className="p-3 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10">
                  <div className="text-[10px] text-blue-200 uppercase font-semibold">Đặc Trưng Đầu Vào</div>
                  <div className="text-sm font-bold text-white mt-0.5">13 Features</div>
                  <div className="text-[10px] text-blue-300/80 mt-0.5">Thời gian, Vi khí hậu, Thiết bị</div>
                </div>
              </div>
            </div>
          </div>

          {/* 2 Columns: Feature Importances + Hyperparameter Spec */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: 13 Feature Importances */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-900" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Trọng Số Đặc Trưng Mô Hình (GBM 13 Feature Importances)
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-600"></span> Thời Gian</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Thiết Bị</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Cảm Biến</span>
                </div>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Mô hình phân tích tương quan giữa nhịp sinh học theo giờ của sinh viên (chu kỳ Sin/Cos) và trạng thái đóng ngắt rơ-le thiết bị để đưa ra dự báo phụ tải với độ chính xác cao nhất.
              </p>

              <div className="space-y-3 pt-1">
                {GBM_FEATURE_IMPORTANCES.map((item, idx) => {
                  const percent = (item.importance * 100).toFixed(1);
                  return (
                    <div key={item.feature} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] text-slate-400 w-4">#{idx + 1}</span>
                          <span className="font-bold text-slate-800">{item.nameVi}</span>
                          <span className="font-mono text-[10px] text-slate-400">({item.feature})</span>
                          {getCategoryBadge(item.category)}
                        </div>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-xs font-bold text-slate-900">{percent}%</span>
                          <span className="text-[10px] text-slate-400">({item.importance.toFixed(3)})</span>
                        </div>
                      </div>

                      {/* Visual Bar */}
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${getCategoryColor(item.category)}`}
                          style={{ width: `${Math.min(100, item.importance * 350)}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-400 italic pl-6">{item.description}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Technical Hyperparameters & Pipeline Breakdown */}
            <div className="space-y-6">
              {/* Architecture Spec Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Cấu Hình Siêu Tham Số (Hyperparameters)
                  </h3>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-50">
                    <span className="text-slate-500">Framework ML:</span>
                    <span className="font-mono font-bold text-slate-800">Scikit-Learn (Python)</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-50">
                    <span className="text-slate-500">Algorithm:</span>
                    <span className="font-mono font-bold text-slate-800">GradientBoostingRegressor</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-50">
                    <span className="text-slate-500">Number of Estimators:</span>
                    <span className="font-mono font-bold text-blue-900">200 Decision Trees</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-50">
                    <span className="text-slate-500">Loss Function:</span>
                    <span className="font-mono font-bold text-indigo-600">Huber Loss (alpha=0.9)</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-50">
                    <span className="text-slate-500">Max Tree Depth:</span>
                    <span className="font-mono font-bold text-slate-800">4</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-50">
                    <span className="text-slate-500">Learning Rate:</span>
                    <span className="font-mono font-bold text-slate-800">0.05</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-50">
                    <span className="text-slate-500">Min Samples Split:</span>
                    <span className="font-mono font-bold text-slate-800">5</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-50">
                    <span className="text-slate-500">Artifact File:</span>
                    <span className="font-mono text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      energy_gbm_model.joblib
                    </span>
                  </div>
                </div>
              </div>

              {/* End-to-End Pipeline Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Workflow className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Quy Trình Pipeline (MLOps Flow)
                  </h3>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
                    <div>
                      <div className="font-bold text-slate-800">Thu Thập Dữ Liệu Cục Bộ</div>
                      <div className="text-[11px] text-slate-500">Đọc dataset 103,680 mẫu Wokwi Digital Twin không phụ thuộc API ngoài.</div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
                    <div>
                      <div className="font-bold text-slate-800">Trích Xuất 13 Đặc Trưng</div>
                      <div className="text-[11px] text-slate-500">Tính toán Sin/Cos chu kỳ, chuẩn hóa min-max vi khí hậu và trạng thái rơ-le.</div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
                    <div>
                      <div className="font-bold text-slate-800">Dự Báo & Ước Lượng Dải Tin Cậy</div>
                      <div className="text-[11px] text-slate-500">Suy luận tỷ lệ tải thiết bị (%) và vi khí hậu kèm dải tin cậy ±10% cho Decision Support Engine.</div>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full justify-center"
                    icon={<RotateCw className="w-3.5 h-3.5" />}
                    onClick={() => handleStartRetrain(gbmModel)}
                  >
                    Kích Hoạt Tái Huấn Luyện GBM
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Tab 2: Model Registry */}
      {activeTab === 'REGISTRY' && (
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-900" />
              <span>Danh mục <strong>{models.length} mô hình AI sản xuất</strong> đang hoạt động trên hệ thống SmartDorm.</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">Tất cả mô hình đã được tinh gọn và kiểm thử an toàn.</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {models.map((model) => (
              <div
                key={model.id}
                className={`bg-white rounded-2xl border p-5 shadow-xs space-y-4 transition-all ${
                  model.id === 'mdl-gbm-v2' ? 'border-blue-300 ring-1 ring-blue-100' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{model.name}</h3>
                      {model.id === 'mdl-gbm-v2' && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          CHAMPION
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">{model.code} · {model.version}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 text-slate-600 border border-slate-200">
                    <Cpu className="w-4 h-4" />
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed min-h-[36px]">
                  {model.description}
                </p>

                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100 text-center font-mono">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-sans">Độ Trễ</div>
                    <div className="text-xs font-bold text-slate-800">{model.latencyMs} ms</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-sans">{model.f1Score ? 'F1-Score' : 'R² Score'}</div>
                    <div className="text-xs font-bold text-emerald-600">{model.f1Score ? model.f1Score.toFixed(3) : model.r2?.toFixed(3) || '0.961'}</div>
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
        </div>
      )}

      {/* 6. Tab 3: Data Drift & Sensor Health */}
      {activeTab === 'DRIFT' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Giám Sát Độ Trôi Dữ Liệu & Sức Khỏe Telemetry (Drift & Sensor Monitor)</h3>
            <p className="text-xs text-slate-500 mt-1">
              Hệ thống liên tục theo dõi sai số dự báo MAE của mô hình Champion GBM và phân phối dữ liệu cảm biến DHT22, MQ-2 từ thiết bị IoT.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900">Gradient Boosting Forecaster (GBM)</span>
                <Badge variant="success" size="sm">HEALTHY</Badge>
              </div>
              <p className="text-xs text-slate-600">
                Độ tuổi mô hình: 18 ngày · Độ lệch sai số MAE: <strong>+1.2%</strong> (Ngưỡng cảnh báo: 15%). Phân phối phụ tải ổn định, không có Concept Drift.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900">Isolation Forest Anomaly</span>
                <Badge variant="success" size="sm">OPTIMAL</Badge>
              </div>
              <p className="text-xs text-slate-600">
                Tỷ lệ báo động giả (False Positive Rate): <strong>0.38%</strong>. Ngưỡng phân tách kẹt rơ-le và rò rỉ khí gas duy trì tin cậy 96.1%.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900">ESP32 Telemetry Pipeline</span>
                <Badge variant="info" size="sm">ACTIVE</Badge>
              </div>
              <p className="text-xs text-slate-600">
                Tỷ lệ nhận gói tin DHT22 & MQ-2: <strong>100%</strong>. Độ trễ luồng MQTT: <strong>12 ms</strong>. Cảm biến hoạt động ổn định.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 7. Retraining Progress Modal */}
      <Modal
        isOpen={isRetraining}
        onClose={() => setIsRetraining(false)}
        title="Đang Tái Huấn Luyện Mô Hình Champion GBM..."
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
          <div className="text-center space-y-1.5 px-4">
            <p className="text-xs font-bold text-slate-800">
              {retrainStepLabel || 'Đang thực thi pipeline tái huấn luyện Gradient Boosting Machine...'}
            </p>
            <p className="text-[11px] text-slate-500 font-mono">
              Dataset: smartdorm-wokwi-v1.csv · 200 Estimators · Huber Loss · R² ~0.961
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
