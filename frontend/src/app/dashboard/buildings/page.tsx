'use client';
import { useState } from 'react';
import { BUILDINGS_DATA, INITIAL_ROOMS, BuildingData, RoomData } from '@/lib/smartdorm-data';
import { MetricCard } from '@/components/ui/MetricCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { 
  Building2, 
  DoorClosed, 
  Users, 
  Cpu, 
  Zap, 
  Thermometer, 
  Droplets, 
  Flame, 
  CheckCircle2, 
  Search, 
  Filter, 
  ArrowRight,
  Info,
  MapPin,
  Layers
} from 'lucide-react';

export default function BuildingsPage() {
  const [buildings, setBuildings] = useState<BuildingData[]>(BUILDINGS_DATA);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingData | null>(null);
  const [activeFloor, setActiveFloor] = useState<number>(1);
  const [search, setSearch] = useState('');

  const filteredBuildings = buildings.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase()) || 
    b.address.toLowerCase().includes(search.toLowerCase())
  );

  const buildingRooms = selectedBuilding 
    ? INITIAL_ROOMS.filter(r => r.buildingName === selectedBuilding.name) 
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Quản Lý Tòa Nhà & Cơ Sở KTX</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Sơ đồ tổng thể 3 tòa nhà KTX (Tòa A, B, C), tỷ lệ lấp đầy phòng và mật độ thiết bị IoT.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="neutral" size="md">
            Tổng cộng: 3 Tòa Nhà · 248 Phòng KTX
          </Badge>
        </div>
      </div>

      {/* 3 Building Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredBuildings.map((b) => (
          <div 
            key={b.id}
            className="admin-card overflow-hidden flex flex-col justify-between"
          >
            <div>
              {/* Header Banner */}
              <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-blue-900 via-blue-950 to-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md text-white font-extrabold text-base flex items-center justify-center border border-white/20">
                    {b.name}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white tracking-tight">Tòa Nhà {b.name}</h3>
                    <div className="text-[11px] text-blue-200 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{b.address}</span>
                    </div>
                  </div>
                </div>

                {b.alertCount > 0 ? (
                  <Badge variant="critical" size="sm">
                    {b.alertCount} Sự cố
                  </Badge>
                ) : (
                  <Badge variant="success" size="sm">
                    Hoạt động tốt
                  </Badge>
                )}
              </div>

              {/* Body Stats */}
              <div className="p-5 space-y-4">
                {/* Occupancy Bar */}
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
                    <span>Tỷ Lệ Lấp Đầy ({b.occupancyRate}%)</span>
                    <span className="text-slate-900">{b.occupiedRooms} / {b.totalRooms} phòng</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-900 rounded-full"
                      style={{ width: `${b.occupancyRate}%` }}
                    />
                  </div>
                </div>

                {/* Grid 2x2 Specs */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Số Tầng & Phòng</div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5">{b.floors} Tầng · {b.totalRooms} Phòng</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Thiết Bị IoT</div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5">{b.deviceCount} Nodes</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Nhiệt Độ TB</div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5 font-mono">{b.avgTemperature}°C</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Điện Năng Hôm Nay</div>
                    <div className="text-sm font-bold text-blue-900 mt-0.5 font-mono">{b.energyUsageTodayKwh} kWh</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Action */}
            <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                {b.totalRooms - b.occupiedRooms} phòng còn trống
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedBuilding(b)}
                icon={<ArrowRight className="w-3.5 h-3.5" />}
                iconPosition="right"
              >
                Chi tiết tòa {b.name}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Building Details Modal */}
      {selectedBuilding && (
        <Modal
          isOpen={!!selectedBuilding}
          onClose={() => setSelectedBuilding(null)}
          title={`Chi Tiết & Sơ Đồ Tòa Nhà ${selectedBuilding.name}`}
          description={`${selectedBuilding.address} • Quy mô ${selectedBuilding.floors} tầng, ${selectedBuilding.totalRooms} phòng`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            {/* Quick Metrics */}
            <div className="grid grid-cols-4 gap-2.5">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Tổng Phòng</div>
                <div className="text-lg font-bold text-slate-900 font-mono">{selectedBuilding.totalRooms}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Đang Ở</div>
                <div className="text-lg font-bold text-emerald-700 font-mono">{selectedBuilding.occupiedRooms}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Thiết Bị IoT</div>
                <div className="text-lg font-bold text-blue-900 font-mono">{selectedBuilding.deviceCount}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Sự Cố</div>
                <div className="text-lg font-bold text-red-600 font-mono">{selectedBuilding.alertCount}</div>
              </div>
            </div>

            {/* Floor Filter Tabs */}
            <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-500 mr-2">Chọn Tầng:</span>
              {Array.from({ length: selectedBuilding.floors }).map((_, f) => (
                <button
                  key={f + 1}
                  onClick={() => setActiveFloor(f + 1)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeFloor === f + 1
                      ? 'bg-blue-900 text-white font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Tầng {f + 1}
                </button>
              ))}
            </div>

            {/* Room Matrix */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-2">
                <span>Danh Sách Phòng Tầng {activeFloor}</span>
                <span className="text-slate-400 font-medium">Khuôn viên Tòa {selectedBuilding.name}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {buildingRooms
                  .filter(r => r.floor === activeFloor)
                  .map(room => (
                    <div
                      key={room.id}
                      className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-blue-900">
                          Phòng {room.buildingName}{room.roomNumber}
                        </span>
                        <Badge variant={room.status === 'critical' ? 'critical' : 'success'} size="sm">
                          {room.occupied}/{room.capacity}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {room.temperature}°C · {room.humidity}%
                      </div>
                    </div>
                  ))}

                {buildingRooms.filter(r => r.floor === activeFloor).length === 0 && (
                  <div className="col-span-3 py-6 text-center text-xs text-slate-400">
                    Phòng tầng {activeFloor} đang được cấu hình telemetry...
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 text-right">
              <Button variant="secondary" size="sm" onClick={() => setSelectedBuilding(null)}>
                Đóng
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
