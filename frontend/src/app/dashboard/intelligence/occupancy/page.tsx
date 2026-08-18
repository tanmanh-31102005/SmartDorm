'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MetricCard } from '@/components/ui/MetricCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import {
  OCCUPANCY_HEATMAP_DATA,
  HOURLY_OCCUPANCY_CURVE,
  RoomOccupancyPrediction,
  AI_MODELS_DATA,
} from '@/lib/intelligence-data';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import {
  Users,
  Building2,
  Layers,
  Sparkles,
  Zap,
  TrendingUp,
  Clock,
  CheckCircle2,
  Thermometer,
  ShieldCheck,
  DoorClosed,
  Sliders,
  ArrowRight,
  Info,
  Calendar,
} from 'lucide-react';
import { useToast } from '@/components/ui/ToastContext';
import { useIntelligenceStore } from '@/lib/intelligence-store';

export default function OccupancyPredictionPage() {
  const router = useRouter();
  const { success, info } = useToast();
  const { occupancyRooms, applyHvacPolicy, models } = useIntelligenceStore();
  const [selectedBuilding, setSelectedBuilding] = useState('ALL');
  const [selectedFloor, setSelectedFloor] = useState<number | 'ALL'>('ALL');
  const [selectedRoom, setSelectedRoom] = useState<RoomOccupancyPrediction | null>(null);

  const occupancyModel = models.find((m) => m.id === 'mdl-occupancy-v1') || models[3];

  // Filtered heatmap rooms
  const filteredRooms = useMemo(() => {
    return occupancyRooms.filter((r) => {
      const matchBuilding = selectedBuilding === 'ALL' || r.buildingName === selectedBuilding;
      const matchFloor = selectedFloor === 'ALL' || r.floor === Number(selectedFloor);
      return matchBuilding && matchFloor;
    });
  }, [occupancyRooms, selectedBuilding, selectedFloor]);

  const totalCapacity = filteredRooms.reduce((acc, r) => acc + r.capacity, 0);
  const totalOccupied = filteredRooms.reduce((acc, r) => acc + r.currentOccupied, 0);
  const avgOccupancyRate =
    filteredRooms.length > 0
      ? Math.round(
          filteredRooms.reduce((acc, r) => acc + r.predictedOccupancyRate, 0) / filteredRooms.length
        )
      : 0;

  const vacantRoomsCount = filteredRooms.filter((r) => r.predictedOccupancyRate < 40).length;

  const handleApplyEco = async (room: RoomOccupancyPrediction) => {
    const res = await applyHvacPolicy(room.roomId, room.recommendedHvacState);
    success(res.message, 'HVAC POLICY');
    setSelectedRoom(null);
  };



  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-xl bg-blue-900 text-white shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Spatial Occupancy Prediction & Dynamic HVAC Orchestration
            </h1>
            <Badge variant="purple" size="md">
              XGBoost Classifier v1.2
            </Badge>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Mô hình kết hợp quẹt thẻ RFID và cảm biến vi khí hậu để dự báo mật độ sinh viên theo phòng & tự động điều chỉnh chế độ điều hòa.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/dashboard/residents">
            <Button variant="secondary" size="sm" icon={<Users className="w-3.5 h-3.5" />}>
              Danh Sách Sinh Viên
            </Button>
          </Link>
          <Link href="/dashboard/intelligence/recommendations">
            <Button variant="primary" size="sm" icon={<Sparkles className="w-3.5 h-3.5" />}>
              Khuyến Nghị Tiết Kiệm Năng Lượng
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Control Filters */}
      <div className="admin-card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Building Selector */}
          <div className="flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-slate-400" />
            <select
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(e.target.value)}
              className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none hover:bg-white focus:bg-white focus:border-blue-900 cursor-pointer"
            >
              <option value="ALL">Tất Cả Tòa Nhà (A, B, C)</option>
              <option value="A">Tòa Nhà A</option>
              <option value="B">Tòa Nhà B</option>
              <option value="C">Tòa Nhà C</option>
            </select>
          </div>

          {/* Floor Selector */}
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-slate-400" />
            <select
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none hover:bg-white focus:bg-white focus:border-blue-900 cursor-pointer"
            >
              <option value="ALL">Tất Cả Các Tầng</option>
              <option value={1}>Tầng 1 (Trệt)</option>
              <option value={2}>Tầng 2</option>
              <option value={3}>Tầng 3</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
          <span>Tổng số phòng lọc: <strong className="text-slate-900 font-mono">{filteredRooms.length}</strong></span>
          <span>Phòng trống tiềm năng: <strong className="text-amber-700 font-mono">{vacantRoomsCount} phòng</strong></span>
        </div>
      </div>

      {/* 3. Four Key Occupancy KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="TỶ LỆ LƯU TRÚ DỰ BÁO TB"
          value={`${avgOccupancyRate}%`}
          change={{ value: '+4.2%', trend: 'up', label: 'cao điểm tối nay' }}
          subValue={`${totalOccupied}/${totalCapacity} chỗ đã có người`}
          tag="Campus Average"
          tagVariant="success"
          icon={<Users className="w-4 h-4 text-blue-900" />}
          iconBg="bg-blue-50 text-blue-900"
        />

        <MetricCard
          label="KHUNG GIỜ ĐÔNG NHẤT"
          value="20:00 - 23:00"
          subValue="Dự kiến 97% sinh viên có mặt"
          tag="Peak Occupancy"
          tagVariant="purple"
          icon={<Clock className="w-4 h-4 text-purple-700" />}
          iconBg="bg-purple-50 text-purple-700"
        />

        <MetricCard
          label="PHÒNG TRỐNG CẦN TẮT ĐIỆN"
          value={`0${vacantRoomsCount} Phòng`}
          subValue="Xác suất Zero Occupancy > 95%"
          tag="Lãng phí điện"
          tagVariant={vacantRoomsCount > 0 ? 'warning' : 'neutral'}
          icon={<Zap className="w-4 h-4 text-amber-700" />}
          iconBg="bg-amber-50 text-amber-700"
          onClick={() => setSelectedFloor('ALL')}
        />

        <MetricCard
          label="TIẾT KIỆM KHI TỐI ƯU HVAC"
          value="7.3 Tr ₫ / tháng"
          change={{ value: '-108 kWh', trend: 'down', label: 'mỗi ngày' }}
          subValue="Chế độ ECO & Standby"
          tag="Green Campus"
          tagVariant="success"
          icon={<Sparkles className="w-4 h-4 text-emerald-700" />}
          iconBg="bg-emerald-50 text-emerald-700"
          onClick={() => router.push('/dashboard/intelligence/recommendations')}
        />
      </div>

      {/* 4. Peak Occupancy Distribution Chart (00:00 - 23:00) */}
      <div className="admin-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Phân Bố Mật Độ Lưu Trú Theo 24 Giờ Trong Ngày (Hourly Occupancy Profile)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Dữ liệu chu kỳ lịch học, quẹt thẻ cửa ra vào RFID và lịch sử hiện diện của 842 sinh viên KTX
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-blue-900">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-900" />
              Tỷ lệ có mặt (%)
            </span>
            <span className="flex items-center gap-1.5 text-emerald-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              Công suất điện tương ứng (kW)
            </span>
          </div>
        </div>

        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={HOURLY_OCCUPANCY_CURVE} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="hour" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} unit="%" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
                formatter={(val: any, name: any) => [
                  name === 'occupancyPercent' ? `${val}% (~${Math.round(val * 8.42)} SV)` : `${val} kW`,
                  name === 'occupancyPercent' ? 'Tỷ lệ có mặt' : 'Công suất tiêu thụ',
                ]}
              />
              <Bar dataKey="occupancyPercent" radius={[6, 6, 0, 0]} name="occupancyPercent">
                {HOURLY_OCCUPANCY_CURVE.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.occupancyPercent >= 80 ? '#1e3a8a' : entry.occupancyPercent >= 40 ? '#3b82f6' : '#94a3b8'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500">
          <span>Giờ học giảng đường: <strong>08:00 - 16:30 (Mật độ KTX thấp &lt; 35%)</strong></span>
          <span>Giờ sinh hoạt chính: <strong>19:00 - 23:30 (Mật độ KTX cao &gt; 90%)</strong></span>
        </div>
      </div>

      {/* 5. Visual Heatmap / Room Status Grid */}
      <div className="admin-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Bản Đồ Trực Quan Mật Độ Phòng KTX (Room Occupancy Heatmap)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Click vào từng phòng để xem chi tiết quẹt thẻ, cấu hình điều hòa và khuyến nghị tối ưu
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-emerald-800">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Đầy (≥ 80%)
            </span>
            <span className="flex items-center gap-1.5 text-amber-800">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              Vừa (40 - 79%)
            </span>
            <span className="flex items-center gap-1.5 text-slate-500">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
              Trống (&lt; 40%)
            </span>
          </div>
        </div>

        {/* Responsive Interactive Room Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredRooms.map((room) => {
            const isHigh = room.predictedOccupancyRate >= 80;
            const isMid = room.predictedOccupancyRate >= 40 && room.predictedOccupancyRate < 80;
            const isVacant = room.predictedOccupancyRate < 40;

            return (
              <div
                key={room.roomId}
                onClick={() => setSelectedRoom(room)}
                className={`p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 ${
                  isHigh
                    ? 'bg-emerald-50/60 border-emerald-200 hover:border-emerald-300'
                    : isMid
                    ? 'bg-amber-50/60 border-amber-200 hover:border-amber-300'
                    : 'bg-slate-50/80 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">
                      Tòa {room.buildingName} · Tầng {room.floor}
                    </div>
                    <div className="text-base font-bold text-slate-900">
                      Phòng {room.roomNumber}
                    </div>
                  </div>

                  <Badge
                    variant={isHigh ? 'success' : isMid ? 'warning' : 'neutral'}
                    size="sm"
                    dot
                  >
                    {room.predictedOccupancyRate}% Occupied
                  </Badge>
                </div>

                {/* Occupancy Indicator Bar */}
                <div className="my-2.5 space-y-1">
                  <div className="flex justify-between text-[11px] font-medium text-slate-500">
                    <span>Sinh viên hiện diện</span>
                    <span className="font-bold text-slate-800">
                      {room.currentOccupied}/{room.capacity} Bạn
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200/80 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isHigh ? 'bg-emerald-600' : isMid ? 'bg-amber-500' : 'bg-slate-400'
                      }`}
                      style={{ width: `${(room.currentOccupied / room.capacity) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">HVAC Đề Xuất:</span>
                  <span
                    className={`font-bold font-mono px-1.5 py-0.5 rounded text-[10px] ${
                      room.recommendedHvacState === 'COMFORT'
                        ? 'bg-blue-100 text-blue-900'
                        : room.recommendedHvacState === 'ECO'
                        ? 'bg-emerald-100 text-emerald-900'
                        : 'bg-red-100 text-red-900'
                    }`}
                  >
                    {room.recommendedHvacState}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Room Occupancy Detail Drawer */}
      <Drawer
        isOpen={!!selectedRoom}
        onClose={() => setSelectedRoom(null)}
        title={
          selectedRoom && (
            <div className="flex items-center gap-2">
              <DoorClosed className="w-5 h-5 text-blue-900" />
              <span>Phòng {selectedRoom.buildingName}{selectedRoom.roomNumber} — Dự Đoán Lưu Trú</span>
            </div>
          )
        }
        description={
          selectedRoom && (
            <span>
              Tòa Nhà {selectedRoom.buildingName} · Tầng {selectedRoom.floor} · Sức chứa {selectedRoom.capacity} sinh viên
            </span>
          )
        }
        width="max-w-md"
      >
        {selectedRoom && (
          <div className="space-y-5 text-xs">
            {/* Occupancy Status Banner */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Tỷ Lệ Có Mặt Dự Báo</span>
                <span className="text-2xl font-bold font-mono text-blue-900">
                  {selectedRoom.predictedOccupancyRate}%
                </span>
              </div>
              <div className="text-right">
                <Badge
                  variant={
                    selectedRoom.predictedOccupancyRate >= 80
                      ? 'success'
                      : selectedRoom.predictedOccupancyRate >= 40
                      ? 'warning'
                      : 'neutral'
                  }
                  size="md"
                >
                  {selectedRoom.status}
                </Badge>
                <div className="text-[10px] text-slate-400 font-mono mt-1">
                  Tin cậy: {selectedRoom.confidence}%
                </div>
              </div>
            </div>

            {/* Spatial Details */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                Chi Tiết Cư Dân & Cảm Biến Phòng
              </h4>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Số sinh viên đang trong phòng:</span>
                  <span className="font-bold text-slate-800">{selectedRoom.currentOccupied} sinh viên</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Khung giờ đông nhất dự báo:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedRoom.peakHour}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ghi nhận quẹt thẻ gần nhất:</span>
                  <span className="font-mono text-emerald-700 font-bold">19:42:15 (SV2024001)</span>
                </div>
              </div>
            </div>

            {/* HVAC Recommendation */}
            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-950 space-y-2">
              <div className="flex items-center gap-1.5 font-bold">
                <Sparkles className="w-4 h-4 text-blue-900" />
                <span>Chiến Lược Điều Hòa Tự Động (Dynamic HVAC):</span>
              </div>
              <p className="text-blue-900 leading-relaxed">
                {selectedRoom.predictedOccupancyRate >= 80
                  ? 'Phòng có đông sinh viên lưu trú. Khuyến nghị duy trì nhiệt độ Comfort 25.5°C để đảm bảo vi khí hậu.'
                  : selectedRoom.predictedOccupancyRate >= 40
                  ? 'Phòng có ít sinh viên. Khuyến nghị kích hoạt chế độ ECO 27.0°C để tiết kiệm 18% điện năng.'
                  : 'Phòng hiện không có sinh viên. Khuyến nghị tắt điều hòa hoặc chuyển về Standby.'}
              </p>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-200 flex items-center gap-2">
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => handleApplyEco(selectedRoom)}
              >
                Áp Dụng Chế Độ {selectedRoom.recommendedHvacState}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setSelectedRoom(null)}
              >
                Đóng
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
