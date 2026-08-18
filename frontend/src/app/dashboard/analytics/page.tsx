'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { MetricCard } from '@/components/ui/MetricCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastContext';
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { 
  BarChart3, 
  PieChart as PieIcon, 
  Building2, 
  Users, 
  AlertTriangle, 
  ShieldCheck, 
  TrendingUp, 
  Download, 
  Sparkles,
  Zap,
  Activity,
  Layers
} from 'lucide-react';

const COLORS = ['#1e3a8a', '#059669', '#d97706', '#dc2626', '#7c3aed'];

export default function AnalyticsPage() {
  const { success } = useToast();
  const [loading, setLoading] = useState(false);

  const accessPieData = [
    { name: 'Thẻ Hợp Lệ (Authorized)', value: 1280, color: '#059669' },
    { name: 'Bị Từ Chối (Denied)', value: 4, color: '#dc2626' },
  ];

  const emergencyDistribution = [
    { name: 'Hỏa hoạn / Khói', value: 4 },
    { name: 'Rò rỉ khí gas', value: 3 },
    { name: 'Xâm nhập cửa', value: 2 },
    { name: 'Mất điện phụ tải', value: 1 },
  ];

  const reliabilityData = [
    { day: 'T2', lights: 99.2, fans: 98.5, locks: 99.8 },
    { day: 'T3', lights: 99.4, fans: 98.9, locks: 99.9 },
    { day: 'T4', lights: 99.1, fans: 98.2, locks: 99.7 },
    { day: 'T5', lights: 99.5, fans: 99.0, locks: 100 },
    { day: 'T6', lights: 98.9, fans: 98.4, locks: 99.8 },
    { day: 'T7', lights: 99.6, fans: 99.1, locks: 100 },
    { day: 'CN', lights: 99.8, fans: 99.3, locks: 100 },
  ];

  function handleExport() {
    success('Đang xuất dữ liệu phân tích sang định dạng CSV/Excel...', 'Xuất Dữ Liệu');
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Trung Tâm Phân Tích Dữ Liệu Lớn & BI (IoT Analytics)</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Chuyển hóa dữ liệu vi khí hậu và thiết bị từ InfluxDB thành các chỉ số hành động cho ban quản lý.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExport}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Xuất Dữ Liệu (Export)
          </Button>
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="ĐỘ TIN CẬY THIẾT BỊ"
          value="99.4%"
          change={{ value: '+0.2%', trend: 'up', label: 'vs tuần trước' }}
          subValue="Thời gian hoạt động liên tục"
          tag="Uptime SLA"
          tagVariant="success"
          icon={<ShieldCheck className="w-4 h-4 text-emerald-700" />}
          iconBg="bg-emerald-50 text-emerald-700"
        />

        <MetricCard
          label="TỶ LỆ XÁC THỰC THẺ RFID"
          value="99.7%"
          subValue="1,280 / 1,284 lượt thành công"
          tag="An toàn"
          tagVariant="info"
          icon={<Users className="w-4 h-4 text-blue-900" />}
          iconBg="bg-blue-50 text-blue-900"
        />

        <MetricCard
          label="TẦN SUẤT SỰ CỐ / TUẦN"
          value="03 Vụ"
          change={{ value: '-50%', trend: 'down', label: 'giảm 3 vụ' }}
          subValue="Thời gian phản ứng TB: 18s"
          tag="Cải thiện"
          tagVariant="success"
          icon={<AlertTriangle className="w-4 h-4 text-amber-600" />}
          iconBg="bg-amber-50 text-amber-600"
        />

        <MetricCard
          label="ĐIỂM HIỆU QUẢ NĂNG LƯỢNG"
          value="94 / 100"
          subValue="Đạt chuẩn Green Campus"
          tag="Hạng A"
          tagVariant="purple"
          icon={<Zap className="w-4 h-4 text-purple-700" />}
          iconBg="bg-purple-50 text-purple-700"
        />
      </div>

      {/* 2 Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* RFID Access Verification Chart */}
        <div className="admin-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <PieIcon className="w-4 h-4 text-blue-900" />
              <h3 className="text-sm font-bold text-slate-900">Tỷ Lệ Xác Thực Thẻ RFID 7 Ngày Qua</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Phân bổ số lượt quẹt thẻ hợp lệ và lượt bị từ chối do không đúng phòng
            </p>
          </div>

          <div className="h-[240px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={accessPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                  label={(props: any) => `${props.name}: ${props.value}`}
                >
                  {accessPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-6 pt-3 border-t border-slate-100 text-xs font-semibold">
            <div className="flex items-center gap-1.5 text-emerald-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <span>Hợp lệ (1,280 lượt)</span>
            </div>
            <div className="flex items-center gap-1.5 text-red-700">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
              <span>Từ chối (4 lượt)</span>
            </div>
          </div>
        </div>

        {/* Incident Frequency Distribution Bar Chart */}
        <div className="admin-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-4 h-4 text-blue-900" />
              <h3 className="text-sm font-bold text-slate-900">Phân Loại Sự Cố Ghi Nhận Theo Loại Hình</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Tần suất sự cố được Strategy Pattern phát hiện và xử lý tự động
            </p>
          </div>

          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={emergencyDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                />
                <Bar dataKey="value" name="Số lần" radius={[6, 6, 0, 0]}>
                  {emergencyDistribution.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t border-slate-100 text-xs text-slate-400 text-center font-medium">
            Dữ liệu ghi nhận thông qua Strategy Pattern & InfluxDB Time-Series
          </div>
        </div>
      </div>

      {/* Device Reliability Trends */}
      <div className="admin-card p-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Độ Tin Cậy Hoạt Động Của Thiết Bị IoT (%) Theo Tuần</h3>
            <p className="text-xs text-slate-500 mt-0.5">Tỷ lệ uptime của hệ thống chiếu sáng, quạt và khóa cửa điện</p>
          </div>
          <Badge variant="success" size="sm">
            99.4% TB Tuần
          </Badge>
        </div>

        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={reliabilityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
              <YAxis domain={[95, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              />
              <Line type="monotone" dataKey="locks" name="Khóa Cửa Điện (%)" stroke="#059669" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="lights" name="Đèn Chiếu Sáng (%)" stroke="#1e3a8a" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="fans" name="Quạt Thông Gió (%)" stroke="#d97706" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
