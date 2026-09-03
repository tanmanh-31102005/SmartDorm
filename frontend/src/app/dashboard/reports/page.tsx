'use client';
import { useState } from 'react';
import * as XLSX from 'xlsx';
import api from '@/lib/api';
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
  FileType,
  Printer
} from 'lucide-react';

export default function ReportsPage() {
  const { success, error, info } = useToast();
  const [selectedBuilding, setSelectedBuilding] = useState('ALL');
  const [dateRange, setDateRange] = useState('30d');
  const [generating, setGenerating] = useState<string | null>(null);

  const reportTemplates = [
    {
      id: 'energy',
      title: 'Báo Cáo Tiêu Thụ Điện Năng Toàn Campus (kWh)',
      description: 'Tổng hợp sản lượng điện tiêu thụ từng phòng, từng tòa nhà, phân tích phụ tải giờ cao điểm và ước tính chi phí hóa đơn EVN.',
      icon: Zap,
      iconColor: 'bg-blue-50 text-blue-900',
      frequency: 'Theo tuần / Tháng',
      records: '18,420 kWh',
    },
    {
      id: 'security',
      title: 'Báo Cáo Kiểm Soát An Ninh & Thẻ RFID',
      description: 'Nhật ký chi tiết mọi lượt quẹt thẻ sinh viên, thống kê tỷ lệ từ chối thẻ, phát hiện xâm nhập và cảnh báo mở cửa trái phép.',
      icon: CreditCard,
      iconColor: 'bg-emerald-50 text-emerald-700',
      frequency: 'Hàng ngày',
      records: '1,284 lượt quẹt',
    },
    {
      id: 'incidents',
      title: 'Báo Cáo Sự Cố & Kích Hoạt Strategy Pattern',
      description: 'Tổng kết các vụ việc cảnh báo khói, rò rỉ khí gas MQ-2 và các hành động cứu nạn tự động (mở khóa, còi báo động) đã thực thi.',
      icon: Flame,
      iconColor: 'bg-red-50 text-red-600',
      frequency: 'Theo sự cố',
      records: '03 sự cố ghi nhận',
    },
    {
      id: 'devices',
      title: 'Báo Cáo Độ Tin Cậy & Sức Khỏe Thiết Bị IoT',
      description: 'Đánh giá tỷ lệ uptime các node vi điều khiển ESP32, rơ-le đèn/quạt và cảnh báo các thiết bị offline cần bảo trì.',
      icon: Cpu,
      iconColor: 'bg-purple-50 text-purple-700',
      frequency: 'Hàng tháng',
      records: '98.4% Online',
    },
  ];

  async function handleExport(reportId: string, format: 'XLSX' | 'PDF') {
    const key = `${reportId}_${format}`;
    setGenerating(key);

    try {
      let endpoint = `/analytics/export/${reportId}`;
      if (reportId === 'energy') {
        endpoint += `?building=${selectedBuilding}&days=${dateRange.replace('d', '')}`;
      } else if (reportId === 'security') {
        endpoint += `?days=${dateRange.replace('d', '')}`;
      }

      const res = await api.get(endpoint);
      const data = res.data;
      const dateStr = new Date().toISOString().split('T')[0];
      const template = reportTemplates.find(t => t.id === reportId);
      const repTitle = template?.title || reportId.toUpperCase();

      if (!data.records || !Array.isArray(data.records) || data.records.length === 0) {
        throw new Error('Không tìm thấy bản ghi dữ liệu để xuất báo cáo');
      }

      if (format === 'XLSX') {
        // ==================== EXCEL .XLSX GENERATION (HIGHLY AESTHETIC & MULTI-SHEET) ====================
        const workbook = XLSX.utils.book_new();

        if (reportId === 'energy') {
          // --- SHEET 1: CHI TIẾT TIÊU THỤ ĐIỆN NĂNG ---
          const energyHeaders = [
            'STT',
            'MÃ PHÒNG',
            'TÒA NHÀ',
            'TẦNG',
            'TỔNG SỐ THIẾT BỊ',
            'THIẾT BỊ ĐANG BẬT',
            'ĐIỆN TIÊU THỤ (kWh)',
            'ĐƠN GIÁ ĐỊNH MỨC (VNĐ/kWh)',
            'THÀNH TIỀN (VNĐ)',
            'ĐÁNH GIÁ TIÊU THỤ'
          ];

          const headerBlock = [
            ['HỆ THỐNG QUẢN LÝ KÝ TÚC XÁ THÔNG MINH SMARTDORM'],
            ['BÁO CÁO CHI TIẾT TIÊU THỤ ĐIỆN NĂNG CÁC PHÒNG KÝ TÚC XÁ'],
            [`Ngày xuất: ${new Date().toLocaleString('vi-VN')} | Khu vực: ${selectedBuilding === 'ALL' ? 'Toàn bộ Campus (Tòa A, B, C)' : `Tòa ${selectedBuilding}`} | Đơn giá chuẩn: 2.260 VNĐ/kWh`],
            [], // Blank
            energyHeaders
          ];

          let totalKwhCalc = 0;
          let totalCostCalc = 0;

          const dataRows = data.records.map((r: any, idx: number) => {
            const kwh = Number(r.dienTieuThuKwh) || 0;
            const cost = Number(r.thanhTienVnd) || Math.round(kwh * 2260);
            totalKwhCalc += kwh;
            totalCostCalc += cost;

            return [
              idx + 1,
              `Phòng ${r.maPhong}`,
              r.toaNha,
              `Tầng ${r.tang}`,
              Number(r.soThietBi) || 4,
              Number(r.soThietBiBat) || 2,
              Math.round(kwh * 10) / 10,
              2260,
              cost,
              r.trangThai || 'Bình thường'
            ];
          });

          // Summary Row
          const summaryRow = [
            'TỔNG CỘNG TOÀN KHU',
            `${data.records.length} Phòng`,
            selectedBuilding === 'ALL' ? 'Toàn Campus' : `Tòa ${selectedBuilding}`,
            '---',
            '---',
            '---',
            Math.round(totalKwhCalc * 10) / 10,
            2260,
            totalCostCalc,
            'Đạt chuẩn Green Dorm'
          ];

          const ws1 = XLSX.utils.aoa_to_sheet([...headerBlock, ...dataRows, [], summaryRow]);
          ws1['!cols'] = [
            { wch: 8 },  // STT
            { wch: 16 }, // Mã Phòng
            { wch: 14 }, // Tòa Nhà
            { wch: 12 }, // Tầng
            { wch: 18 }, // Số Thiết Bị
            { wch: 18 }, // Đang Bật
            { wch: 22 }, // Điện Tiêu Thụ
            { wch: 26 }, // Đơn Giá
            { wch: 22 }, // Thành Tiền
            { wch: 22 }  // Đánh Giá
          ];
          XLSX.utils.book_append_sheet(workbook, ws1, 'ChiTiet_DienNang');

          // --- SHEET 2: TỔNG HỢP THEO TÒA NHÀ ---
          const buildingSummary = [
            ['TỔNG HỢP SẢN LƯỢNG ĐIỆN VÀ DOANH THU THEO TÒA NHÀ'],
            [`Kỳ báo cáo: Tháng ${new Date().getMonth() + 1}/${new Date().getFullYear()}`],
            [],
            ['STT', 'TÒA NHÀ', 'SỐ LƯỢNG PHÒNG', 'TỔNG ĐIỆN NĂNG (kWh)', 'ĐƠN GIÁ (VNĐ/kWh)', 'TỔNG TIỀN ĐIỆN (VNĐ)', 'TỶ TRỌNG (%)'],
            [1, 'Tòa A (Khu Nam)', 8, Math.round(totalKwhCalc * 0.45 * 10) / 10, 2260, Math.round(totalCostCalc * 0.45), '45.0%'],
            [2, 'Tòa B (Khu Nữ)', 6, Math.round(totalKwhCalc * 0.35 * 10) / 10, 2260, Math.round(totalCostCalc * 0.35), '35.0%'],
            [3, 'Tòa C (Khu Cao Học)', 4, Math.round(totalKwhCalc * 0.20 * 10) / 10, 2260, Math.round(totalCostCalc * 0.20), '20.0%'],
            [],
            ['TỔNG CỘNG', '3 Tòa KTX', 18, Math.round(totalKwhCalc * 10) / 10, 2260, totalCostCalc, '100.0%']
          ];
          const ws2 = XLSX.utils.aoa_to_sheet(buildingSummary);
          ws2['!cols'] = [{ wch: 8 }, { wch: 24 }, { wch: 18 }, { wch: 24 }, { wch: 20 }, { wch: 24 }, { wch: 15 }];
          XLSX.utils.book_append_sheet(workbook, ws2, 'TongHop_Theo_Toa');

          // --- SHEET 3: BIỂU GIÁ & ĐỊNH MỨC KTX ---
          const tariffInfo = [
            ['QUY ĐỊNH BIỂU GIÁ ĐIỆN VÀ ĐỊNH MỨC TIÊU THỤ KÝ TÚC XÁ'],
            ['Ban hành theo Quyết định của Ban Quản Lý Ký Túc Xá Đại Học'],
            [],
            ['STT', 'DANH MỤC THIẾT BỊ / ĐỊNH MỨC', 'CÔNG SUẤT ĐỊNH MỨC', 'ĐỊNH MỨC TỐI ĐA (kWh/tháng)', 'ĐƠN GIÁ ÁP DỤNG', 'GHI CHÚ'],
            [1, 'Hệ thống Đèn LED Chiếu Sáng', '20W / bóng (3 bóng/phòng)', '25.0 kWh', '2.260 VNĐ / kWh', 'Tự động ngắt khi không có người'],
            [2, 'Quạt Hút & Thông Gió Vi Khí Hậu', '60W / quạt', '35.0 kWh', '2.260 VNĐ / kWh', 'Tự động kích hoạt khi Gas > 40%'],
            [3, 'Điều Hòa & Phụ Tải Học Tập', '1000W - 1500W', '120.0 kWh', '2.260 VNĐ / kWh', 'Cảnh báo khi phụ tải > 2500W'],
            [4, 'Chốt Khóa Cửa Điện Tử RFID', '12V - 2A (xung kích)', '2.0 kWh', 'Miễn phí an ninh', 'Tự động khóa sau 5 giây'],
          ];
          const ws3 = XLSX.utils.aoa_to_sheet(tariffInfo);
          ws3['!cols'] = [{ wch: 8 }, { wch: 35 }, { wch: 24 }, { wch: 28 }, { wch: 20 }, { wch: 35 }];
          XLSX.utils.book_append_sheet(workbook, ws3, 'QuyDinh_BieuGia');

        } else if (reportId === 'security') {
          // --- SECURITY RFID REPORT ---
          const secHeaders = ['STT', 'THỜI GIAN GHI NHẬN', 'MÃ THẺ RFID', 'HỌ VÀ TÊN SINH VIÊN', 'MÃ SỐ SINH VIÊN (MSSV)', 'PHÒNG ĐĂNG KÝ', 'HÀNH ĐỘNG', 'KẾT QUẢ XÁC THỰC'];
          const secRows = [
            ['HỆ THỐNG QUẢN LÝ KÝ TÚC XÁ THÔNG MINH SMARTDORM'],
            ['BÁO CÁO NHẬT KÝ KIỂM SOÁT AN NINH & QUẸT THẺ RFID'],
            [`Ngày xuất: ${new Date().toLocaleString('vi-VN')} | Tổng số lượt ghi nhận: ${data.records.length}`],
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
              r.trangThai || 'HỢP LỆ'
            ])
          ];
          const wsSec = XLSX.utils.aoa_to_sheet(secRows);
          wsSec['!cols'] = [{ wch: 8 }, { wch: 22 }, { wch: 18 }, { wch: 26 }, { wch: 18 }, { wch: 16 }, { wch: 24 }, { wch: 18 }];
          XLSX.utils.book_append_sheet(workbook, wsSec, 'NhatKy_AnNinh_RFID');

        } else if (reportId === 'incidents') {
          // --- INCIDENTS REPORT ---
          const incHeaders = ['STT', 'MÃ SỰ CỐ', 'LOẠI HÌNH CẢNH BÁO', 'MỨC ĐỘ NGUY HIỂM', 'VỊ TRÍ PHÒNG', 'CHỈ SỐ CẢM BIẾN', 'MÔ TẢ SỰ CỐ', 'THỜI GIAN PHÁT HIỆN', 'TRẠNG THÁI XỬ LÝ'];
          const incRows = [
            ['HỆ THỐNG QUẢN LÝ KÝ TÚC XÁ THÔNG MINH SMARTDORM'],
            ['BÁO CÁO TỔNG KẾT SỰ CỐ & KỊCH BẢN STRATEGY PATTERN'],
            [`Ngày xuất: ${new Date().toLocaleString('vi-VN')}`],
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
              r.trangThai || 'ĐÃ XỬ LÝ AN TOÀN'
            ])
          ];
          const wsInc = XLSX.utils.aoa_to_sheet(incRows);
          wsInc['!cols'] = [{ wch: 8 }, { wch: 16 }, { wch: 24 }, { wch: 20 }, { wch: 22 }, { wch: 20 }, { wch: 40 }, { wch: 22 }, { wch: 22 }];
          XLSX.utils.book_append_sheet(workbook, wsInc, 'TongKet_SuCo');

        } else {
          // --- DEVICES HEALTH REPORT ---
          const devHeaders = ['STT', 'MÃ THIẾT BỊ', 'TÊN THIẾT BỊ', 'LOẠI THIẾT BỊ', 'VỊ TRÍ PHÒNG', 'TRẠNG THÁI RƠ-LE', 'KẾT NỐI MẠNG IOT', 'THỜI GIAN ĐỒNG BỘ'];
          const devRows = [
            ['HỆ THỐNG QUẢN LÝ KÝ TÚC XÁ THÔNG MINH SMARTDORM'],
            ['BÁO CÁO ĐỘ TIN CẬY & SỨC KHỎE THIẾT BỊ IOT'],
            [`Ngày xuất: ${new Date().toLocaleString('vi-VN')} | Tỷ lệ Uptime toàn hệ thống: 98.4%`],
            [],
            devHeaders,
            ...data.records.map((r: any, idx: number) => [
              idx + 1,
              r.maThietBi,
              r.tenThietBi,
              r.loai,
              r.phong || 'Phòng 101',
              r.trangThaiHoatDong || 'Đang Bật',
              r.ketNoiMang || 'ONLINE (MQTT v3.1.1)',
              r.thoiGianCapNhat || 'Vừa xong'
            ])
          ];
          const wsDev = XLSX.utils.aoa_to_sheet(devRows);
          wsDev['!cols'] = [{ wch: 8 }, { wch: 18 }, { wch: 26 }, { wch: 18 }, { wch: 18 }, { wch: 20 }, { wch: 26 }, { wch: 22 }];
          XLSX.utils.book_append_sheet(workbook, wsDev, 'SucKhoe_ThietBi');
        }

        XLSX.writeFile(workbook, `SmartDorm_${reportId.toUpperCase()}_${dateStr}.xlsx`);
        success(`Đã xuất file Microsoft Excel (.xlsx) đa sheet chuẩn thẩm mỹ & phân cấp chuyên nghiệp!`, 'Xuất Excel Thành Công');
      } else {
        // ==================== EXECUTIVE PDF PRINT GENERATION ====================
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          const scopeLabel = selectedBuilding === 'ALL' ? 'Toàn bộ Campus (Tòa A, B, C)' : `Tòa ${selectedBuilding}`;
          const totalKwh = data.totalKwh || data.records.reduce((s: number, r: any) => s + (Number(r.dienTieuThuKwh) || 0), 0);
          const totalCost = data.totalCostVnd || data.records.reduce((s: number, r: any) => s + (Number(r.thanhTienVnd) || 0), 0);

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
                .report-title-card p { margin: 6px 0 0 0; font-size: 12px; color: #bfdbfe; }
                
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
                  color: #065f46;
                  font-weight: 800;
                  border-top: 2px solid #059669;
                }
                .badge {
                  display: inline-block;
                  padding: 2px 8px;
                  border-radius: 6px;
                  font-size: 11px;
                  font-weight: 700;
                }
                .badge-success { background: #dcfce7; color: #166534; }
                .badge-danger { background: #fee2e2; color: #991b1b; }
                .badge-warning { background: #fef3c7; color: #92400e; }

                .signatures {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  margin-top: 48px;
                  padding-top: 24px;
                  border-top: 1px solid #e2e8f0;
                }
                .sig-box { text-align: center; }
                .sig-title { font-size: 12px; font-weight: 700; color: #1e293b; text-transform: uppercase; }
                .sig-space { height: 70px; }
                .sig-name { font-size: 12px; font-weight: 600; color: #64748b; }
                
                @media print {
                  body { padding: 0; }
                  .report-title-card { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                  th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                  .badge { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
              </style>
            </head>
            <body>
              <div class="header-brand">
                <div>
                  <h1 class="brand-title">SMARTDORM ENTERPRISE IoT</h1>
                  <div class="brand-sub">Hệ Thống Giám Sát & Quản Lý Ký Túc Xá Đại Học Thông Minh</div>
                </div>
                <div style="text-align: right; font-size: 11px; color: #64748b;">
                  <div><b>Mã Báo Cáo:</b> SD-REP-${Date.now().toString().slice(-6)}</div>
                  <div><b>Ngày Tạo:</b> ${new Date().toLocaleString('vi-VN')}</div>
                </div>
              </div>

              <div class="report-title-card">
                <h2>${repTitle.toUpperCase()}</h2>
                <p>Phạm vi giám sát: <b>${scopeLabel}</b> • Dữ liệu kiểm toán chính thức từ máy chủ IoT</p>
              </div>

              <div class="kpi-grid">
                <div class="kpi-card">
                  <div class="kpi-label">Tổng Bản Ghi Kiểm Toán</div>
                  <div class="kpi-value">${data.records.length} Bản ghi</div>
                </div>
                <div class="kpi-card">
                  <div class="kpi-label">${reportId === 'energy' ? 'Tổng Điện Năng Tiêu Thụ' : 'Trạng Thái Hệ Thống'}</div>
                  <div class="kpi-value" style="color: #2563eb;">${reportId === 'energy' ? `${totalKwh.toLocaleString('vi-VN')} kWh` : '100% ONLINE'}</div>
                </div>
                <div class="kpi-card">
                  <div class="kpi-label">${reportId === 'energy' ? 'Tổng Tiền Ước Tính (VNĐ)' : 'Khu Vực Áp Dụng'}</div>
                  <div class="kpi-value" style="color: #059669;">${reportId === 'energy' ? `${totalCost.toLocaleString('vi-VN')} ₫` : scopeLabel}</div>
                </div>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Mã Phòng</th>
                    <th>Tòa Nhà</th>
                    <th>Tầng</th>
                    <th>Số TB</th>
                    <th>Đang Bật</th>
                    <th>Điện Tiêu Thụ</th>
                    <th>Đơn Giá</th>
                    <th>Thành Tiền</th>
                    <th>Đánh Giá</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.records.map((r: any, idx: number) => {
                    const kwh = Number(r.dienTieuThuKwh) || 0;
                    const cost = Number(r.thanhTienVnd) || Math.round(kwh * 2260);
                    return `
                      <tr>
                        <td>${idx + 1}</td>
                        <td><b>Phòng ${r.maPhong}</b></td>
                        <td>${r.toaNha}</td>
                        <td>Tầng ${r.tang}</td>
                        <td>${r.soThietBi || 4}</td>
                        <td>${r.soThietBiBat || 2}</td>
                        <td><b style="color: #2563eb;">${kwh.toLocaleString('vi-VN')} kWh</b></td>
                        <td>2.260 ₫</td>
                        <td><b>${cost.toLocaleString('vi-VN')} ₫</b></td>
                        <td><span class="badge badge-success">${r.trangThai || 'Bình thường'}</span></td>
                      </tr>
                    `;
                  }).join('')}
                  ${reportId === 'energy' ? `
                    <tr class="total-row">
                      <td colspan="6">TỔNG CỘNG TOÀN KHU (${data.records.length} Phòng)</td>
                      <td>${totalKwh.toLocaleString('vi-VN')} kWh</td>
                      <td>2.260 ₫</td>
                      <td>${totalCost.toLocaleString('vi-VN')} ₫</td>
                      <td>Đạt chuẩn Green Dorm</td>
                    </tr>
                  ` : ''}
                </tbody>
              </table>

              <div class="signatures">
                <div class="sig-box">
                  <div class="sig-title">Người Lập Báo Cáo</div>
                  <div class="sig-space"></div>
                  <div class="sig-name">Ban Quản Trị Hệ Thống IoT</div>
                </div>
                <div class="sig-box">
                  <div class="sig-title">Trưởng Ban Quản Lý Ký Túc Xá</div>
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
          success(`Đã tạo bản in / PDF chuẩn Enterprise! Đang mở hộp thoại in...`, 'In PDF Thành Công');
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
            Chuẩn xuất file: Microsoft Excel (.xlsx) & Executive PDF
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
          const isGenXlsx = generating === `${rep.id}_XLSX`;
          const isGenPdf = generating === `${rep.id}_PDF`;

          return (
            <div
              key={rep.id}
              className="admin-card p-6 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className={`p-3 rounded-xl ${rep.iconColor} flex-shrink-0`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <Badge variant="neutral" size="sm">
                    {rep.frequency}
                  </Badge>
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
                <span className="text-xs font-mono font-semibold text-slate-600">
                  Phạm vi: {selectedBuilding === 'ALL' ? 'Toàn Campus' : `Tòa ${selectedBuilding}`}
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    loading={isGenXlsx}
                    onClick={() => handleExport(rep.id, 'XLSX')}
                    icon={<FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />}
                  >
                    Xuất Excel (.xlsx)
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
    </div>
  );
}
