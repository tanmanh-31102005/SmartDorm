'use client';
import { useState } from 'react';
import { MetricCard } from '@/components/ui/MetricCard';
import { Badge } from '@/components/ui/Badge';
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
  Lightbulb
} from 'lucide-react';

export default function StudentEnergyPage() {
  const roomEnergyWeek = [
    { day: 'T2', kwh: 7.8, cost: 17500 },
    { day: 'T3', kwh: 8.2, cost: 18500 },
    { day: 'T4', kwh: 7.5, cost: 16900 },
    { day: 'T5', kwh: 8.9, cost: 20100 },
    { day: 'T6', kwh: 9.1, cost: 20500 },
    { day: 'T7', kwh: 8.4, cost: 18900 },
    { day: 'CN', kwh: 8.4, cost: 18900 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Theo Dõi Điện Năng Phòng A101</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Lịch sử tiêu thụ điện của phòng, dự tính chi phí hóa đơn và chia tiền điện theo đầu người.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="success" size="md">
            Mức tiêu thụ tiết kiệm chuẩn Green Dorm
          </Badge>
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
          label="TỔNG TIÊU THỤ THÁNG NÀY"
          value="126.0 kWh"
          subValue="Kỳ hóa đơn: 01/08 - 31/08"
          tag="Đang ghi nhận"
          tagVariant="info"
          icon={<Calendar className="w-4 h-4 text-blue-900" />}
          iconBg="bg-blue-50 text-blue-900"
        />

        <MetricCard
          label="ƯỚC TÍNH TIỀN ĐIỆN PHÒNG"
          value="285.000 ₫"
          subValue="Đơn giá KTX: ~2.260 ₫ / kWh"
          tag="Hóa đơn phòng"
          tagVariant="neutral"
          icon={<DollarSign className="w-4 h-4 text-slate-700" />}
          iconBg="bg-slate-100 text-slate-700"
        />

        <MetricCard
          label="BÌNH QUÂN MỖI SINH VIÊN"
          value="71.250 ₫"
          subValue="Chia đều cho 4 bạn cùng phòng"
          tag="1 Người"
          tagVariant="purple"
          icon={<Users className="w-4 h-4 text-purple-700" />}
          iconBg="bg-purple-50 text-purple-700"
        />
      </div>

      {/* MY ENERGY FORECAST & PERSONAL SAVING INSIGHT CARD */}
      <div className="admin-card p-6 bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 text-white border-emerald-900/60 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Dự Báo Điện Năng Ngày Mai (My Room Energy Forecast)
                </h3>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  AI Prediction
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Dự báo mức tiêu thụ điện dựa trên lịch trình sinh hoạt và thời tiết ngày mai
              </p>
            </div>
          </div>

          <Badge variant="success" size="sm">
            <Leaf className="w-3.5 h-3.5 mr-1" />
            <span>Tiết kiệm 8% vs tuần trước</span>
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Predicted Range */}
          <div className="p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 mb-1">
              Dự Báo Ngày Mai (Khoảng Ước Tính)
            </div>
            <div className="text-2xl font-bold font-mono text-white mb-1">
              7.9 – 9.1 kWh
            </div>
            <div className="text-xs text-slate-300">
              Chi phí ước tính: <strong className="text-emerald-300">~18.000 – 20.500 ₫</strong>
            </div>
          </div>

          {/* Room Saving Insight */}
          <div className="p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
            <div className="text-[10px] font-bold uppercase tracking-wider text-teal-300 mb-1">
              Đánh Giá Thói Quen Của Phòng
            </div>
            <div className="text-sm font-bold text-white mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Tiết Kiệm Rất Tốt</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Phòng A101 giảm được <strong>0.7 kWh/ngày</strong> nhờ thói quen tắt bình nóng lạnh và điều hòa khi ra ngoài học.
            </p>
          </div>

          {/* Student Eco Tip */}
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
            <h3 className="text-sm font-bold text-slate-900">Biểu Đồ Tiêu Thụ Điện 7 Ngày Qua (Phòng A101)</h3>
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
