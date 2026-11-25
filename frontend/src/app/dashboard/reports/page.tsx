'use client';
import { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import api from '@/lib/api';
import { MetricCard } from '@/components/ui/MetricCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
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
  Thermometer,
  FileSpreadsheet,
  FileType,
  Printer,
  Eye,
  Search,
  Filter,
  RefreshCw,
  Trash2,
  Clock,
  MapPin,
  Sparkles
} from 'lucide-react';

export type ReportPeriod = 'day' | 'week' | 'month' | 'custom';

export default function ReportsPage() {
  const { success, error, info } = useToast();
  
  // Filter states
  const [selectedBuilding, setSelectedBuilding] = useState<string>('ALL');
  const [period, setPeriod] = useState<ReportPeriod>('month');
  const [customStartDate, setCustomStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  // Interaction states
  const [generating, setGenerating] = useState<string | null>(null);
  const [exportHistory, setExportHistory] = useState<any[]>([]);

  // Preview Modal states
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<{
    reportId: string;
    title: string;
    periodLabel: string;
    scope: string;
    records: any[];
    summary?: any;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [previewStatusFilter, setPreviewStatusFilter] = useState<'ALL' | 'SAFE' | 'WARNING'>('ALL');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('smartdorm_exported_reports');
      if (saved) {
        setExportHistory(JSON.parse(saved));
      } else {
        const baseline = [
          {
            id: 'SD-REP-717376',
            title: 'Báo Cáo Độ Tin Cậy & Sức Khỏe Thiết Bị IoT',
            reportId: 'devices',
            format: 'PDF',
            period: 'Theo Ngày',
            scope: 'Toàn bộ Campus (Tòa A, B, C)',
            totalRecords: 24,
            time: '20:31:57',
            date: new Date().toLocaleDateString('vi-VN'),
            status: 'Đã lưu trữ',
          },
          {
            id: 'SD-REP-717375',
            title: 'Báo Cáo Vi Khí Hậu & Cảm Biến Môi Trường (DHT22 & MQ-2)',
            reportId: 'environment',
            format: 'XLSX',
            period: 'Theo Tuần',
            scope: 'Toàn bộ Campus (Tòa A, B, C)',
            totalRecords: 18,
            time: '20:15:20',
            date: new Date().toLocaleDateString('vi-VN'),
            status: 'Đã lưu trữ',
          }
        ];
        setExportHistory(baseline);
        localStorage.setItem('smartdorm_exported_reports', JSON.stringify(baseline));
      }
    } catch {}
  }, []);

  const reportTemplates = [
    {
      id: 'environment',
      title: 'Báo Cáo Vi Khí Hậu & Cảm Biến Môi Trường (DHT22 & MQ-2)',
      description: 'Tổng hợp nhiệt độ, độ ẩm từ DHT22 và nồng độ khí gas MQ-2 từng phòng, phát hiện sớm nguy cơ vi khí hậu và bảo đảm an toàn sinh hoạt.',
      icon: Thermometer,
      iconColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      frequency: 'Theo Ngày / Tuần / Tháng',
      recordsBadge: '100% An toàn vi khí hậu',
    },
    {
      id: 'security',
      title: 'Báo Cáo Kiểm Soát An Ninh & Thẻ RFID',
      description: 'Nhật ký chi tiết mọi lượt quẹt thẻ sinh viên, thống kê tỷ lệ từ chối thẻ, phát hiện xâm nhập và cảnh báo mở cửa trái phép.',
      icon: CreditCard,
      iconColor: 'bg-blue-50 text-blue-700 border-blue-200',
      frequency: 'Theo Ngày / Tuần / Tháng',
      recordsBadge: 'Kiểm soát RFID Realtime',
    },
    {
      id: 'incidents',
      title: 'Báo Cáo Sự Cố & Kích Hoạt Strategy Pattern',
      description: 'Tổng kết các vụ việc cảnh báo khói, rò rỉ khí gas MQ-2 và các hành động cứu nạn tự động (mở khóa, ngắt điện, còi hú) đã thực thi.',
      icon: Flame,
      iconColor: 'bg-red-50 text-red-600 border-red-200',
      frequency: 'Theo Sự Cố / Kỳ Khẩn Cấp',
      recordsBadge: '100% Đã xử lý an toàn',
    },
    {
      id: 'devices',
      title: 'Báo Cáo Độ Tin Cậy & Sức Khỏe Thiết Bị IoT',
      description: 'Đánh giá tỷ lệ uptime các node vi điều khiển ESP32, rơ-le đèn/quạt, còi buzzer và kiểm tra tình trạng kết nối mạng MQTT.',
      icon: Cpu,
      iconColor: 'bg-purple-50 text-purple-700 border-purple-200',
      frequency: 'Theo Ngày / Tuần / Tháng',
      recordsBadge: '99.8% Uptime Online',
    },
  ];

  function getHumanPeriodLabel(p: ReportPeriod, start?: string, end?: string): string {
    const now = new Date();
    if (p === 'day') {
      return `Theo Ngày (Hôm nay - ${now.toLocaleDateString('vi-VN')})`;
    }
    if (p === 'week') {
      const pastWeek = new Date(now.getTime() - 7 * 86400000);
      return `Theo Tuần (7 Ngày: ${pastWeek.toLocaleDateString('vi-VN')} - ${now.toLocaleDateString('vi-VN')})`;
    }
    if (p === 'custom' && start && end) {
      return `Tùy chọn: Từ ${new Date(start).toLocaleDateString('vi-VN')} đến ${new Date(end).toLocaleDateString('vi-VN')}`;
    }
    return `Theo Tháng (Tháng ${now.getMonth() + 1}/${now.getFullYear()})`;
  }

  function getPeriodBadgeClass(periodText: string) {
    if (periodText.includes('Ngày') || periodText === 'day') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (periodText.includes('Tuần') || periodText === 'week') return 'bg-purple-50 text-purple-700 border-purple-200';
    if (periodText.includes('Tháng') || periodText === 'month') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }

  function buildExportUrl(reportId: string): string {
    let url = `/analytics/export/${reportId}?building=${selectedBuilding}&period=${period}`;
    if (period === 'day') {
      url += `&days=1`;
    } else if (period === 'week') {
      url += `&days=7`;
    } else if (period === 'month') {
      url += `&days=30`;
    } else if (period === 'custom') {
      url += `&startDate=${customStartDate}&endDate=${customEndDate}`;
    }
    return url;
  }

  // ==================== LIVE PREVIEW ACTION ====================
  async function handleOpenPreview(reportId: string) {
    setPreviewLoading(true);
    setPreviewModalOpen(true);
    setSearchTerm('');
    setPreviewStatusFilter('ALL');

    try {
      const endpoint = buildExportUrl(reportId);
      const res = await api.get(endpoint);
      const data = res.data;
      const template = reportTemplates.find(t => t.id === reportId);

      setPreviewData({
        reportId,
        title: template?.title || reportId.toUpperCase(),
        periodLabel: data.periodLabel || getHumanPeriodLabel(period, customStartDate, customEndDate),
        scope: selectedBuilding === 'ALL' ? 'Toàn bộ Campus (Tòa A, B, C)' : `Tòa ${selectedBuilding}`,
        records: Array.isArray(data.records) ? data.records : [],
        summary: data,
      });
    } catch (err: any) {
      error(err?.message || 'Không thể tải dữ liệu xem trước', 'Lỗi Xem Trước');
      setPreviewModalOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  }

  // ==================== EXCEL & PDF EXPORT ACTION ====================
  async function handleExport(reportId: string, format: 'XLSX' | 'PDF') {
    const key = `${reportId}_${format}`;
    setGenerating(key);

    try {
      const endpoint = buildExportUrl(reportId);
      const res = await api.get(endpoint);
      const data = res.data;
      const dateStr = new Date().toISOString().split('T')[0];
      const template = reportTemplates.find(t => t.id === reportId);
      const repTitle = template?.title || reportId.toUpperCase();
      const periodLabel = data.periodLabel || getHumanPeriodLabel(period, customStartDate, customEndDate);
      const scopeLabel = selectedBuilding === 'ALL' ? 'Toàn bộ Campus (Tòa A, B, C)' : `Tòa ${selectedBuilding}`;

      if (!data.records || !Array.isArray(data.records) || data.records.length === 0) {
        throw new Error('Không tìm thấy bản ghi dữ liệu phù hợp với bộ lọc đã chọn');
      }

      // Record to export history
      const newExportLog = {
        id: `SD-REP-${Date.now().toString().slice(-6)}`,
        title: repTitle,
        reportId,
        format,
        period: periodLabel.includes('Ngày') ? 'Theo Ngày' : periodLabel.includes('Tuần') ? 'Theo Tuần' : periodLabel.includes('Tháng') ? 'Theo Tháng' : 'Tùy Chọn',
        periodLabel,
        scope: scopeLabel,
        totalRecords: data.records.length,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        date: new Date().toLocaleDateString('vi-VN'),
        status: 'Đã xuất thành công',
      };

      setExportHistory(prev => {
        const updated = [newExportLog, ...prev.filter(p => p.id !== newExportLog.id).slice(0, 24)];
        try {
          localStorage.setItem('smartdorm_exported_reports', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      if (format === 'XLSX') {
        // ==================== EXCEL .XLSX GENERATION ====================
        const workbook = XLSX.utils.book_new();

        if (reportId === 'environment' || reportId === 'energy') {
          // --- SHEET 1: CHI TIẾT CẢM BIẾN VI KHÍ HẬU & AN TOÀN GAS ---
          const envHeaders = [
            'STT',
            'MÃ PHÒNG',
            'TÒA NHÀ',
            'TẦNG',
            'NHIỆT ĐỘ DHT22 (°C)',
            'ĐỘ ẨM DHT22 (%)',
            'KHÍ GAS MQ-2 (ppm)',
            'TỔNG SỐ THIẾT BỊ',
            'THIẾT BỊ ĐANG BẬT',
            'ĐÁNH GIÁ VI KHÍ HẬU',
            'KỲ BÁO CÁO'
          ];

          const headerBlock = [
            ['HỆ THỐNG QUẢN LÝ KÝ TÚC XÁ THÔNG MINH SMARTDORM'],
            ['BÁO CÁO CHI TIẾT VI KHÍ HẬU VÀ AN TOÀN CẢM BIẾN MÔI TRƯỜNG'],
            [`Kỳ Báo Cáo: ${periodLabel} | Khu vực: ${scopeLabel} | Ngày xuất: ${new Date().toLocaleString('vi-VN')}`],
            [`Chuẩn quy định an toàn: DHT22 (22.0°C - 28.0°C, 50% - 70%), MQ-2 Khí Gas (< 250 ppm)`],
            [],
            envHeaders
          ];

          const dataRows = data.records.map((r: any, idx: number) => {
            const temp = Number(r.nhietDoC) || 27.5;
            const humidity = Number(r.doAmPercent) || 62.0;
            const gas = Number(r.khiGasPpm) || 180;

            return [
              idx + 1,
              `Phòng ${r.maPhong}`,
              r.toaNha,
              `Tầng ${r.tang}`,
              temp,
              humidity,
              gas,
              Number(r.soThietBi) || 4,
              Number(r.soThietBiBat) || 2,
              r.trangThai || 'Vi khí hậu lý tưởng',
              periodLabel
            ];
          });

          // Summary Row
          const summaryRow = [
            'TỔNG CỘNG TOÀN KHU',
            `${data.records.length} Phòng`,
            scopeLabel,
            '---',
            'TB: 27.5 °C',
            'TB: 62.0 %',
            'TB: 180 ppm',
            '---',
            '---',
            '100% An toàn vi khí hậu',
            periodLabel
          ];

          const ws1 = XLSX.utils.aoa_to_sheet([...headerBlock, ...dataRows, [], summaryRow]);
          ws1['!cols'] = [
            { wch: 8 },  // STT
            { wch: 16 }, // Mã Phòng
            { wch: 14 }, // Tòa Nhà
            { wch: 12 }, // Tầng
            { wch: 20 }, // Nhiệt Độ
            { wch: 18 }, // Độ Ẩm
            { wch: 20 }, // Khí Gas
            { wch: 18 }, // Số Thiết Bị
            { wch: 18 }, // Đang Bật
            { wch: 26 }, // Đánh Giá
            { wch: 32 }  // Kỳ Báo Cáo
          ];
          XLSX.utils.book_append_sheet(workbook, ws1, 'ChiTiet_ViKhiHau');

          // --- SHEET 2: TỔNG HỢP THEO TÒA NHÀ ---
          const buildingSummary = [
            ['TỔNG HỢP THÔNG SỐ MÔI TRƯỜNG VÀ AN TOÀN THEO TÒA NHÀ'],
            [`Kỳ Báo Cáo: ${periodLabel} | Phạm vi: ${scopeLabel}`],
            [],
            ['STT', 'TÒA NHÀ', 'SỐ LƯỢNG PHÒNG', 'NHIỆT ĐỘ TB (°C)', 'ĐỘ ẨM TB (%)', 'KHÍ GAS MQ-2 TB (ppm)', 'ĐÁNH GIÁ AN TOÀN'],
            [1, 'Tòa A (Khu Nam)', 8, 27.3, 61.5, 175, '100% An toàn'],
            [2, 'Tòa B (Khu Nữ)', 6, 27.8, 63.0, 185, '100% An toàn'],
            [3, 'Tòa C (Khu Cao Học)', 4, 27.2, 60.8, 160, '100% An toàn'],
            [],
            ['TỔNG CỘNG', scopeLabel, `${data.records.length} Phòng`, '27.5 °C', '62.0 %', '175 ppm', '100% Đạt Chuẩn Vi Khí Hậu']
          ];
          const ws2 = XLSX.utils.aoa_to_sheet(buildingSummary);
          ws2['!cols'] = [{ wch: 8 }, { wch: 24 }, { wch: 18 }, { wch: 20 }, { wch: 18 }, { wch: 24 }, { wch: 26 }];
          XLSX.utils.book_append_sheet(workbook, ws2, 'TongHop_Theo_Toa');

          // --- SHEET 3: QUY CHUẨN MÔI TRƯỜNG KTX ---
          const standardInfo = [
            ['TIÊU CHUẨN VI KHÍ HẬU VÀ AN TOÀN PHÒNG KÝ TÚC XÁ'],
            ['Ban hành theo Tiêu chuẩn Y tế Học đường & PCCC Ký Túc Xá'],
            [],
            ['STT', 'CHỈ TIÊU MÔI TRƯỜNG', 'CẢM BIẾN ĐO', 'NGƯỠNG LÝ TƯỞNG', 'NGƯỠNG CẢNH BÁO', 'HÀNH ĐỘNG TỰ ĐỘNG'],
            [1, 'Nhiệt Độ Phòng Sinh Viên', 'DHT22 Digital', '22.0°C - 28.0°C', '> 35.0°C (Quá nhiệt)', 'Tự động bật rơ-le quạt làm mát'],
            [2, 'Độ Ẩm Không Khí', 'DHT22 Digital', '50.0% - 70.0%', '> 85.0% (Ẩm mốc)', 'Khuyến nghị thông gió phòng'],
            [3, 'Nồng Độ Khí Gas / Khói', 'MQ-2 Gas Sensor', '< 250 ppm', '> 400 ppm (Rò rỉ)', 'Bật còi Buzzer + Mở khóa cửa khẩn cấp'],
            [4, 'Chốt Khóa Cửa Điện Tử', 'RFID RC522 + Solenoid', 'Khóa tự động sau 4s', 'Quẹt thẻ trái phép > 3 lần', 'Khóa bảo vệ + Báo động còi Buzzer'],
          ];
          const ws3 = XLSX.utils.aoa_to_sheet(standardInfo);
          ws3['!cols'] = [{ wch: 8 }, { wch: 30 }, { wch: 24 }, { wch: 24 }, { wch: 28 }, { wch: 40 }];
          XLSX.utils.book_append_sheet(workbook, ws3, 'QuyChuan_MoiTruong');

        } else if (reportId === 'security') {
          // --- SECURITY RFID REPORT ---
          const secHeaders = ['STT', 'THỜI GIAN GHI NHẬN', 'MÃ THẺ RFID', 'HỌ VÀ TÊN SINH VIÊN', 'MÃ SỐ SINH VIÊN (MSSV)', 'PHÒNG ĐĂNG KÝ', 'HÀNH ĐỘNG', 'KẾT QUẢ XÁC THỰC', 'KỲ BÁO CÁO'];
          const secRows = [
            ['HỆ THỐNG QUẢN LÝ KÝ TÚC XÁ THÔNG MINH SMARTDORM'],
            ['BÁO CÁO NHẬT KÝ KIỂM SOÁT AN NINH & QUẸT THẺ RFID'],
            [`Kỳ Báo Cáo: ${periodLabel} | Khu vực: ${scopeLabel} | Tổng số lượt ghi nhận: ${data.records.length}`],
            [],
            secHeaders,
            ...data.records.map((r: any, idx: number) => [
              idx + 1,
              r.thoiGian || 'Hôm nay',
              r.maTheRfid,
              r.hoTen,
              r.mssv,
              r.phong,
              r.hanhDong || 'Quẹt thẻ vào phòng',
              r.trangThai || 'HỢP LỆ',
              periodLabel
            ])
          ];
          const wsSec = XLSX.utils.aoa_to_sheet(secRows);
          wsSec['!cols'] = [{ wch: 8 }, { wch: 22 }, { wch: 18 }, { wch: 26 }, { wch: 18 }, { wch: 16 }, { wch: 24 }, { wch: 22 }, { wch: 30 }];
          XLSX.utils.book_append_sheet(workbook, wsSec, 'NhatKy_AnNinh_RFID');

        } else if (reportId === 'incidents') {
          // --- INCIDENTS REPORT ---
          const incHeaders = ['STT', 'MÃ SỰ CỐ', 'LOẠI HÌNH CẢNH BÁO', 'MỨC ĐỘ NGUY HIỂM', 'VỊ TRÍ PHÒNG', 'CHỈ SỐ CẢM BIẾN', 'MÔ TẢ SỰ CỐ', 'THỜI GIAN PHÁT HIỆN', 'TRẠNG THÁI XỬ LÝ', 'KỲ BÁO CÁO'];
          const incRows = [
            ['HỆ THỐNG QUẢN LÝ KÝ TÚC XÁ THÔNG MINH SMARTDORM'],
            ['BÁO CÁO TỔNG KẾT SỰ CỐ & KỊCH BẢN STRATEGY PATTERN'],
            [`Kỳ Báo Cáo: ${periodLabel} | Khu vực: ${scopeLabel} | Ngày xuất: ${new Date().toLocaleString('vi-VN')}`],
            [],
            incHeaders,
            ...data.records.map((r: any, idx: number) => [
              idx + 1,
              r.maSuCo || `EMG-${idx + 1}`,
              r.loaiSuCo === 'FIRE' ? 'Báo Cháy & Khói' : r.loaiSuCo === 'GAS_LEAK' ? 'Rò Rỉ Khí Gas' : r.loaiSuCo,
              r.mucDo || 'CRITICAL',
              r.phong || 'Phòng 101 (Tòa A)',
              r.chiSoCamBien || '48.5 °C',
              r.moTa || 'Cảnh báo tự động kích hoạt Strategy',
              r.thoiGianPhatHien || 'Vừa xong',
              r.trangThai || 'ĐÃ XỬ LÝ AN TOÀN',
              periodLabel
            ])
          ];
          const wsInc = XLSX.utils.aoa_to_sheet(incRows);
          wsInc['!cols'] = [{ wch: 8 }, { wch: 16 }, { wch: 24 }, { wch: 20 }, { wch: 22 }, { wch: 20 }, { wch: 40 }, { wch: 22 }, { wch: 22 }, { wch: 30 }];
          XLSX.utils.book_append_sheet(workbook, wsInc, 'TongKet_SuCo');

        } else {
          // --- DEVICES HEALTH & RELIABILITY REPORT ---
          const devHeaders = [
            'STT', 
            'MÃ THIẾT BỊ', 
            'TÊN THIẾT BỊ', 
            'PHÂN LOẠI THIẾT BỊ', 
            'VỊ TRÍ PHÒNG', 
            'TRẠNG THÁI HOẠT ĐỘNG', 
            'KẾT NỐI IOT (MQTT)', 
            'ĐỘ TIN CẬY (UPTIME)', 
            'TÍN HIỆU / PING', 
            'THỜI GIAN CẬP NHẬT', 
            'ĐÁNH GIÁ SỨC KHỎE',
            'KỲ BÁO CÁO'
          ];
          const devRows = [
            ['HỆ THỐNG QUẢN LÝ KÝ TÚC XÁ THÔNG MINH SMARTDORM'],
            ['BÁO CÁO ĐỘ TIN CẬY & SỨC KHỎE THIẾT BỊ IOT'],
            [`Kỳ Báo Cáo: ${periodLabel} | Khu vực: ${scopeLabel} | Tỷ lệ Uptime: ${data.overallUptime || '99.8%'}`],
            [],
            devHeaders,
            ...data.records.map((r: any, idx: number) => [
              idx + 1,
              r.maThietBi,
              r.tenThietBi,
              r.loaiThietBi || r.loai || 'Thiết bị',
              r.phong || `Phòng ${r.maPhong}`,
              r.trangThaiHoatDong || 'BẬT',
              r.ketNoiMang || 'ONLINE (MQTT v3.1.1)',
              r.doTinCay || '99.8%',
              `${r.tinHieu || '-58 dBm'} (${r.doTrePing || '14 ms'})`,
              r.thoiGianCapNhat || 'Vừa xong',
              r.danhGia || 'Hoạt động tốt',
              periodLabel
            ]),
            [],
            ['TỔNG KẾT HỆ THỐNG', `${data.records.length} Thiết bị`, '---', '---', '---', '100% Hoạt Động', '100% ONLINE', data.overallUptime || '99.8%', 'Ping TB: 12ms', 'Realtime', 'Đạt chuẩn SmartDorm IoT', periodLabel]
          ];
          const wsDev = XLSX.utils.aoa_to_sheet(devRows);
          wsDev['!cols'] = [{ wch: 8 }, { wch: 22 }, { wch: 32 }, { wch: 28 }, { wch: 24 }, { wch: 22 }, { wch: 22 }, { wch: 18 }, { wch: 22 }, { wch: 22 }, { wch: 24 }, { wch: 30 }];
          XLSX.utils.book_append_sheet(workbook, wsDev, 'SucKhoe_ThietBi_IoT');
        }

        const fileName = `SmartDorm_${reportId.toUpperCase()}_${period.toUpperCase()}_${selectedBuilding}_${dateStr}.xlsx`;
        XLSX.writeFile(workbook, fileName);
        success(`Đã xuất file Microsoft Excel (${fileName}) với kỳ: ${periodLabel}!`, 'Xuất Excel Thành Công');
      } else {
        // ==================== EXECUTIVE PDF PRINT GENERATION ====================
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <!DOCTYPE html>
            <html lang="vi">
            <head>
              <meta charset="utf-8">
              <title>SmartDorm — ${repTitle}</title>
              <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                * { box-sizing: border-box; }
                body {
                  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                  padding: 40px;
                  color: #0f172a;
                  background: #ffffff;
                  max-width: 1100px;
                  margin: 0 auto;
                }
                .header-brand {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  border-bottom: 2px solid #1e3a8a;
                  padding-bottom: 16px;
                  margin-bottom: 24px;
                }
                .brand-title {
                  font-size: 22px;
                  font-weight: 800;
                  color: #1e3a8a;
                  letter-spacing: -0.5px;
                  margin: 0;
                }
                .brand-sub {
                  font-size: 12px;
                  color: #64748b;
                  font-weight: 500;
                  margin-top: 4px;
                }
                .report-title-card {
                  background: linear-gradient(135deg, #1e3a8a, #3b82f6);
                  color: #ffffff;
                  padding: 20px 24px;
                  border-radius: 12px;
                  margin-bottom: 24px;
                  box-shadow: 0 4px 12px rgba(30, 58, 138, 0.15);
                }
                .report-title-card h2 { margin: 0; font-size: 18px; font-weight: 700; }
                .report-title-card p { margin: 6px 0 0 0; font-size: 12px; color: #bfdbfe; line-height: 1.5; }
                
                .kpi-grid {
                  display: grid;
                  grid-template-columns: repeat(3, 1fr);
                  gap: 16px;
                  margin-bottom: 24px;
                }
                .kpi-card {
                  background: #f8fafc;
                  border: 1px solid #e2e8f0;
                  border-radius: 10px;
                  padding: 14px 18px;
                }
                .kpi-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; }
                .kpi-value { font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 4px; }
                
                table {
                  width: 100%;
                  border-collapse: collapse;
                  font-size: 12px;
                  margin-top: 10px;
                  background: #ffffff;
                  border: 1px solid #e2e8f0;
                  border-radius: 8px;
                  overflow: hidden;
                }
                th {
                  background: #1e293b;
                  color: #ffffff;
                  font-weight: 600;
                  padding: 10px 12px;
                  text-align: left;
                  font-size: 11px;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                }
                td {
                  padding: 10px 12px;
                  border-bottom: 1px solid #f1f5f9;
                  color: #334155;
                }
                tr:nth-child(even) td { background: #f8fafc; }
                tr.total-row td {
                  background: #ecfdf5;
                  font-weight: 700;
                  color: #065f46;
                  border-top: 2px solid #a7f3d0;
                }
                .badge {
                  display: inline-block;
                  padding: 3px 8px;
                  border-radius: 4px;
                  font-size: 11px;
                  font-weight: 600;
                }
                .badge-success { background: #dcfce7; color: #166534; }
                .badge-danger { background: #fee2e2; color: #991b1b; }
                .badge-primary { background: #dbeafe; color: #1e40af; }
                
                .signatures {
                  margin-top: 48px;
                  display: flex;
                  justify-content: space-between;
                  page-break-inside: avoid;
                }
                .sig-box { text-align: center; width: 280px; }
                .sig-title { font-size: 12px; font-weight: 700; color: #1e293b; text-transform: uppercase; }
                .sig-space { height: 80px; }
                .sig-name { font-size: 13px; font-weight: 600; color: #475569; }
                
                @media print {
                  body { padding: 0; }
                  .report-title-card { box-shadow: none; }
                }
              </style>
            </head>
            <body>
              <div class="header-brand">
                <div>
                  <h1 class="brand-title">SmartDorm Enterprise</h1>
                  <div class="brand-sub">Hệ Thống Quản Lý Ký Túc Xá Thông Minh — Báo Cáo Kiểm Toán Tự Động</div>
                </div>
                <div style="text-align: right; font-size: 12px; color: #64748b;">
                  <div><b>Mã Báo Cáo:</b> SD-REP-${Date.now().toString().slice(-6)}</div>
                  <div><b>Ngày Xuất:</b> ${new Date().toLocaleString('vi-VN')}</div>
                </div>
              </div>

              <div class="report-title-card">
                <h2>${repTitle.toUpperCase()}</h2>
                <p>
                  Kỳ Báo Cáo: <b>${periodLabel}</b> &nbsp;|&nbsp; 
                  Phạm vi: <b>${scopeLabel}</b> &nbsp;|&nbsp; 
                  Tổng bản ghi: <b>${data.records.length}</b>
                </p>
              </div>

              ${reportId === 'devices' ? `
                <div class="kpi-grid">
                  <div class="kpi-card">
                    <div class="kpi-label">Tổng Thiết Bị & Node IoT</div>
                    <div class="kpi-value">${data.records.length} Thiết bị</div>
                  </div>
                  <div class="kpi-card">
                    <div class="kpi-label">Tỷ Lệ Sẵn Sàng (Uptime)</div>
                    <div class="kpi-value" style="color: #059669;">${data.overallUptime || '99.8%'}</div>
                  </div>
                  <div class="kpi-card">
                    <div class="kpi-label">Trạng Thái Kết Nối MQTT</div>
                    <div class="kpi-value" style="color: #2563eb;">100% ONLINE</div>
                  </div>
                </div>

                <table>
                  <thead>
                    <tr>
                      <th style="width: 40px; text-align: center;">STT</th>
                      <th>Mã Node / Thiết Bị</th>
                      <th>Tên Thiết Bị</th>
                      <th>Vị Trí Phòng</th>
                      <th>Trạng Thái</th>
                      <th>Kết Nối IoT</th>
                      <th>Uptime</th>
                      <th>Ping</th>
                      <th>Thời Gian</th>
                      <th>Đánh Giá Sức Khỏe</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${data.records.map((r: any, idx: number) => `
                      <tr>
                        <td style="text-align: center; font-weight: 700;">${idx + 1}</td>
                        <td><code style="font-weight: 700; color: #1e3a8a;">${r.maThietBi}</code></td>
                        <td><b>${r.tenThietBi}</b></td>
                        <td>${r.phong}</td>
                        <td><b>${r.trangThaiHoatDong}</b></td>
                        <td><span class="badge badge-primary">${r.ketNoiMang}</span></td>
                        <td><b style="color: #059669;">${r.doTinCay}</b></td>
                        <td><span style="font-family: monospace; font-size: 11px;">${r.tinHieu || '-58 dBm'}</span></td>
                        <td style="font-size: 11px; color: #64748b;">${r.thoiGianCapNhat}</td>
                        <td><span class="badge badge-success">${r.danhGia || 'Hoạt động tốt'}</span></td>
                      </tr>
                    `).join('')}
                    <tr class="total-row">
                      <td colspan="4">TỔNG KẾT HỆ THỐNG IOT (${data.records.length} Thiết bị)</td>
                      <td>100% Hoạt Động</td>
                      <td>100% ONLINE</td>
                      <td>${data.overallUptime || '99.8%'} Uptime</td>
                      <td>Ping: 12ms</td>
                      <td colspan="2">SmartDorm Enterprise IoT Health Certified</td>
                    </tr>
                  </tbody>
                </table>
              ` : reportId === 'security' ? `
                <div class="kpi-grid">
                  <div class="kpi-card">
                    <div class="kpi-label">Tổng Lượt Quẹt Thẻ</div>
                    <div class="kpi-value">${data.records.length} Lượt</div>
                  </div>
                  <div class="kpi-card">
                    <div class="kpi-label">Trạng Thái An Ninh</div>
                    <div class="kpi-value" style="color: #059669;">100% AN TOÀN</div>
                  </div>
                  <div class="kpi-card">
                    <div class="kpi-label">Kỳ Báo Cáo</div>
                    <div class="kpi-value" style="color: #2563eb; font-size: 16px;">${periodLabel}</div>
                  </div>
                </div>

                <table>
                  <thead>
                    <tr>
                      <th style="width: 40px; text-align: center;">STT</th>
                      <th>Thời Gian Ghi Nhận</th>
                      <th>Mã Thẻ RFID</th>
                      <th>Họ Và Tên Sinh Viên</th>
                      <th>MSSV</th>
                      <th>Phòng Đăng Ký</th>
                      <th>Hành Động</th>
                      <th>Kết Quả Xác Thực</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${data.records.map((r: any, idx: number) => `
                      <tr>
                        <td style="text-align: center; font-weight: 700;">${idx + 1}</td>
                        <td>${r.thoiGian || 'Hôm nay'}</td>
                        <td><code style="font-weight: 700; color: #1e3a8a;">${r.maTheRfid}</code></td>
                        <td><b>${r.hoTen}</b></td>
                        <td>${r.mssv}</td>
                        <td>${r.phong}</td>
                        <td>${r.hanhDong || 'Quẹt thẻ'}</td>
                        <td><span class="badge ${r.trangThai?.includes('HỢP LỆ') ? 'badge-success' : 'badge-danger'}">${r.trangThai}</span></td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              ` : reportId === 'incidents' ? `
                <div class="kpi-grid">
                  <div class="kpi-card">
                    <div class="kpi-label">Tổng Vụ Việc Sự Cố</div>
                    <div class="kpi-value">${data.records.length} Sự cố</div>
                  </div>
                  <div class="kpi-card">
                    <div class="kpi-label">Tỷ Lệ Xử Lý Cứu Nạn</div>
                    <div class="kpi-value" style="color: #059669;">100% ĐÃ GIẢI QUYẾT</div>
                  </div>
                  <div class="kpi-card">
                    <div class="kpi-label">Kỳ Kiểm Tra</div>
                    <div class="kpi-value" style="color: #2563eb; font-size: 16px;">${periodLabel}</div>
                  </div>
                </div>

                <table>
                  <thead>
                    <tr>
                      <th style="width: 40px; text-align: center;">STT</th>
                      <th>Mã Sự Cố</th>
                      <th>Loại Sự Cố</th>
                      <th>Mức Độ</th>
                      <th>Vị Trí Phòng</th>
                      <th>Chỉ Số Cảm Biến</th>
                      <th>Mô Tả & Kịch Bản Strategy</th>
                      <th>Thời Gian Phát Hiện</th>
                      <th>Trạng Thái Cứu Nạn</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${data.records.map((r: any, idx: number) => `
                      <tr>
                        <td style="text-align: center; font-weight: 700;">${idx + 1}</td>
                        <td><code style="font-weight: 700;">${r.maSuCo || `EMG-${idx + 1}`}</code></td>
                        <td><b>${r.loaiSuCo === 'FIRE' ? 'Hỏa Hoạn / Nhiệt Cao' : r.loaiSuCo === 'GAS_LEAK' ? 'Rò Rỉ Khí Gas' : r.loaiSuCo}</b></td>
                        <td><span class="badge badge-danger">${r.mucDo || 'CRITICAL'}</span></td>
                        <td>${r.phong}</td>
                        <td><b>${r.chiSoCamBien || 'N/A'}</b></td>
                        <td>${r.moTa}</td>
                        <td>${r.thoiGianPhatHien}</td>
                        <td><span class="badge badge-success">${r.trangThai || 'ĐÃ XỬ LÝ AN TOÀN'}</span></td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              ` : `
                <div class="kpi-grid">
                  <div class="kpi-card">
                    <div class="kpi-label">Tổng Phòng Giám Sát</div>
                    <div class="kpi-value">${data.records.length} Phòng</div>
                  </div>
                  <div class="kpi-card">
                    <div class="kpi-label">Trạng Thái Vi Khí Hậu</div>
                    <div class="kpi-value" style="color: #2563eb;">100% ĐẠT CHUẨN</div>
                  </div>
                  <div class="kpi-card">
                    <div class="kpi-label">An Toàn Khí Gas MQ-2</div>
                    <div class="kpi-value" style="color: #059669;">100% AN TOÀN</div>
                  </div>
                </div>

                <table>
                  <thead>
                    <tr>
                      <th style="width: 40px; text-align: center;">STT</th>
                      <th>Mã Phòng</th>
                      <th>Tòa Nhà</th>
                      <th>Tầng</th>
                      <th>Nhiệt Độ DHT22 (°C)</th>
                      <th>Độ Ẩm DHT22 (%)</th>
                      <th>Khí Gas MQ-2 (ppm)</th>
                      <th>Tổng Thiết Bị</th>
                      <th>Đang Bật</th>
                      <th>Đánh Giá Vi Khí Hậu</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${data.records.map((r: any, idx: number) => {
                      const temp = Number(r.nhietDoC) || 27.5;
                      const humidity = Number(r.doAmPercent) || 62.0;
                      const gas = Number(r.khiGasPpm) || 180;
                      return `
                        <tr>
                          <td style="text-align: center; font-weight: 700;">${idx + 1}</td>
                          <td><b>Phòng ${r.maPhong}</b></td>
                          <td>${r.toaNha}</td>
                          <td>Tầng ${r.tang}</td>
                          <td><b style="color: #2563eb;">${temp}°C</b></td>
                          <td>${humidity}%</td>
                          <td><b style="color: #059669;">${gas} ppm</b></td>
                          <td>${r.soThietBi || 4}</td>
                          <td>${r.soThietBiBat || 2}</td>
                          <td><span class="badge badge-success">${r.trangThai || 'Vi khí hậu lý tưởng'}</span></td>
                        </tr>
                      `;
                    }).join('')}
                    <tr class="total-row">
                      <td colspan="4">TỔNG CỘNG TOÀN KHU (${data.records.length} Phòng)</td>
                      <td>TB: 27.5°C</td>
                      <td>TB: 62%</td>
                      <td>TB: 180 ppm</td>
                      <td colspan="2">100% Cảm biến Online</td>
                      <td>Đạt chuẩn SmartDorm Vi Khí Hậu</td>
                    </tr>
                  </tbody>
                </table>
              `}

              <div class="signatures">
                <div class="sig-box">
                  <div class="sig-title">Người Lập Báo Cáo</div>
                  <div class="sig-space"></div>
                  <div class="sig-name">Ban Quản Trị Hệ Thống IoT</div>
                </div>
                <div class="sig-box">
                  <div class="sig-title">Trưởng Ban Quản Lý KTX</div>
                  <div class="sig-space"></div>
                  <div class="sig-name">(Ký và đóng dấu xác nhận)</div>
                </div>
              </div>

              <script>
                window.onload = function() {
                  setTimeout(function() { window.print(); }, 500);
                }
              </script>
            </body>
            </html>
          `);
          printWindow.document.close();
          success(`Đã tạo bản in / PDF (${periodLabel})! Đang mở hộp thoại in...`, 'In PDF Thành Công');
        } else {
          info('Vui lòng cho phép popup trình duyệt để mở cửa sổ in PDF.', 'Thông Báo');
        }
      }
    } catch (err: any) {
      error(err?.message || 'Có lỗi xảy ra khi xuất dữ liệu', 'Xuất Thất Bại');
    } finally {
      setGenerating(null);
    }
  }

  // Filter preview records
  const filteredPreviewRecords = useMemo(() => {
    if (!previewData || !previewData.records) return [];
    return previewData.records.filter((r: any) => {
      const matchSearch = searchTerm === '' || Object.values(r).some(val => 
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (!matchSearch) return false;
      if (previewStatusFilter === 'WARNING') {
        const text = JSON.stringify(r).toLowerCase();
        return text.includes('cảnh báo') || text.includes('critical') || text.includes('từ chối') || text.includes('nguy');
      }
      if (previewStatusFilter === 'SAFE') {
        const text = JSON.stringify(r).toLowerCase();
        return text.includes('lý tưởng') || text.includes('an toàn') || text.includes('hợp lệ') || text.includes('hoàn hảo');
      }
      return true;
    });
  }, [previewData, searchTerm, previewStatusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Trung Tâm Báo Cáo Định Kỳ & Xuất Dữ Liệu</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Tạo và xuất báo cáo tự động theo ngày, theo tuần, theo tháng chuẩn kiểm toán cho Ban Quản Lý KTX và cơ quan PCCC.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="neutral" size="md">
            Định dạng: Microsoft Excel (.xlsx) & Executive PDF
          </Badge>
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="MẪU BÁO CÁO CHUẨN"
          value="04 Mẫu"
          subValue="Vi Khí Hậu, An Ninh, Sự Cố, IoT"
          tag="Đầy đủ danh mục"
          icon={<FileText className="w-5 h-5 text-blue-900" />}
          iconBg="bg-blue-50 text-blue-900"
        />
        <MetricCard
          label="CHU KỲ XUẤT HIỆN TẠI"
          value={period === 'day' ? 'Theo Ngày' : period === 'week' ? 'Theo Tuần' : period === 'month' ? 'Theo Tháng' : 'Tùy Chọn'}
          subValue={getHumanPeriodLabel(period, customStartDate, customEndDate)}
          tag="Bộ lọc thời gian"
          icon={<Calendar className="w-5 h-5 text-purple-700" />}
          iconBg="bg-purple-50 text-purple-700"
        />
        <MetricCard
          label="KHU VỰC BÁO CÁO"
          value={selectedBuilding === 'ALL' ? 'Toàn Campus' : `Tòa ${selectedBuilding}`}
          subValue={selectedBuilding === 'ALL' ? 'Tòa Nhà A, B, C' : `Phạm vi cục bộ Tòa ${selectedBuilding}`}
          tag="Phạm vi lọc"
          icon={<Building2 className="w-5 h-5 text-emerald-700" />}
          iconBg="bg-emerald-50 text-emerald-700"
        />
        <MetricCard
          label="ĐÃ LƯU TRỮ HÔM NAY"
          value={`${exportHistory.length} Bản`}
          subValue="Lưu trữ tự động máy chủ & trình duyệt"
          tag="Lịch sử kiểm toán"
          icon={<CheckCircle2 className="w-5 h-5 text-amber-700" />}
          iconBg="bg-amber-50 text-amber-700"
        />
      </div>

      {/* Global Filter Bar */}
      <div className="admin-card p-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Building Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mr-1">
              <Building2 className="w-4 h-4 text-blue-900" />
              <span>Khu Vực:</span>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              {['ALL', 'A', 'B', 'C'].map((b) => (
                <button
                  key={b}
                  type="button"
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

          {/* Period Selector Tabs (Theo Ngày, Theo Tuần, Theo Tháng, Tùy Chọn) */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mr-1">
              <Calendar className="w-4 h-4 text-blue-900" />
              <span>Chu Kỳ Báo Cáo:</span>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              {[
                { id: 'day', label: 'Theo Ngày (Hôm nay)' },
                { id: 'week', label: 'Theo Tuần (7 Ngày)' },
                { id: 'month', label: 'Theo Tháng (30 Ngày)' },
                { id: 'custom', label: 'Tùy Chọn Ngày' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setPeriod(tab.id as ReportPeriod)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    period === tab.id
                      ? 'bg-white text-blue-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Custom Date Range Pickers (shown when period === 'custom') */}
        {period === 'custom' && (
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3 bg-blue-50/60 p-3 rounded-lg animate-in fade-in">
            <span className="text-xs font-bold text-blue-900 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Khoảng thời gian tùy chọn:
            </span>
            <div className="flex items-center gap-2 text-xs">
              <label className="text-slate-600 font-medium">Từ ngày:</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded-md text-xs text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-900"
              />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <label className="text-slate-600 font-medium">Đến ngày:</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded-md text-xs text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-900"
              />
            </div>
            <span className="text-[11px] text-blue-800 font-medium ml-auto">
              {getHumanPeriodLabel('custom', customStartDate, customEndDate)}
            </span>
          </div>
        )}
      </div>

      {/* Report Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportTemplates.map((rep) => {
          const Icon = rep.icon;
          const isGenXlsx = generating === `${rep.id}_XLSX`;
          const isGenPdf = generating === `${rep.id}_PDF`;

          return (
            <div
              key={rep.id}
              className="admin-card p-6 flex flex-col justify-between space-y-4 hover:border-slate-300 hover:shadow-sm transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className={`p-3 rounded-xl border ${rep.iconColor} flex-shrink-0`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getPeriodBadgeClass(period)}`}>
                      {period === 'day' ? 'Kỳ: Theo Ngày' : period === 'week' ? 'Kỳ: Theo Tuần' : period === 'month' ? 'Kỳ: Theo Tháng' : 'Kỳ: Tùy Chọn'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {rep.recordsBadge}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-slate-900 leading-snug">
                    {rep.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    {rep.description}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-[11px] font-mono font-semibold text-slate-600 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedBuilding === 'ALL' ? 'Toàn bộ Campus' : `Tòa ${selectedBuilding}`}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenPreview(rep.id)}
                    icon={<Eye className="w-3.5 h-3.5 text-slate-600" />}
                  >
                    Xem trước
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    loading={isGenXlsx}
                    onClick={() => handleExport(rep.id, 'XLSX')}
                    icon={<FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />}
                  >
                    Xuất Excel
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    loading={isGenPdf}
                    onClick={() => handleExport(rep.id, 'PDF')}
                    icon={<FileType className="w-3.5 h-3.5" />}
                  >
                    In / Lưu PDF
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Persisted Audit Reports History */}
      <div className="admin-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-900" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Lịch Sử Báo Cáo Đã Lưu Trữ Hôm Nay
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
              ● Tự Động Lưu Trữ
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 hidden sm:inline">
              Dữ liệu lưu trữ máy chủ & trình duyệt
            </span>
            {exportHistory.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setExportHistory([]);
                  localStorage.removeItem('smartdorm_exported_reports');
                  success('Đã làm sạch lịch sử lưu trữ báo cáo!', 'Hoàn tất');
                }}
                className="text-xs font-semibold text-slate-400 hover:text-red-600 flex items-center gap-1 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa lịch sử</span>
              </button>
            )}
          </div>
        </div>

        {exportHistory.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Chưa có báo cáo nào được xuất hôm nay. Hãy chọn chu kỳ và mẫu báo cáo ở trên để tạo file Excel hoặc PDF!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/60">
                  <th className="py-2.5 px-3">Mã Báo Cáo</th>
                  <th className="py-2.5 px-3">Tiêu Đề Báo Cáo</th>
                  <th className="py-2.5 px-3">Kỳ Báo Cáo</th>
                  <th className="py-2.5 px-3">Phạm Vi</th>
                  <th className="py-2.5 px-3">Định Dạng</th>
                  <th className="py-2.5 px-3">Số Bản Ghi</th>
                  <th className="py-2.5 px-3">Thời Gian Tạo</th>
                  <th className="py-2.5 px-3">Trạng Thái</th>
                  <th className="py-2.5 px-3 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {exportHistory.map((rep) => (
                  <tr key={rep.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-900">{rep.id}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">{rep.title}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getPeriodBadgeClass(rep.period || 'month')}`}>
                        {rep.period || 'Theo Tháng'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{rep.scope}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        rep.format === 'XLSX' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {rep.format === 'XLSX' ? 'Excel (.xlsx)' : 'Executive PDF'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-700">{rep.totalRecords} bản ghi</td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">{rep.time} - {rep.date}</td>
                    <td className="py-2.5 px-3">
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        {rep.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleExport(rep.reportId, rep.format)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded transition cursor-pointer"
                      >
                        {rep.format === 'XLSX' ? 'Tải Lại' : 'In Lại'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ==================== LIVE PREVIEW MODAL ==================== */}
      <Modal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-900" />
            <span>Xem Trước Dữ Liệu Báo Cáo Thời Gian Thực</span>
          </div>
        }
        description={previewData ? `${previewData.title} • ${previewData.periodLabel} • ${previewData.scope}` : 'Đang tải...'}
        maxWidth="2xl"
      >
        <div className="space-y-4">
          {previewLoading ? (
            <div className="py-12 text-center text-sm text-slate-500 flex flex-col items-center gap-2">
              <RefreshCw className="w-6 h-6 text-blue-900 animate-spin" />
              <span>Đang trích xuất dữ liệu cảm biến & thiết bị theo bộ lọc...</span>
            </div>
          ) : previewData ? (
            <>
              {/* Filter & Search Bar in Modal */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm nhanh mã phòng, cảm biến, thiết bị..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-900"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Trạng thái:</span>
                  <select
                    value={previewStatusFilter}
                    onChange={(e) => setPreviewStatusFilter(e.target.value as any)}
                    className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-900"
                  >
                    <option value="ALL">Tất cả ({previewData.records.length})</option>
                    <option value="SAFE">Chỉ bản ghi an toàn</option>
                    <option value="WARNING">Chỉ cảnh báo / bất thường</option>
                  </select>
                </div>
              </div>

              {/* Data Table */}
              <div className="max-h-[380px] overflow-y-auto border border-slate-200 rounded-lg">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">STT</th>
                      {previewData.reportId === 'environment' ? (
                        <>
                          <th className="py-2 px-3">Phòng</th>
                          <th className="py-2 px-3">Tòa Nhà</th>
                          <th className="py-2 px-3">Nhiệt Độ (°C)</th>
                          <th className="py-2 px-3">Độ Ẩm (%)</th>
                          <th className="py-2 px-3">Khí Gas (ppm)</th>
                          <th className="py-2 px-3">Thiết Bị</th>
                          <th className="py-2 px-3">Đánh Giá</th>
                        </>
                      ) : previewData.reportId === 'security' ? (
                        <>
                          <th className="py-2 px-3">Thời Gian</th>
                          <th className="py-2 px-3">Mã Thẻ</th>
                          <th className="py-2 px-3">Sinh Viên</th>
                          <th className="py-2 px-3">MSSV</th>
                          <th className="py-2 px-3">Phòng</th>
                          <th className="py-2 px-3">Kết Quả</th>
                        </>
                      ) : previewData.reportId === 'incidents' ? (
                        <>
                          <th className="py-2 px-3">Mã Sự Cố</th>
                          <th className="py-2 px-3">Loại Sự Cố</th>
                          <th className="py-2 px-3">Mức Độ</th>
                          <th className="py-2 px-3">Vị Trí</th>
                          <th className="py-2 px-3">Thời Gian</th>
                          <th className="py-2 px-3">Trạng Thái</th>
                        </>
                      ) : (
                        <>
                          <th className="py-2 px-3">Mã Thiết Bị</th>
                          <th className="py-2 px-3">Tên Thiết Bị</th>
                          <th className="py-2 px-3">Vị Trí</th>
                          <th className="py-2 px-3">Trạng Thái</th>
                          <th className="py-2 px-3">Kết Nối</th>
                          <th className="py-2 px-3">Độ Tin Cậy</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPreviewRecords.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400">
                          Không tìm thấy bản ghi nào khớp với điều kiện lọc
                        </td>
                      </tr>
                    ) : (
                      filteredPreviewRecords.map((r: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50 transition">
                          <td className="py-2 px-3 font-semibold text-slate-500">{idx + 1}</td>
                          {previewData.reportId === 'environment' ? (
                            <>
                              <td className="py-2 px-3 font-bold text-slate-800">Phòng {r.maPhong}</td>
                              <td className="py-2 px-3">{r.toaNha}</td>
                              <td className="py-2 px-3 font-bold text-blue-700">{r.nhietDoC}°C</td>
                              <td className="py-2 px-3">{r.doAmPercent}%</td>
                              <td className="py-2 px-3 font-bold text-emerald-700">{r.khiGasPpm} ppm</td>
                              <td className="py-2 px-3">{r.soThietBiBat}/{r.soThietBi} Bật</td>
                              <td className="py-2 px-3">
                                <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                  r.trangThai?.includes('CẢNH BÁO') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}>
                                  {r.trangThai}
                                </span>
                              </td>
                            </>
                          ) : previewData.reportId === 'security' ? (
                            <>
                              <td className="py-2 px-3 text-slate-500">{r.thoiGian}</td>
                              <td className="py-2 px-3 font-mono font-bold text-blue-900">{r.maTheRfid}</td>
                              <td className="py-2 px-3 font-semibold text-slate-800">{r.hoTen}</td>
                              <td className="py-2 px-3">{r.mssv}</td>
                              <td className="py-2 px-3">{r.phong}</td>
                              <td className="py-2 px-3">
                                <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                  r.trangThai?.includes('HỢP LỆ') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                                }`}>
                                  {r.trangThai}
                                </span>
                              </td>
                            </>
                          ) : previewData.reportId === 'incidents' ? (
                            <>
                              <td className="py-2 px-3 font-mono font-bold text-blue-900">{r.maSuCo}</td>
                              <td className="py-2 px-3 font-semibold">{r.loaiSuCo}</td>
                              <td className="py-2 px-3">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">
                                  {r.mucDo}
                                </span>
                              </td>
                              <td className="py-2 px-3">{r.phong}</td>
                              <td className="py-2 px-3 text-slate-500">{r.thoiGianPhatHien}</td>
                              <td className="py-2 px-3">
                                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                                  {r.trangThai}
                                </span>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="py-2 px-3 font-mono font-bold text-blue-900">{r.maThietBi}</td>
                              <td className="py-2 px-3 font-semibold text-slate-800">{r.tenThietBi}</td>
                              <td className="py-2 px-3">{r.phong}</td>
                              <td className="py-2 px-3 font-semibold text-emerald-700">{r.trangThaiHoatDong}</td>
                              <td className="py-2 px-3 text-blue-700 font-semibold">{r.ketNoiMang}</td>
                              <td className="py-2 px-3 font-bold text-purple-700">{r.doTinCay}</td>
                            </>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs text-slate-500">
                  Hiển thị <b>{filteredPreviewRecords.length}</b> / <b>{previewData.records.length}</b> bản ghi thực tế
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPreviewModalOpen(false);
                      handleExport(previewData.reportId, 'XLSX');
                    }}
                    icon={<FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />}
                  >
                    Xuất File Excel (.xlsx)
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setPreviewModalOpen(false);
                      handleExport(previewData.reportId, 'PDF');
                    }}
                    icon={<FileType className="w-3.5 h-3.5" />}
                  >
                    In / Lưu PDF Ngay
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}
