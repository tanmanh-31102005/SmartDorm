'use client';
import { useState } from 'react';
import { MetricCard } from '@/components/ui/MetricCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastContext';
import { 
  FileText, 
  Download, 
  Calendar, 
  Building2, 
  CheckCircle2, 
  Zap, 
  ShieldCheck, 
  CreditCard, 
  Flame, 
  Cpu,
  FileSpreadsheet,
  FileType
} from 'lucide-react';

export default function ReportsPage() {
  const { success } = useToast();
  const [selectedBuilding, setSelectedBuilding] = useState('ALL');
  const [dateRange, setDateRange] = useState('7d');
  const [generating, setGenerating] = useState<string | null>(null);

  const reportTemplates = [
    {
      id: 'rep-energy',
      title: 'Báo Cáo Tiêu Thụ Điện Năng Toàn Campus (kWh)',
      description: 'Tổng hợp sản lượng điện tiêu thụ từng phòng, từng tòa nhà, phân tích phụ tải giờ cao điểm và ước tính chi phí hóa đơn EVN.',
      icon: Zap,
      iconColor: 'bg-blue-50 text-blue-900',
      frequency: 'Theo tuần / Tháng',
      records: '18,420 kWh',
    },
    {
      id: 'rep-security',
      title: 'Báo Cáo Kiểm Soát An Ninh & Thẻ RFID',
      description: 'Nhật ký chi tiết mọi lượt quẹt thẻ sinh viên, thống kê tỷ lệ từ chối thẻ, phát hiện xâm nhập và cảnh báo mở cửa trái phép.',
      icon: CreditCard,
      iconColor: 'bg-emerald-50 text-emerald-700',
      frequency: 'Hàng ngày',
      records: '1,284 lượt quẹt',
    },
    {
      id: 'rep-incident',
      title: 'Báo Cáo Sự Cố & Kích Hoạt Strategy Pattern',
      description: 'Tổng kết các vụ việc cảnh báo khói, rò rỉ khí gas MQ-2 và các hành động cứu nạn tự động (mở khóa, còi báo động) đã thực thi.',
      icon: Flame,
      iconColor: 'bg-red-50 text-red-600',
      frequency: 'Theo sự cố',
      records: '03 sự cố ghi nhận',
    },
    {
      id: 'rep-device',
      title: 'Báo Cáo Độ Tin Cậy & Sức Khỏe Thiết Bị IoT',
      description: 'Đánh giá tỷ lệ uptime 1,186 node vi điều khiển ESP32, rơ-le đèn/quạt và cảnh báo các thiết bị offline cần bảo trì.',
      icon: Cpu,
      iconColor: 'bg-purple-50 text-purple-700',
      frequency: 'Hàng tháng',
      records: '98.4% Online',
    },
  ];

  function handleExport(reportId: string, format: 'CSV' | 'PDF') {
    setGenerating(`${reportId}_${format}`);
    setTimeout(() => {
      setGenerating(null);
      success(`Đã xuất báo cáo [${format}] thành công! File đã sẵn sàng tải về.`, 'Xuất Báo Cáo');
    }, 800);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Trung Tâm Báo Cáo Định Kỳ & Xuất Dữ Liệu</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Tạo và xuất báo cáo tự động cho Ban Giám Hiệu, Phòng Quản Lý KTX và cơ quan an toàn phòng cháy chữa cháy.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="neutral" size="md">
            Chuẩn xuất file: CSV / Excel & PDF
          </Badge>
        </div>
      </div>

      {/* Global Filter Bar */}
      <div className="admin-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 mr-2">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span>Khu Vực:</span>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {['ALL', 'A', 'B', 'C'].map((b) => (
              <button
                key={b}
                onClick={() => setSelectedBuilding(b)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  selectedBuilding === b
                    ? 'bg-blue-900 text-white font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {b === 'ALL' ? 'Toàn bộ Campus' : `Tòa ${b}`}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {[
              { id: '24h', label: 'Hôm nay' },
              { id: '7d', label: '7 Ngày qua' },
              { id: '30d', label: 'Tháng này' },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => setDateRange(d.id)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  dateRange === d.id
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Report Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportTemplates.map((rep) => {
          const Icon = rep.icon;
          const isGenCsv = generating === `${rep.id}_CSV`;
          const isGenPdf = generating === `${rep.id}_PDF`;

          return (
            <div
              key={rep.id}
              className="admin-card p-6 flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className={`p-2.5 rounded-xl ${rep.iconColor} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <Badge variant="neutral" size="sm">
                    {rep.frequency}
                  </Badge>
                </div>

                <h3 className="font-bold text-sm text-slate-900 leading-tight mb-1.5">
                  {rep.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {rep.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">
                  Tổng hợp: <strong className="text-slate-900">{rep.records}</strong>
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={isGenCsv}
                    onClick={() => handleExport(rep.id, 'CSV')}
                    icon={<FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />}
                  >
                    CSV / Excel
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={isGenPdf}
                    onClick={() => handleExport(rep.id, 'PDF')}
                    icon={<FileType className="w-3.5 h-3.5 text-red-600" />}
                  >
                    PDF
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
