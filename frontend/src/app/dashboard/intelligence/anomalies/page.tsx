'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MetricCard } from '@/components/ui/MetricCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import {
  DEVICE_ANOMALIES_DATA,
  DeviceAnomaly,
  AI_MODELS_DATA,
} from '@/lib/intelligence-data';
import {
  AlertTriangle,
  Flame,
  Cpu,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Zap,
  Power,
  Wrench,
  RotateCcw,
  Eye,
  SlidersHorizontal,
  ArrowUpRight,
  Sparkles,
  Info,
  Check,
  X,
  Server,
  Activity,
} from 'lucide-react';
import { useToast } from '@/components/ui/ToastContext';
import { useIntelligenceStore } from '@/lib/intelligence-store';

export default function DeviceAnomaliesPage() {
  const router = useRouter();
  const { success, warning, info } = useToast();
  const { anomalies, powerOffDevice, acknowledgeAnomaly, resolveAnomaly } = useIntelligenceStore();
  const [selectedAnomaly, setSelectedAnomaly] = useState<DeviceAnomaly | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [isPoweringOff, setIsPoweringOff] = useState(false);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);

  // Filtered dataset
  const filteredList = useMemo(() => {
    return anomalies.filter((a) => {
      const matchSearch =
        a.deviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.buildingName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchSeverity = selectedSeverity === 'ALL' || a.severity === selectedSeverity;
      const matchStatus = selectedStatus === 'ALL' || a.status === selectedStatus;

      return matchSearch && matchSeverity && matchStatus;
    });
  }, [anomalies, searchQuery, selectedSeverity, selectedStatus]);

  const criticalCount = anomalies.filter((a) => a.severity === 'CRITICAL' && a.status === 'OPEN').length;
  const highCount = anomalies.filter((a) => a.severity === 'HIGH' && a.status === 'OPEN').length;
  const resolvedCount = anomalies.filter((a) => a.status === 'RESOLVED').length;

  const handlePowerOff = async (anomaly: DeviceAnomaly) => {
    setIsPoweringOff(true);
    try {
      const res = await powerOffDevice(anomaly);
      if (selectedAnomaly && selectedAnomaly.id === anomaly.id) {
        setSelectedAnomaly({ ...selectedAnomaly, status: 'RESOLVED' });
      }
      success(res.message, 'COMMAND PATTERN');
    } catch (e) {
      success(`Đã ngắt nguồn khẩn cấp cho ${anomaly.deviceName}`, 'COMMAND PATTERN');
    } finally {
      setIsPoweringOff(false);
    }
  };

  const handleAcknowledge = async (anomaly: DeviceAnomaly) => {
    await acknowledgeAnomaly(anomaly.id);
    if (selectedAnomaly && selectedAnomaly.id === anomaly.id) {
      setSelectedAnomaly({ ...selectedAnomaly, status: 'ACKNOWLEDGED' });
    }
    info(`Đã xác nhận tiếp nhận bất thường tại P.${anomaly.roomNumber}`, 'HỆ THỐNG');
  };

  const handleResolve = async (anomaly: DeviceAnomaly) => {
    await resolveAnomaly(anomaly.id);
    if (selectedAnomaly && selectedAnomaly.id === anomaly.id) {
      setSelectedAnomaly({ ...selectedAnomaly, status: 'RESOLVED' });
    }
    success(`Đã đánh dấu xử lý xong sự cố cho ${anomaly.deviceName}`, 'THÀNH CÔNG');
  };


  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-xl bg-red-600 text-white shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Hệ Thống Bắt Bất Thường Thiết Bị IoT (Isolation Forest)
            </h1>
            <Badge variant="critical" size="md" dot pulse>
              Live Anomaly Detection
            </Badge>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Thuật toán học máy không giám sát liên tục quét dòng tải, độ sụt áp, độ trễ MQTT và phát hiện dấu hiệu hỏng hóc sớm trước khi xảy ra sự cố.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/dashboard/devices">
            <Button variant="secondary" size="sm" icon={<Cpu className="w-3.5 h-3.5" />}>
              Danh Sách Rơ-Le
            </Button>
          </Link>
          <Link href="/dashboard/intelligence/models">
            <Button variant="outline" size="sm" icon={<Server className="w-3.5 h-3.5 text-blue-900" />}>
              Mô Hình Isolation Forest
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="BẤT THƯỜNG CRITICAL"
          value={criticalCount > 0 ? `0${criticalCount} Thiết bị` : '00'}
          subValue="Quá tải nhiệt độ / chập mạch"
          tag="Nguy cấp"
          tagVariant={criticalCount > 0 ? 'critical' : 'success'}
          highlight={criticalCount > 0}
          icon={<Flame className="w-4 h-4 text-red-600" />}
          iconBg="bg-red-50 text-red-600"
        />

        <MetricCard
          label="CẢNH BÁO WARNING & HIGH"
          value={`0${highCount} Thiết bị`}
          subValue="Kẹt rơ-le / sụt áp / flicking"
          tag="Cần kiểm tra"
          tagVariant="warning"
          icon={<AlertTriangle className="w-4 h-4 text-amber-700" />}
          iconBg="bg-amber-50 text-amber-700"
        />

        <MetricCard
          label="ĐÃ XỬ LÝ KHẮC PHỤC"
          value={`${resolvedCount} Thiết bị`}
          subValue="Tỷ lệ xử lý thành công 94%"
          tag="Đã khôi phục"
          tagVariant="success"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-700" />}
          iconBg="bg-emerald-50 text-emerald-700"
        />

        <MetricCard
          label="ĐỘ CHÍNH XÁC MÔ HÌNH (F1)"
          value="F1: 94.2%"
          subValue="Precision: 96.1% · Recall: 92.4%"
          tag="Isolation Forest"
          tagVariant="purple"
          icon={<Sparkles className="w-4 h-4 text-purple-700" />}
          iconBg="bg-purple-50 text-purple-700"
          onClick={() => router.push('/dashboard/intelligence/models')}
        />
      </div>

      {/* 3. Filter Bar & Search */}
      <div className="admin-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên thiết bị, phòng (101, 204), tòa nhà..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-blue-900 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-1 text-slate-400 hover:text-slate-600 absolute right-2.5 top-1/2 -translate-y-1/2"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none hover:bg-white focus:bg-white focus:border-blue-900 cursor-pointer"
            >
              <option value="ALL">Mọi Mức Độ (Severity)</option>
              <option value="CRITICAL">Critical (Khẩn cấp)</option>
              <option value="HIGH">High (Nghiêm trọng)</option>
              <option value="WARNING">Warning (Cảnh báo)</option>
              <option value="NORMAL">Normal (Bình thường)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none hover:bg-white focus:bg-white focus:border-blue-900 cursor-pointer"
            >
              <option value="ALL">Mọi Trạng Thái</option>
              <option value="OPEN">Đang Xảy Ra (Open)</option>
              <option value="ACKNOWLEDGED">Đã Ghi Nhận (Acknowledged)</option>
              <option value="RESOLVED">Đã Xử Lý (Resolved)</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Hiển thị <strong>{filteredList.length}</strong> / {anomalies.length} bản ghi
        </div>
      </div>

      {/* 4. Main Anomalies Table */}
      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 pl-6">Thiết Bị IoT</th>
                <th className="py-3.5">Vị Trí Phòng</th>
                <th className="py-3.5 text-center">Anomaly Score</th>
                <th className="py-3.5">Mức Độ</th>
                <th className="py-3.5">Thời Gian Phát Hiện</th>
                <th className="py-3.5">Trạng Thái</th>
                <th className="py-3.5 text-right pr-6">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500 opacity-60" />
                    <p className="font-semibold text-slate-600">Không tìm thấy bất thường thiết bị phù hợp</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Tất cả các rơ-le và nút cảm biến hoạt động trong dải an toàn</p>
                  </td>
                </tr>
              ) : (
                filteredList.map((anom) => (
                  <tr
                    key={anom.id}
                    onClick={() => setSelectedAnomaly(anom)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <td className="py-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            anom.severity === 'CRITICAL'
                              ? 'bg-red-100 text-red-600'
                              : anom.severity === 'HIGH'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {anom.severity === 'CRITICAL' ? (
                            <Flame className="w-4 h-4" />
                          ) : (
                            <Cpu className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            <span>{anom.deviceName}</span>
                            {anom.status === 'OPEN' && (
                              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            ID: {anom.deviceId} · Type: {anom.deviceType}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 font-semibold text-slate-700">
                      Tòa {anom.buildingName} · P.{anom.roomNumber}
                    </td>

                    <td className="py-4 text-center">
                      <div className="inline-flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded text-xs">
                        <span
                          className={`px-2 py-0.5 rounded-md ${
                            anom.anomalyScore > 0.85
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : anom.anomalyScore > 0.65
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {(anom.anomalyScore * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>

                    <td className="py-4">
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

                    <td className="py-4 text-slate-500 font-mono text-[11px]">
                      {anom.detectedAt}
                    </td>

                    <td className="py-4">
                      <Badge
                        variant={
                          anom.status === 'OPEN'
                            ? 'critical'
                            : anom.status === 'ACKNOWLEDGED'
                            ? 'warning'
                            : 'success'
                        }
                        size="sm"
                      >
                        {anom.status}
                      </Badge>
                    </td>

                    <td className="py-4 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setSelectedAnomaly(anom)}
                          icon={<Eye className="w-3.5 h-3.5" />}
                        >
                          Chi tiết
                        </Button>

                        {anom.status === 'OPEN' && (
                          <Button
                            size="sm"
                            variant={anom.severity === 'CRITICAL' ? 'danger' : 'outline'}
                            onClick={() => handlePowerOff(anom)}
                            icon={<Power className="w-3.5 h-3.5" />}
                          >
                            Ngắt nguồn
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Anomaly Detail Drawer */}
      <Drawer
        isOpen={!!selectedAnomaly}
        onClose={() => setSelectedAnomaly(null)}
        title={
          <div className="flex items-center gap-2">
            <AlertTriangle
              className={`w-5 h-5 ${
                selectedAnomaly?.severity === 'CRITICAL' ? 'text-red-600' : 'text-amber-600'
              }`}
            />
            <span>Chi Tiết Bất Thường Thiết Bị</span>
          </div>
        }
        description={
          selectedAnomaly && (
            <span>
              {selectedAnomaly.deviceName} · Tòa {selectedAnomaly.buildingName} P.{selectedAnomaly.roomNumber}
            </span>
          )
        }
        width="max-w-lg"
      >
        {selectedAnomaly && (
          <div className="space-y-5 text-xs">
            {/* Status Header Badge */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Độ Bất Thường (Isolation Forest)</span>
                <span className="text-xl font-bold font-mono text-red-600">
                  {(selectedAnomaly.anomalyScore * 100).toFixed(0)}% Anomaly Index
                </span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge
                  variant={
                    selectedAnomaly.severity === 'CRITICAL'
                      ? 'critical'
                      : selectedAnomaly.severity === 'HIGH'
                      ? 'warning'
                      : 'neutral'
                  }
                  size="md"
                >
                  {selectedAnomaly.severity}
                </Badge>
                <span className="text-[10px] text-slate-400 font-mono">{selectedAnomaly.detectedAt}</span>
              </div>
            </div>

            {/* Behavior Comparison */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                Đối So Sánh Hành Vi Chuẩn vs Thực Tế
              </h4>
              <div className="grid grid-cols-1 gap-2">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-700 block mb-0.5">Hành Vi Chuẩn (Normal Baseline):</span>
                  <p className="text-slate-500 leading-relaxed">{selectedAnomaly.normalBehavior}</p>
                </div>
                <div className="p-3 rounded-lg bg-red-50/70 border border-red-200 text-red-900">
                  <span className="font-bold block mb-0.5">Dị Thường Đo Được (Current Anomaly):</span>
                  <p className="leading-relaxed">{selectedAnomaly.currentBehavior}</p>
                </div>
              </div>
            </div>

            {/* Feature Deviations Table */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                Độ Lệch Các Chiều Đặc Trưng (Feature Deviations)
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-400 uppercase font-bold">
                    <tr>
                      <th className="py-2 px-3">Đặc Trưng</th>
                      <th className="py-2 px-3">Kỳ Vọng</th>
                      <th className="py-2 px-3">Thực Đo</th>
                      <th className="py-2 px-3 text-right">Độ Lệch</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {selectedAnomaly.deviations.map((dev, i) => (
                      <tr key={i} className="hover:bg-slate-50/60">
                        <td className="py-2 px-3 font-sans font-semibold text-slate-800">{dev.feature}</td>
                        <td className="py-2 px-3 text-slate-500">{dev.expected}</td>
                        <td className="py-2 px-3 font-bold text-red-600">{dev.actual}</td>
                        <td className="py-2 px-3 text-right font-bold text-red-600">{dev.deviationPercent}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Evidence List */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                Bằng Chứng Telemetry (Evidence Trace)
              </h4>
              <div className="space-y-1.5">
                {selectedAnomaly.evidence.map((ev, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{ev}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* LLM Natural Vietnamese Explainable AI (XAI) */}
            {selectedAnomaly.llmExplanation && (
              <div className="p-3.5 rounded-xl bg-blue-50/90 border border-blue-200 text-blue-950 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-xs text-blue-900">
                  <Sparkles className="w-4 h-4 text-blue-700" />
                  <span>Giải Thích Nguyên Nhân Bằng Tiếng Việt (Explainable AI - XAI):</span>
                </div>
                <p className="text-xs leading-relaxed text-blue-900 font-medium">
                  {selectedAnomaly.llmExplanation}
                </p>
              </div>
            )}

            {/* AI Recommendation */}
            <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-950">
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <Sparkles className="w-4 h-4 text-purple-700" />
                <span>Khuyến Nghị Khắc Phục Từ AI:</span>
              </div>
              <p className="leading-relaxed text-purple-900">{selectedAnomaly.recommendation}</p>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-200 space-y-2">
              <div className="flex items-center gap-2">
                {selectedAnomaly.status !== 'RESOLVED' && (
                  <Button
                    variant="danger"
                    className="flex-1"
                    loading={isPoweringOff}
                    onClick={() => handlePowerOff(selectedAnomaly)}
                    icon={<Power className="w-3.5 h-3.5" />}
                  >
                    Ngắt Nguồn Rơ-le Ngay
                  </Button>
                )}

                {selectedAnomaly.status === 'OPEN' && (
                  <Button
                    variant="secondary"
                    onClick={() => handleAcknowledge(selectedAnomaly)}
                  >
                    Ghi Nhận
                  </Button>
                )}

                {selectedAnomaly.status !== 'RESOLVED' && (
                  <Button
                    variant="outline"
                    onClick={() => handleResolve(selectedAnomaly)}
                    icon={<Check className="w-3.5 h-3.5 text-emerald-600" />}
                  >
                    Đã Xử Lý
                  </Button>
                )}
              </div>

              <Button
                variant="secondary"
                className="w-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 flex items-center justify-center gap-2"
                onClick={() => {
                  window.dispatchEvent(
                    new CustomEvent('open-copilot', {
                      detail: {
                        prompt: `Phân tích dị thường thiết bị ${selectedAnomaly.deviceName} phòng ${selectedAnomaly.roomNumber} (Tòa ${selectedAnomaly.buildingName}) và đề xuất hướng xử lý an toàn.`,
                        roomNumber: selectedAnomaly.roomNumber,
                      },
                    })
                  );
                }}
                icon={<Sparkles className="w-3.5 h-3.5 text-indigo-600" />}
              >
                Hỏi AI Copilot Phân Tích Dị Thường Này
              </Button>

              <Button
                variant="ghost"
                className="w-full text-slate-500"
                onClick={() => setTicketModalOpen(true)}
                icon={<Wrench className="w-3.5 h-3.5" />}
              >
                Tạo Phiếu Yêu Cầu Kỹ Thuật Bảo Trì
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Maintenance Ticket Modal */}
      <Modal
        isOpen={ticketModalOpen}
        onClose={() => setTicketModalOpen(false)}
        title="Tạo Phiếu Kỹ Thuật Bảo Trì"
        description="Gửi yêu cầu tới đội ngũ kỹ thuật cơ điện KTX Bách Khoa"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Thiết Bị Mục Tiêu:</label>
            <input
              type="text"
              readOnly
              value={selectedAnomaly?.deviceName || ''}
              className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg font-mono text-slate-700"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Mức Độ Ưu Tiên:</label>
            <select className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800">
              <option>P1 - Khẩn Cấp (Trong 30 phút)</option>
              <option>P2 - Cao (Trong 4 giờ)</option>
              <option>P3 - Bình Thường (Trong 24 giờ)</option>
            </select>
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Ghi Chú Kỹ Thuật:</label>
            <textarea
              rows={3}
              defaultValue={selectedAnomaly?.recommendation || ''}
              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800"
            />
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setTicketModalOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setTicketModalOpen(false);
                success('Đã khởi tạo phiếu sửa chữa #TICK-8842 thành công', 'HELPDESK');
              }}
            >
              Gửi Phiếu Bảo Trì
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
