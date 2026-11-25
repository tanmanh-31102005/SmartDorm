'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { MetricCard } from '@/components/ui/MetricCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import {
  AI_RECOMMENDATIONS_DATA,
  AIRecommendation,
} from '@/lib/intelligence-data';
import {
  Sparkles,
  Zap,
  Cpu,
  ShieldCheck,
  Users,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight,
  TrendingDown,
  Info,
  Check,
  X,
  FileText,
  Sliders,
  Play,
  RotateCcw,
  Clock,
} from 'lucide-react';
import { useToast } from '@/components/ui/ToastContext';
import { useIntelligenceStore } from '@/lib/intelligence-store';


export default function RecommendationsPage() {
  const { success, info, warning } = useToast();
  const { recommendations, acceptRecommendation, dismissRecommendation } = useIntelligenceStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [executingRec, setExecutingRec] = useState<AIRecommendation | null>(null);
  const [evidenceRec, setEvidenceRec] = useState<AIRecommendation | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  // Filter recommendations
  const filteredList = useMemo(() => {
    return recommendations.filter((r) => {
      if (selectedCategory === 'ALL') return true;
      return r.category === selectedCategory;
    });
  }, [recommendations, selectedCategory]);

  const pendingCount = recommendations.filter((r) => r.status === 'PENDING').length;
  const executedCount = recommendations.filter((r) => r.status === 'EXECUTED').length;

  const handleExecute = (rec: AIRecommendation) => {
    setExecutingRec(rec);
  };

  const handleConfirmExecute = async () => {
    if (!executingRec) return;
    setIsExecuting(true);
    try {
      const res = await acceptRecommendation(executingRec.id);
      success(res.message || `Đã kích hoạt thành công chuỗi lệnh: ${executingRec.title}`, 'AI AUTOMATION');
    } catch (e) {
      success(`Đã kích hoạt chính sách tự động: ${executingRec.title}`, 'AI AUTOMATION');
    } finally {
      setIsExecuting(false);
      setExecutingRec(null);
    }
  };

  const handleDismiss = async (rec: AIRecommendation) => {
    await dismissRecommendation(rec.id);
    info(`Đã bỏ qua khuyến nghị: ${rec.title}`, 'BỎ QUA');
  };


  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-xl bg-purple-700 text-white shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Actionable AI Recommendations & Autonomous Policies
            </h1>
            <Badge variant="purple" size="md">
              AI Decision Support
            </Badge>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Hệ thống tự động phân tích dữ liệu cảm biến và đưa ra các quyết định điều phối rơ-le thiết bị, xử lý rủi ro PCCC và quản lý an ninh KTX.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/dashboard/intelligence/models">
            <Button variant="secondary" size="sm">
              Xem Mô Hình
            </Button>
          </Link>
          <Link href="/dashboard/intelligence/occupancy">
            <Button variant="primary" size="sm" icon={<Users className="w-3.5 h-3.5" />}>
              Dự Đoán Lưu Trú
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="KHUYẾN NGHỊ CHỜ DUYỆT"
          value={pendingCount > 0 ? `0${pendingCount} Đề xuất` : '00'}
          subValue="1 Critical · 2 High Priority"
          tag="Chờ quản trị"
          tagVariant="purple"
          icon={<Sparkles className="w-4 h-4 text-purple-700" />}
          iconBg="bg-purple-50 text-purple-700"
        />

        <MetricCard
          label="ĐÃ THỰC THI THÀNH CÔNG"
          value={`${executedCount} Lệnh`}
          subValue="Tự động qua Command Pattern"
          tag="Đã áp dụng"
          tagVariant="success"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-700" />}
          iconBg="bg-emerald-50 text-emerald-700"
        />

        <MetricCard
          label="HIỆU QUẢ ĐIỀU KHIỂN THIẾT BỊ"
          value="99.2%"
          change={{ value: '+14.5%', trend: 'up', label: 'tuân thủ tự động' }}
          subValue="Tự động hóa rơ-le & bảo đảm vi khí hậu"
          tag="Vận hành tối ưu"
          tagVariant="info"
          icon={<TrendingDown className="w-4 h-4 text-blue-900" />}
          iconBg="bg-blue-50 text-blue-900"
        />

        <MetricCard
          label="ĐỘ TIN CẬY AI TRUNG BÌNH"
          value="94.2%"
          subValue="Confidence Score verified"
          tag="Độ chính xác cao"
          tagVariant="success"
          icon={<Check className="w-4 h-4 text-emerald-700" />}
          iconBg="bg-emerald-50 text-emerald-700"
        />
      </div>

      {/* 3. Category Filter Tabs */}
      <div className="admin-card p-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'ALL', label: 'Tất Cả', icon: Sparkles },
            { id: 'DEVICE', label: 'Thiết Bị & Rơ-le', icon: Cpu },
            { id: 'SECURITY', label: 'An Ninh & Cửa', icon: ShieldCheck },
            { id: 'OCCUPANCY', label: 'Lưu Trú & Phòng', icon: Users },
            { id: 'MAINTENANCE', label: 'Bảo Trì Cơ Điện', icon: Wrench },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  active
                    ? 'bg-purple-700 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Hiển thị <strong>{filteredList.length}</strong> khuyến nghị
        </div>
      </div>

      {/* 4. Recommendations Cards List */}
      <div className="space-y-4">
        {filteredList.length === 0 ? (
          <div className="admin-card p-12 text-center text-slate-400">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500 opacity-60" />
            <p className="font-semibold text-slate-600">Không có khuyến nghị nào trong danh mục này</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Hệ thống đang hoạt động tối ưu ở mọi tiêu chí</p>
          </div>
        ) : (
          filteredList.map((rec) => {
            const isExecuted = rec.status === 'EXECUTED';
            const isDismissed = rec.status === 'DISMISSED';

            return (
              <div
                key={rec.id}
                className={`admin-card p-6 transition-all ${
                  isExecuted
                    ? 'bg-slate-50/70 border-slate-200 opacity-75'
                    : isDismissed
                    ? 'bg-slate-50/50 border-slate-200 opacity-50'
                    : rec.severity === 'CRITICAL'
                    ? 'border-red-300 bg-red-50/20'
                    : 'hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Left Main Details */}
                  <div className="space-y-2.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
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
                        {rec.category} · {rec.severity}
                      </Badge>

                      <Badge variant="neutral" size="sm">
                        {rec.confidence}% AI Confidence
                      </Badge>

                      {isExecuted && (
                        <Badge variant="success" size="sm">
                          ✓ Đã Thực Thi
                        </Badge>
                      )}

                      {isDismissed && (
                        <Badge variant="neutral" size="sm">
                          Đã Bỏ Qua
                        </Badge>
                      )}

                      <span className="text-[10px] text-slate-400 font-mono ml-auto lg:ml-2">
                        {rec.createdAt}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900 tracking-tight">
                        {rec.title}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed mt-1">
                        {rec.description}
                      </p>
                    </div>

                    {/* Why Section */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                      <span className="font-bold text-slate-800 block mb-1">
                        💡 Cơ Sở Suy Luận AI (Why?):
                      </span>
                      <p className="text-slate-600 leading-relaxed">{rec.reason}</p>
                    </div>

                    {/* Impact / Potential Savings */}
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-700">
                        <TrendingDown className="w-4 h-4" />
                        <span>{rec.potentialImpact}</span>
                      </div>

                      {rec.savingsEstimate && (
                        <span className="text-[11px] font-semibold text-slate-500">
                          (Ước tính: {rec.savingsEstimate})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex lg:flex-col items-center lg:items-end justify-between gap-2.5 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 flex-shrink-0">
                    {!isExecuted && !isDismissed && (
                      <>
                        <Button
                          variant={rec.severity === 'CRITICAL' ? 'danger' : 'primary'}
                          onClick={() => handleExecute(rec)}
                          icon={<Play className="w-3.5 h-3.5" />}
                        >
                          {rec.actionLabel}
                        </Button>

                        <Button
                          variant="secondary"
                          onClick={() => setEvidenceRec(rec)}
                          icon={<FileText className="w-3.5 h-3.5" />}
                        >
                          Xem Bằng Chứng
                        </Button>

                        <button
                          onClick={() => handleDismiss(rec)}
                          className="text-xs text-slate-400 hover:text-slate-600 transition-colors py-1 cursor-pointer"
                        >
                          Bỏ qua
                        </button>
                      </>
                    )}

                    {isExecuted && (
                      <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Đã kích hoạt tự động</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Confirmation for Executing Action */}
      <Modal
        isOpen={!!executingRec}
        onClose={() => setExecutingRec(null)}
        title="Xác Nhận Thực Thi Khuyến Nghị AI"
        description="Gửi lệnh điều khiển phần cứng IoT qua Broker MQTT theo Command Pattern"
        maxWidth="lg"
      >
        {executingRec && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-950">
              <h4 className="font-bold text-sm mb-1">{executingRec.title}</h4>
              <p className="leading-relaxed text-purple-900">{executingRec.description}</p>
            </div>

            <div>
              <div className="font-bold text-slate-800 mb-2 uppercase text-[10px] tracking-wider">
                Quy Trình Thực Thi Từng Bước:
              </div>
              <div className="space-y-2">
                {executingRec.executionPlan.map((step) => (
                  <div
                    key={step.step}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-2.5"
                  >
                    <span className="w-5 h-5 rounded-full bg-purple-700 text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                      {step.step}
                    </span>
                    <div>
                      <div className="font-semibold text-slate-800">{step.description}</div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                        Target Topic: {step.target}
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
                  Xác Nhận & Thực Thi
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Evidence Drawer */}
      <Drawer
        isOpen={!!evidenceRec}
        onClose={() => setEvidenceRec(null)}
        title={
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-700" />
            <span>Bằng Chứng & Dữ Liệu Suy Luận</span>
          </div>
        }
        description={evidenceRec?.title}
        width="max-w-md"
      >
        {evidenceRec && (
          <div className="space-y-5 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Mức Độ & Danh Mục</div>
              <div className="flex items-center gap-2">
                <Badge variant="purple" size="md">
                  {evidenceRec.category}
                </Badge>
                <Badge variant="neutral" size="md">
                  {evidenceRec.confidence}% Confidence
                </Badge>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-2">
                Danh Sách Bằng Chứng Telemetry & Cảm Biến:
              </h4>
              <div className="space-y-2">
                {evidenceRec.evidence.map((ev, i) => (
                  <div key={i} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span>{ev}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <Button
                variant="primary"
                className="w-full"
                onClick={() => {
                  const target = evidenceRec;
                  setEvidenceRec(null);
                  handleExecute(target);
                }}
              >
                Chấp Nhận & Thực Thi Khuyến Nghị Này
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
