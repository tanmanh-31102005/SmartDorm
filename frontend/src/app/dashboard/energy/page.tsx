'use client';
import { useState } from 'react';
import { MetricCard } from '@/components/ui/MetricCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ENERGY_TREND_DATA } from '@/lib/smartdorm-data';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import { 
  Zap, 
  TrendingDown, 
  Building2, 
  DollarSign, 
  Sparkles, 
  Leaf, 
  AlertTriangle, 
  ArrowRight,
  Download,
  Clock
} from 'lucide-react';

export default function EnergyPage() {
  const [period, setPeriod] = useState<'24h' | '7d' | '30d'>('24h');
  const [selectedBuilding, setSelectedBuilding] = useState('ALL');

  const buildingComparison = [
    { name: 'Tòa Nhà A', kwh: 6420, cost: '14.8 Tr VNĐ', efficiency: '88%', status: 'Tiêu thụ cao' },
    { name: 'Tòa Nhà B', kwh: 5890, cost: '13.5 Tr VNĐ', efficiency: '92%', status: 'Ổn định' },
    { name: 'Tòa Nhà C', kwh: 6110, cost: '14.0 Tr VNĐ', efficiency: '95%', status: 'Hiệu quả nhất' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Hệ Thống Giám Sát & Tối Ưu Điện Năng</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Phân tích phụ tải công suất (kW), tổng sản lượng điện (kWh) và gợi ý tiết kiệm năng lượng toàn campus.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="success" size="md">
            <Leaf className="w-3.5 h-3.5 text-emerald-600" />
            <span>Tiết kiệm 8.6% so với tháng trước</span>
          </Badge>
        </div>
      </div>

      {/* 4 Energy KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="CÔNG SUẤT HIỆN THỜI"
          value="74.2 kW"
          subValue="Đỉnh tải lúc 20:00 (95 kW)"
          tag="Live Load"
          tagVariant="info"
          icon={<Zap className="w-4 h-4 text-blue-900" />}
          iconBg="bg-blue-50 text-blue-900"
        />

        <MetricCard
          label="ĐIỆN TIÊU THỤ HÔM NAY"
          value="18,420 kWh"
          change={{ value: '-8.6%', trend: 'down', label: 'vs cùng kỳ' }}
          subValue="Mục tiêu: < 20,000 kWh"
          tag="Đạt chỉ tiêu"
          tagVariant="success"
          icon={<TrendingDown className="w-4 h-4 text-emerald-700" />}
          iconBg="bg-emerald-50 text-emerald-700"
        />

        <MetricCard
          label="TỔNG TIÊU THỤ THÁNG NÀY"
          value="428,500 kWh"
          subValue="Dự kiến cả tháng: 540,000 kWh"
          tag="Chu kỳ 30 ngày"
          tagVariant="neutral"
          icon={<Building2 className="w-4 h-4 text-slate-700" />}
          iconBg="bg-slate-100 text-slate-700"
        />

        <MetricCard
          label="ƯỚC TÍNH CHI PHÍ TIỀN ĐIỆN"
          value="42.3 Triệu ₫"
          subValue="Tiết kiệm ~4.1 Tr ₫ nhờ AI Rule"
          tag="Đơn giá EVN Bậc 3"
          tagVariant="purple"
          icon={<DollarSign className="w-4 h-4 text-purple-700" />}
          iconBg="bg-purple-50 text-purple-700"
        />
      </div>

      {/* Energy Consumption Trend Chart */}
      <div className="admin-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Biểu Đồ Tiêu Thụ Điện Năng Theo Khung Giờ</h3>
            <p className="text-xs text-slate-500 mt-0.5">So sánh mức tiêu thụ giữa Tòa A, Tòa B và Tòa C</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              {[
                { id: '24h', label: '24 Giờ' },
                { id: '7d', label: '7 Ngày' },
                { id: '30d', label: '30 Ngày' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setPeriod(t.id as any)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    period === t.id ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={ENERGY_TREND_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorB" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorC" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d97706" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
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
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Area type="monotone" dataKey="buildingA" name="Tòa Nhà A (kWh)" stroke="#1e3a8a" strokeWidth={2} fill="url(#colorA)" />
              <Area type="monotone" dataKey="buildingB" name="Tòa Nhà B (kWh)" stroke="#059669" strokeWidth={2} fill="url(#colorB)" />
              <Area type="monotone" dataKey="buildingC" name="Tòa Nhà C (kWh)" stroke="#d97706" strokeWidth={2} fill="url(#colorC)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Building Comparison & Efficiency Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {buildingComparison.map((item, idx) => (
          <div key={idx} className="admin-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-900">{item.name}</span>
              <Badge variant={idx === 2 ? 'success' : idx === 0 ? 'warning' : 'info'} size="sm">
                {item.status}
              </Badge>
            </div>

            <div className="text-2xl font-bold font-mono text-blue-900">{item.kwh} kWh</div>

            <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-400">Chi phí ước tính:</span>
                <span className="font-semibold text-slate-800">{item.cost}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Chỉ số hiệu quả:</span>
                <span className="font-bold text-emerald-700 font-mono">{item.efficiency}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Energy Saving Recommendations */}
      <div className="admin-card p-5 bg-gradient-to-r from-emerald-50/60 via-blue-50/40 to-white border-emerald-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-700" />
            <h4 className="font-bold text-sm text-slate-900">Gợi Ý Tối Ưu Năng Lượng Tự Động (Smart Rule)</h4>
          </div>
          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
            Tự động tắt đèn hành lang các tòa nhà lúc 23:00 và cấu hình cảm biến nhiệt độ tự ngắt quạt thông gió khi phòng không có người giúp tiết kiệm thêm <strong>~5.2% điện năng</strong> mỗi tháng.
          </p>
        </div>

        <Button variant="primary" size="sm">
          Áp dụng quy tắc tự động
        </Button>
      </div>
    </div>
  );
}
