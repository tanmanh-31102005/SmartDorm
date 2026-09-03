'use client';
import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import api from '@/lib/api';
import { MetricCard } from '@/components/ui/MetricCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastContext';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { 
  Zap, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Sparkles, 
  Leaf, 
  Info, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Lightbulb, 
  Download, 
  FileSpreadsheet, 
  FileType,
  Calculator,
  Sliders,
  Receipt,
  Coins,
  ArrowRight
} from 'lucide-react';

// ==================== EVN 6-TIER PROGRESSIVE TARIFF ====================
export interface EvnTierDetail {
  tier: number;
  name: string;
  kwhRange: string;
  kwhConsumed: number;
  rateVnd: number;
  amountVnd: number;
}

export interface EvnBillCalculation {
  kwhTotal: number;
  subtotalVnd: number;
  vatPercent: number;
  vatAmountVnd: number;
  totalVnd: number;
  studentCount: number;
  perStudentVnd: number;
  effectiveRateVnd: number;
  tiers: EvnTierDetail[];
}

export const EVN_TARIFF_TIERS = [
  { tier: 1, name: 'Bậc 1 (0 - 50 kWh)', limit: 50, rate: 1893, range: '0 - 50 kWh' },
  { tier: 2, name: 'Bậc 2 (51 - 100 kWh)', limit: 50, rate: 1956, range: '51 - 100 kWh' },
  { tier: 3, name: 'Bậc 3 (101 - 200 kWh)', limit: 100, rate: 2271, range: '101 - 200 kWh' },
  { tier: 4, name: 'Bậc 4 (201 - 300 kWh)', limit: 100, rate: 2860, range: '201 - 300 kWh' },
  { tier: 5, name: 'Bậc 5 (301 - 400 kWh)', limit: 100, rate: 3197, range: '301 - 400 kWh' },
  { tier: 6, name: 'Bậc 6 (Trên 400 kWh)', limit: Infinity, rate: 3302, range: 'Trên 400 kWh' },
];

export function calculateEvnBill(kwhTotal: number, studentCount = 4): EvnBillCalculation {
  let remainingKwh = Math.max(0, kwhTotal);
  let subtotal = 0;
  const tiers: EvnTierDetail[] = [];

  for (const t of EVN_TARIFF_TIERS) {
    if (remainingKwh <= 0) {
      tiers.push({
        tier: t.tier,
        name: t.name,
        kwhRange: t.range,
        kwhConsumed: 0,
        rateVnd: t.rate,
        amountVnd: 0,
      });
      continue;
    }

    const consumedInTier = Math.min(remainingKwh, t.limit);
    const amount = Math.round(consumedInTier * t.rate);
    subtotal += amount;
    remainingKwh -= consumedInTier;

    tiers.push({
      tier: t.tier,
      name: t.name,
      kwhRange: t.range,
      kwhConsumed: Math.round(consumedInTier * 10) / 10,
      rateVnd: t.rate,
      amountVnd: amount,
    });
  }

  const vatPercent = 8; // 8% VAT
  const vatAmountVnd = Math.round(subtotal * (vatPercent / 100));
  const totalVnd = subtotal + vatAmountVnd;
  const validStudents = Math.max(1, studentCount);
  const perStudentVnd = Math.round(totalVnd / validStudents);
  const effectiveRateVnd = kwhTotal > 0 ? Math.round(totalVnd / kwhTotal) : 1893;

  return {
    kwhTotal: Math.round(kwhTotal * 10) / 10,
    subtotalVnd: subtotal,
    vatPercent,
    vatAmountVnd,
    totalVnd,
    studentCount: validStudents,
    perStudentVnd,
    effectiveRateVnd,
    tiers,
  };
}

export default function StudentEnergyPage() {
  const { success, error } = useToast();
  const [billData, setBillData] = useState<{
    roomNumber: string;
    buildingName: string;
    currentMonth: string;
    kwhConsumed: number;
    rateVnd: number;
    totalVnd: number;
    subtotalVnd: number;
    vatAmountVnd: number;
    studentCount: number;
    perStudentVnd: number;
    dueDate: string;
    evnCalculation: EvnBillCalculation;
  }>({
    roomNumber: '101',
    buildingName: 'A',
    currentMonth: `Tháng ${new Date().getMonth() + 1}/${new Date().getFullYear()}`,
    kwhConsumed: 126.0,
    rateVnd: 2155,
    totalVnd: 271616,
    subtotalVnd: 251496,
    vatAmountVnd: 20120,
    studentCount: 4,
    perStudentVnd: 67904,
    dueDate: `10/${new Date().getMonth() + 1}/${new Date().getFullYear()}`,
    evnCalculation: calculateEvnBill(126, 4),
  });

  const [downloading, setDownloading] = useState<string | null>(null);

  // Interactive Simulator State
  const [simKwh, setSimKwh] = useState<number>(126);
  const [simStudents, setSimStudents] = useState<number>(4);
  const simCalculation = calculateEvnBill(simKwh, simStudents);

  useEffect(() => {
    async function loadBill() {
      try {
        const res = await api.get('/analytics/monthly-bill/101');
        if (res.data) {
          const kwh = res.data.kwhConsumed || 126.0;
          const students = res.data.studentCount || 4;
          const evn = res.data.evnCalculation || calculateEvnBill(kwh, students);

          setBillData({
            roomNumber: res.data.roomNumber || '101',
            buildingName: res.data.buildingName || 'A',
            currentMonth: res.data.currentMonth || `Tháng ${new Date().getMonth() + 1}/${new Date().getFullYear()}`,
            kwhConsumed: kwh,
            rateVnd: evn.effectiveRateVnd,
            totalVnd: evn.totalVnd,
            subtotalVnd: evn.subtotalVnd,
            vatAmountVnd: evn.vatAmountVnd,
            studentCount: students,
            perStudentVnd: evn.perStudentVnd,
            dueDate: res.data.dueDate || `10/${new Date().getMonth() + 1}/${new Date().getFullYear()}`,
            evnCalculation: evn,
          });

          setSimKwh(kwh);
          setSimStudents(students);
        }
      } catch (e) {
        console.warn('Student bill fallback', e);
      }
    }
    loadBill();
  }, []);

  const roomEnergyWeek = [
    { day: 'T2', kwh: 7.8, cost: 16800 },
    { day: 'T3', kwh: 8.2, cost: 17600 },
    { day: 'T4', kwh: 7.5, cost: 16100 },
    { day: 'T5', kwh: 8.9, cost: 19100 },
    { day: 'T6', kwh: 9.1, cost: 19600 },
    { day: 'T7', kwh: 8.4, cost: 18100 },
    { day: 'CN', kwh: 8.4, cost: 18100 },
  ];

  function handleDownloadBill(format: 'XLSX' | 'PDF') {
    setDownloading(format);
    setTimeout(() => {
      if (format === 'XLSX') {
        const sheetData: any[][] = [
          ['HỆ THỐNG KÝ TÚC XÁ THÔNG MINH SMARTDORM'],
          [`HÓA ĐƠN TIỀN ĐIỆN THEO BIỂU GIÁ BẬC THANG EVN 6 BẬC — PHÒNG ${billData.roomNumber}`],
          [`Kỳ thanh toán: ${billData.currentMonth.toUpperCase()} | Ngày xuất: ${new Date().toLocaleString('vi-VN')}`],
          [], // separator
          ['Hạng mục thông tin', 'Giá trị chi tiết'],
          ['Phòng ở', `Phòng ${billData.roomNumber} — Tòa ${billData.buildingName}`],
          ['Tổng sản lượng điện tiêu thụ', `${billData.kwhConsumed} kWh`],
          ['Đơn giá bình quân thực tế', `${billData.rateVnd.toLocaleString('vi-VN')} VNĐ / kWh`],
          ['Số lượng sinh viên lưu trú', `${billData.studentCount} người`],
          ['Hạn thanh toán quy định', `Trước ngày ${billData.dueDate}`],
          [],
          ['BẢNG KÊ CHI TIẾT BẬC THANG ĐIỆN SINH HOẠT EVN 2026'],
          ['Tên Bậc', 'Định Mức Quy Định', 'Đơn Giá (VNĐ/kWh)', 'Sản Lượng Phòng Dùng (kWh)', 'Thành Tiền (VNĐ)'],
        ];

        billData.evnCalculation.tiers.forEach((t) => {
          sheetData.push([
            t.name,
            t.kwhRange,
            t.rateVnd,
            t.kwhConsumed,
            t.amountVnd,
          ]);
        });

        sheetData.push(
          [],
          ['Cộng tiền điện trước thuế', `${billData.subtotalVnd.toLocaleString('vi-VN')} VNĐ`],
          ['Thuế suất GTGT (VAT 8%)', `${billData.vatAmountVnd.toLocaleString('vi-VN')} VNĐ`],
          ['TỔNG CỘNG TIỀN THANH TOÁN', `${billData.totalVnd.toLocaleString('vi-VN')} VNĐ`],
          ['SỐ TIỀN BẠN CẦN ĐÓNG (CHIA ĐỀU)', `${billData.perStudentVnd.toLocaleString('vi-VN')} VNĐ`]
        );

        const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
        worksheet['!cols'] = [{ wch: 32 }, { wch: 25 }, { wch: 20 }, { wch: 25 }, { wch: 25 }];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'HoaDonEVN');
        XLSX.writeFile(workbook, `HoaDonDien_EVN_P${billData.roomNumber}_${billData.currentMonth.replace(/[\/\s]/g, '_')}.xlsx`);
        success('Đã xuất hóa đơn tiền điện Microsoft Excel (.xlsx) chuẩn biểu giá EVN 6 bậc thành công!', 'Tải Excel');
      } else {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          const tierRowsHtml = billData.evnCalculation.tiers.map(t => `
            <tr style="${t.kwhConsumed > 0 ? 'background: #f8fafc;' : 'opacity: 0.6;'}">
              <td style="font-weight: 600;">${t.name}</td>
              <td style="text-align: center;">${t.kwhRange}</td>
              <td style="text-align: right;">${t.rateVnd.toLocaleString('vi-VN')} ₫</td>
              <td style="text-align: right; font-weight: bold; color: ${t.kwhConsumed > 0 ? '#2563eb' : '#64748b'};">${t.kwhConsumed} kWh</td>
              <td style="text-align: right; font-weight: bold;">${t.amountVnd.toLocaleString('vi-VN')} ₫</td>
            </tr>
          `).join('');

          printWindow.document.write(`
            <!DOCTYPE html>
            <html lang="vi">
            <head>
              <meta charset="utf-8">
              <title>Hóa Đơn Tiền Điện EVN — Phòng ${billData.roomNumber}</title>
              <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                body { font-family: 'Inter', sans-serif; padding: 36px; color: #0f172a; max-width: 720px; margin: 0 auto; }
                .header { border-bottom: 2px solid #1e3a8a; padding-bottom: 14px; margin-bottom: 20px; }
                h1 { color: #1e3a8a; font-size: 20px; margin: 0; font-weight: 800; }
                .sub { color: #64748b; font-size: 12px; margin-top: 4px; }
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; font-size: 12px; }
                .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; }
                table { width: 100%; border-collapse: collapse; margin: 16px 0; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; font-size: 12px; }
                th { background: #1e293b; color: #ffffff; font-weight: 600; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; }
                td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #334155; }
                .total-card { background: #ecfdf5; border: 2px solid #059669; border-radius: 10px; padding: 16px; margin: 20px 0; text-align: center; }
                .total-label { font-size: 12px; font-weight: 700; color: #065f46; text-transform: uppercase; }
                .total-amount { font-size: 24px; font-weight: 800; color: #047857; margin-top: 4px; }
                .per-student { font-size: 13px; color: #065f46; margin-top: 4px; }
                .footer { margin-top: 28px; font-size: 11px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 16px; }
                @media print { body { padding: 0; } }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>HÓA ĐƠN TIỀN ĐIỆN SINH VIÊN KTX — BIỂU GIÁ EVN</h1>
                <div class="sub">SmartDorm IoT Enterprise • Kỳ ${billData.currentMonth} • Căn cứ biểu giá điện sinh hoạt 6 bậc thang</div>
              </div>

              <div class="info-grid">
                <div class="info-box">
                  <div><b>Phòng ở:</b> Phòng ${billData.roomNumber} — Tòa ${billData.buildingName}</div>
                  <div style="margin-top: 4px;"><b>Sĩ số phòng:</b> ${billData.studentCount} sinh viên</div>
                </div>
                <div class="info-box">
                  <div><b>Tổng tiêu thụ:</b> <span style="color: #2563eb; font-weight: bold;">${billData.kwhConsumed} kWh</span></div>
                  <div style="margin-top: 4px;"><b>Hạn thanh toán:</b> <span style="color: #dc2626; font-weight: bold;">Trước ${billData.dueDate}</span></div>
                </div>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Bậc Thang EVN</th>
                    <th style="text-align: center;">Định Mức</th>
                    <th style="text-align: right;">Đơn Giá</th>
                    <th style="text-align: right;">Sản Lượng</th>
                    <th style="text-align: right;">Thành Tiền</th>
                  </tr>
                </thead>
                <tbody>
                  ${tierRowsHtml}
                  <tr style="font-weight: 600;">
                    <td colspan="4">Tiền điện chưa thuế:</td>
                    <td style="text-align: right;">${billData.subtotalVnd.toLocaleString('vi-VN')} ₫</td>
                  </tr>
                  <tr>
                    <td colspan="4">Thuế GTGT (VAT 8%):</td>
                    <td style="text-align: right;">${billData.vatAmountVnd.toLocaleString('vi-VN')} ₫</td>
                  </tr>
                </tbody>
              </table>

              <div class="total-card">
                <div class="total-label">Tổng Cộng Hóa Đơn Phòng</div>
                <div class="total-amount">${billData.totalVnd.toLocaleString('vi-VN')} ₫</div>
                <div class="per-student">
                  Chia đều ${billData.studentCount} sinh viên: <strong>${billData.perStudentVnd.toLocaleString('vi-VN')} ₫ / người</strong>
                </div>
              </div>

              <div class="footer">
                SmartDorm IoT System — Hóa đơn kiểm toán điện tử xác thực tự động từ công tơ thông minh
              </div>
              <script>window.onload = function() { setTimeout(function() { window.print(); }, 400); }</script>
            </body>
            </html>
          `);
          printWindow.document.close();
          success('Đã mở bản in hóa đơn tiền điện PDF chuẩn bậc thang EVN!', 'In Hóa Đơn');
        }
      }
      setDownloading(null);
    }, 500);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Theo Dõi Điện Năng Phòng {billData.roomNumber}</h1>
            <Badge variant="info" size="sm">EVN 6 Bậc Thang</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Lịch sử tiêu thụ điện, bảng kê chi tiết 6 bậc thang EVN và công cụ dự toán chi phí thông minh.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none"
            loading={downloading === 'XLSX'}
            onClick={() => handleDownloadBill('XLSX')}
            icon={<FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />}
          >
            Xuất Excel (.xlsx)
          </Button>

          <Button
            variant="primary"
            size="sm"
            className="flex-1 sm:flex-none"
            loading={downloading === 'PDF'}
            onClick={() => handleDownloadBill('PDF')}
            icon={<FileType className="w-3.5 h-3.5" />}
          >
            In / Lưu PDF
          </Button>
        </div>
      </div>

      {/* 4 Room Energy KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="TIÊU THỤ HÔM NAY"
          value="8.4 kWh"
          change={{ value: '-5.2%', trend: 'down', label: 'vs hôm qua' }}
          subValue="Định mức: 12 kWh / ngày"
          tag="Tiết kiệm"
          tagVariant="success"
          icon={<Zap className="w-4 h-4 text-emerald-700" />}
          iconBg="bg-emerald-50 text-emerald-700"
        />

        <MetricCard
          label="TỔNG TIÊU THỤ THÁNG"
          value={`${billData.kwhConsumed} kWh`}
          subValue={`Đạt đến: Bậc 3 (${billData.evnCalculation.tiers[2]?.kwhRange})`}
          tag="Đang ghi nhận"
          tagVariant="info"
          icon={<Calendar className="w-4 h-4 text-blue-900" />}
          iconBg="bg-blue-50 text-blue-900"
        />

        <MetricCard
          label="TỔNG TIỀN ĐIỆN PHÒNG"
          value={`${billData.totalVnd.toLocaleString('vi-VN')} ₫`}
          subValue={`Đã gồm thuế GTGT (VAT 8%)`}
          tag="Biểu giá EVN"
          tagVariant="neutral"
          icon={<Receipt className="w-4 h-4 text-slate-700" />}
          iconBg="bg-slate-100 text-slate-700"
        />

        <MetricCard
          label="BÌNH QUÂN MỖI SINH VIÊN"
          value={`${billData.perStudentVnd.toLocaleString('vi-VN')} ₫`}
          subValue={`Chia đều ${billData.studentCount} bạn cùng phòng`}
          tag="1 Người"
          tagVariant="purple"
          icon={<Users className="w-4 h-4 text-purple-700" />}
          iconBg="bg-purple-50 text-purple-700"
        />
      </div>

      {/* ============================================================ */}
      {/* 🌟 FIX #11: BẢNG KÊ CHI TIẾT BẬC THANG ĐIỆN EVN 6 BẬC         */}
      {/* ============================================================ */}
      <div className="admin-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-900">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Bảng Kê Hóa Đơn Bậc Thang Sinh Hoạt EVN 2026 (Phòng {billData.roomNumber})
              </h3>
              <p className="text-xs text-slate-500">
                Tính lũy tiến theo 6 bậc thang quy định của Tập đoàn Điện lực Việt Nam kèm VAT 8%.
              </p>
            </div>
          </div>
          <Badge variant="success" size="sm">
            Biểu giá chính thức EVN
          </Badge>
        </div>

        {/* Table breakdown */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[560px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <th className="py-2.5 px-3">Bậc Thang</th>
                <th className="py-2.5 px-3">Khoảng kWh</th>
                <th className="py-2.5 px-3 text-right">Đơn Giá (VNĐ)</th>
                <th className="py-2.5 px-3 text-right">Sản Lượng Đã Dùng</th>
                <th className="py-2.5 px-3 text-right">Thành Tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {billData.evnCalculation.tiers.map((t) => {
                const isActive = t.kwhConsumed > 0;
                return (
                  <tr key={t.tier} className={isActive ? 'bg-blue-50/20' : 'text-slate-400'}>
                    <td className="py-2.5 px-3 font-semibold flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                        isActive ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {t.tier}
                      </span>
                      <span>{t.name}</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono">{t.kwhRange}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{t.rateVnd.toLocaleString('vi-VN')} ₫</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                      {t.kwhConsumed > 0 ? `${t.kwhConsumed} kWh` : '0 kWh'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      {t.amountVnd > 0 ? `${t.amountVnd.toLocaleString('vi-VN')} ₫` : '—'}
                    </td>
                  </tr>
                );
              })}

              {/* Subtotal & VAT */}
              <tr className="border-t-2 border-slate-200 font-semibold bg-slate-50/50">
                <td colSpan={4} className="py-2.5 px-3 text-slate-600">Tiền điện trước thuế (Subtotal):</td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                  {billData.subtotalVnd.toLocaleString('vi-VN')} ₫
                </td>
              </tr>
              <tr className="bg-slate-50/50">
                <td colSpan={4} className="py-2.5 px-3 text-slate-600">Thuế GTGT (VAT 8%):</td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                  {billData.vatAmountVnd.toLocaleString('vi-VN')} ₫
                </td>
              </tr>
              <tr className="bg-emerald-50 text-emerald-950 font-bold border-t border-emerald-200">
                <td colSpan={4} className="py-3 px-3 text-sm">TỔNG CỘNG TIỀN ĐIỆN PHÒNG:</td>
                <td className="py-3 px-3 text-right font-mono text-base text-emerald-700 font-extrabold">
                  {billData.totalVnd.toLocaleString('vi-VN')} ₫
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Student Split Footer Callout */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-emerald-900 font-bold">Số Tiền Bạn Cần Đóng (Chia Đều)</div>
              <div className="text-[11px] text-emerald-700">
                Đã chia đều cho {billData.studentCount} bạn cùng phòng · Hạn nộp trước {billData.dueDate}
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xl font-extrabold text-emerald-800 font-mono">
              {billData.perStudentVnd.toLocaleString('vi-VN')} ₫
            </span>
            <div className="text-[10px] text-emerald-600 font-semibold">/ 1 Sinh Viên</div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 🌟 FIX #11: BỘ MÔ PHỎNG CHI PHÍ TIỀN ĐIỆN SINH VIÊN          */}
      {/* ============================================================ */}
      <div className="admin-card p-6 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Bộ Mô Phỏng Tiền Điện Bậc Thang (Cost Simulator)</h3>
              <p className="text-xs text-blue-200/80">
                Kéo thanh trượt để dự toán hóa đơn nếu phòng bạn dùng thêm hoặc bớt điện
              </p>
            </div>
          </div>
          <Badge variant="purple" size="sm">
            Công Cụ Tương Tác
          </Badge>
        </div>

        {/* Controls Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Sliders Input */}
          <div className="lg:col-span-7 space-y-4">
            <div>
              <div className="flex justify-between items-center text-xs font-semibold mb-2">
                <span className="text-slate-300">Mức Điện Năng Dự Tính Tiêu Thụ:</span>
                <span className="text-blue-400 font-mono text-base font-bold">{simKwh} kWh</span>
              </div>
              <input
                type="range"
                min="40"
                max="350"
                step="5"
                value={simKwh}
                onChange={(e) => setSimKwh(Number(e.target.value))}
                className="w-full accent-blue-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                <span>40 kWh (Rất ít)</span>
                <span>126 kWh (Hiện tại)</span>
                <span>350 kWh (Nhiều)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs font-semibold mb-2">
                <span className="text-slate-300">Sĩ Số Bạn Cùng Phòng:</span>
                <span className="text-purple-300 font-mono font-bold">{simStudents} người</span>
              </div>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 6].map((num) => (
                  <button
                    key={num}
                    onClick={() => setSimStudents(num)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      simStudents === num
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {num} Bạn
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Realtime Output Card */}
          <div className="lg:col-span-5 p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 space-y-3">
            <div className="text-[10px] uppercase font-bold text-blue-300 tracking-wider">
              Kết Quả Dự Tính Mô Phỏng
            </div>

            <div className="flex justify-between items-baseline border-b border-white/10 pb-2">
              <span className="text-xs text-slate-300">Tổng hóa đơn phòng:</span>
              <span className="text-base font-bold font-mono text-white">
                {simCalculation.totalVnd.toLocaleString('vi-VN')} ₫
              </span>
            </div>

            <div className="flex justify-between items-baseline border-b border-white/10 pb-2">
              <span className="text-xs text-slate-300">Bình quân 1 người:</span>
              <span className="text-xl font-extrabold font-mono text-emerald-400">
                {simCalculation.perStudentVnd.toLocaleString('vi-VN')} ₫
              </span>
            </div>

            <div className="text-[11px] text-slate-300 flex items-center gap-1.5 pt-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span>
                {simKwh < billData.kwhConsumed
                  ? `Tiết kiệm được ~${(billData.perStudentVnd - simCalculation.perStudentVnd).toLocaleString('vi-VN')} ₫ / người so với hóa đơn tháng này!`
                  : simKwh === billData.kwhConsumed
                  ? 'Bằng đúng với lượng điện thực tế của phòng tháng này.'
                  : `Tăng thêm ~${(simCalculation.perStudentVnd - billData.perStudentVnd).toLocaleString('vi-VN')} ₫ / người do chạm bậc thang cao hơn.`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* MY ENERGY FORECAST & PERSONAL SAVING INSIGHT CARD */}
      <div className="admin-card p-6 bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 text-white border-emerald-900/60 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Dự Báo & Phân Tích Tiêu Thụ Phòng {billData.roomNumber}</h3>
              <p className="text-xs text-emerald-200/80">
                Mô hình AI LSTM Forecaster cá nhân hóa cho vi khí hậu phòng bạn
              </p>
            </div>
          </div>
          <Badge variant="success" size="sm">
            Mức tiêu thụ tiết kiệm Green Dorm
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-emerald-300" />
              <span>Khung Giờ Cao Điểm Tối Nay</span>
            </div>
            <div className="text-lg font-bold">20:00 - 22:30</div>
            <p className="text-xs text-slate-300 mt-1">Dự kiến đạt đỉnh ~1.2 kW khi cả phòng bật điều hòa và đèn học.</p>
          </div>

          <div className="p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 mb-1 flex items-center gap-1">
              <Leaf className="w-3.5 h-3.5 text-emerald-300" />
              <span>Tiềm Năng Tiết Kiệm</span>
            </div>
            <div className="text-lg font-bold text-emerald-400">~15.000 ₫ / tháng</div>
            <p className="text-xs text-slate-300 mt-1">Nếu tắt bình nóng lạnh sau khi dùng và tăng nhiệt độ điều hòa thêm 1°C.</p>
          </div>

          <div className="p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300 mb-1 flex items-center gap-1">
              <Lightbulb className="w-3.5 h-3.5 text-amber-300" />
              <span>Mẹo Tiết Kiệm Tối Nay</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Bật điều hòa ở mức <strong>26°C kết hợp quạt gió</strong> và hẹn giờ tắt lúc 03:00 sáng để tiết kiệm thêm 12% điện.
            </p>
          </div>
        </div>
      </div>

      {/* Room Daily Consumption Chart */}
      <div className="admin-card p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Biểu Đồ Tiêu Thụ Điện 7 Ngày Qua (Phòng {billData.roomNumber})</h3>
            <p className="text-xs text-slate-500 mt-0.5">Sản lượng điện năng đo được qua công tơ thông minh IoT</p>
          </div>
          <Badge variant="neutral" size="sm">
            Trung bình: 8.3 kWh / ngày
          </Badge>
        </div>

        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={roomEnergyWeek} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="studentEnergyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
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
              <Area type="monotone" dataKey="kwh" name="Điện Tiêu Thụ (kWh)" stroke="#059669" strokeWidth={2} fill="url(#studentEnergyGrad)" dot={{ r: 3, fill: '#059669' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
