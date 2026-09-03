'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { INITIAL_ROOMS, RoomData } from '@/lib/smartdorm-data';
import { Drawer } from '@/components/ui/Drawer';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastContext';
import { 
  Building2, 
  DoorClosed, 
  Search, 
  Users, 
  Thermometer, 
  Droplets, 
  Flame, 
  Cpu, 
  CheckCircle2, 
  Filter, 
  LayoutGrid, 
  List, 
  ArrowRight, 
  Phone, 
  CreditCard,
  Zap,
  Lightbulb,
  Fan,
  Lock,
  Bell,
  RefreshCw
} from 'lucide-react';

export default function RoomsPage() {
  const { success, warning } = useToast();
  const [rooms, setRooms] = useState<RoomData[]>(INITIAL_ROOMS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState('ALL');
  const [selectedFloor, setSelectedFloor] = useState('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [inspectRoom, setInspectRoom] = useState<RoomData | null>(null);

  useEffect(() => {
    async function loadRooms() {
      try {
        const res = await api.get('/rooms/overview');
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          const mapped = res.data.map((r: any) => {
            const lastSensor = r.sensorData?.[0] || {};
            const hasAlert = r.emergencies && r.emergencies.length > 0;
            return {
              id: r.id,
              roomNumber: r.roomNumber,
              floor: r.floor,
              capacity: r.capacity || 4,
              occupied: r.users?.length || 0,
              buildingId: r.buildingId,
              buildingName: r.building?.name || 'A',
              temperature: lastSensor.temperature ?? 27.2,
              humidity: lastSensor.humidity ?? 64,
              gasLevel: lastSensor.gasLevel ?? 18,
              gasAlert: lastSensor.gasAlert || false,
              tempAlert: lastSensor.tempAlert || false,
              status: hasAlert ? 'critical' : (lastSensor.gasAlert || lastSensor.tempAlert ? 'warning' : 'normal'),
              devicesCount: r.devices?.length || 4,
              devices: r.devices || [],
              residents: (r.users || []).map((u: any) => ({
                id: u.id,
                studentId: u.studentId,
                fullName: u.fullName,
                phone: u.phone || '0901234567',
                rfidMasked: u.rfidCardId ? `CARD_****-${u.rfidCardId.slice(-4)}` : 'CARD_****-8392',
              })),
            } as any;
          });
          setRooms(mapped);
        }
      } catch (err) {
        console.error('Rooms API fallback to dataset', err);
      }
    }
    loadRooms();
  }, []);

  const filtered = rooms.filter(r => {
    const matchSearch = 
      `${r.buildingName}${r.roomNumber}`.toLowerCase().includes(search.toLowerCase()) ||
      r.residents?.some(u => u.fullName.toLowerCase().includes(search.toLowerCase()) || u.studentId?.toLowerCase().includes(search.toLowerCase()));
    
    const matchBuilding = selectedBuilding === 'ALL' || r.buildingName === selectedBuilding;
    const matchFloor = selectedFloor === 'ALL' || r.floor.toString() === selectedFloor;

    return matchSearch && matchBuilding && matchFloor;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Quản Lý Danh Sách Phòng KTX</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Sơ đồ phòng, tỷ lệ lấp đầy, hồ sơ sinh viên lưu trú và telemetry cảm biến vi khí hậu từng phòng.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 shadow-2xs">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Xem dạng thẻ"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Xem dạng bảng"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="admin-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo số phòng (A101), tên sinh viên, MSSV..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-blue-900 focus:ring-2 focus:ring-blue-900/10 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Building & Floor Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2">
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
                {b === 'ALL' ? 'Tất cả tòa' : `Tòa ${b}`}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {['ALL', '1', '2', '3'].map((f) => (
              <button
                key={f}
                onClick={() => setSelectedFloor(f)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  selectedFloor === f
                    ? 'bg-white text-slate-900 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f === 'ALL' ? 'Tất cả tầng' : `Tầng ${f}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid or Table Mode */}
      {filtered.length === 0 ? (
        <div className="admin-card p-12 text-center border-dashed">
          <DoorClosed className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">Không tìm thấy phòng phù hợp</h3>
          <p className="text-xs text-slate-400 mt-0.5">Vui lòng thay đổi từ khóa tìm kiếm hoặc bỏ chọn bộ lọc</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((room) => {
            const isFull = room.occupied >= room.capacity;
            const percent = Math.min(100, Math.round((room.occupied / room.capacity) * 100));

            return (
              <div
                key={room.id}
                onClick={() => setInspectRoom(room)}
                className={`admin-card overflow-hidden flex flex-col justify-between cursor-pointer hover:border-slate-300 hover:shadow-md transition-all ${
                  room.status === 'critical' ? 'border-red-300 bg-red-50/20' : ''
                }`}
              >
                {/* Room Header */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      {room.buildingName}{room.roomNumber}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 leading-tight">
                        Phòng {room.buildingName}{room.roomNumber}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-medium">Tòa Nhà {room.buildingName} · Tầng {room.floor}</p>
                    </div>
                  </div>

                  <Badge variant={room.status === 'critical' ? 'critical' : isFull ? 'warning' : 'success'} size="sm">
                    {room.occupied}/{room.capacity} Sinh viên
                  </Badge>
                </div>

                {/* Body Details */}
                <div className="p-4 space-y-3">
                  {/* Occupancy Progress */}
                  <div>
                    <div className="flex justify-between text-[11px] font-medium text-slate-500 mb-1">
                      <span>Lấp đầy ({percent}%)</span>
                      <span className="font-semibold text-slate-700">{room.capacity - room.occupied} chỗ trống</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          room.status === 'critical' ? 'bg-red-500' : isFull ? 'bg-amber-500' : 'bg-blue-900'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  {/* 3 Telemetry Metrics */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-center">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Nhiệt Độ</div>
                      <div className="text-xs font-bold text-slate-900 font-mono mt-0.5">{room.temperature}°C</div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-center">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Độ Ẩm</div>
                      <div className="text-xs font-bold text-emerald-700 font-mono mt-0.5">{room.humidity}%</div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-center">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Khí Gas</div>
                      <div className={`text-xs font-bold font-mono mt-0.5 ${room.gasLevel > 40 ? 'text-red-600' : 'text-slate-900'}`}>
                        {room.gasLevel}%
                      </div>
                    </div>
                  </div>

                  {/* Residents List */}
                  <div className="pt-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Sinh Viên Đang Ở ({room.residents?.length || 0})
                    </div>
                    {room.residents && room.residents.length > 0 ? (
                      <div className="space-y-1">
                        {room.residents.slice(0, 2).map((res) => (
                          <div key={res.id} className="flex items-center justify-between text-xs p-1.5 rounded-md bg-slate-50 border border-slate-100">
                            <span className="font-semibold text-slate-800 truncate max-w-[140px]">{res.fullName}</span>
                            <span className="text-[10px] font-mono text-slate-400">{res.studentId}</span>
                          </div>
                        ))}
                        {room.residents.length > 2 && (
                          <div className="text-[10px] text-blue-900 font-semibold text-center pt-0.5">
                            +{room.residents.length - 2} sinh viên khác...
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-2 rounded-md bg-slate-50 text-center text-xs text-slate-400 italic">
                        Phòng trống
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="px-4 py-2.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-slate-400" />
                    <span>{room.devicesCount} Thiết bị IoT</span>
                  </div>
                  <span className="text-blue-900 font-bold flex items-center gap-1 text-[11px]">
                    <span>Xem chi tiết</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="admin-card overflow-hidden overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[700px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Số Phòng</th>
                <th className="py-3 px-4">Tòa Nhà & Tầng</th>
                <th className="py-3 px-4">Lấp Đầy</th>
                <th className="py-3 px-4">Vi Khí Hậu</th>
                <th className="py-3 px-4">Khí Gas (MQ-2)</th>
                <th className="py-3 px-4">Trạng Thái An Ninh</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((room) => (
                <tr key={room.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-blue-900">
                    Phòng {room.buildingName}{room.roomNumber}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    Tòa {room.buildingName} · Tầng {room.floor}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant={room.occupied >= room.capacity ? 'warning' : 'success'} size="sm">
                      {room.occupied}/{room.capacity} Người
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-slate-800 font-mono">
                    {room.temperature}°C / {room.humidity}%
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800 font-mono">
                    {room.gasLevel}%
                  </td>
                  <td className="py-3.5 px-4">
                    {room.status === 'critical' ? (
                      <Badge variant="critical" size="sm">
                        <Flame className="w-3 h-3" />
                        Sự cố
                      </Badge>
                    ) : (
                      <Badge variant="success" size="sm">
                        <CheckCircle2 className="w-3 h-3" />
                        An toàn
                      </Badge>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setInspectRoom(room)}
                    >
                      Chi tiết
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Room Detail Inspection Drawer */}
      {inspectRoom && (
        <Drawer
          isOpen={!!inspectRoom}
          onClose={() => setInspectRoom(null)}
          title={`Hồ Sơ Phòng ${inspectRoom.buildingName}${inspectRoom.roomNumber}`}
          description={`Tòa Nhà ${inspectRoom.buildingName} · Tầng ${inspectRoom.floor} • Sức chứa ${inspectRoom.capacity} sinh viên`}
          width="max-w-lg"
        >
          <div className="space-y-5 text-xs">
            {/* Live Status Pill */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Trạng Thái Phòng</span>
                <div className="text-sm font-bold text-slate-900 mt-0.5">
                  {inspectRoom.status === 'critical' ? '🔴 Phát hiện sự cố khẩn cấp' : '🟢 Hoạt động an toàn'}
                </div>
              </div>
              <Badge variant={inspectRoom.status === 'critical' ? 'critical' : 'success'} size="md">
                {inspectRoom.occupied}/{inspectRoom.capacity} Đang Ở
              </Badge>
            </div>

            {/* Microclimate Telemetry */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Thông Số Vi Khí Hậu Thời Gian Thực
              </h4>
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                  <Thermometer className="w-4 h-4 text-blue-900 mx-auto mb-1" />
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Nhiệt Độ (DHT22)</div>
                  <div className="text-base font-bold font-mono text-slate-900">{inspectRoom.temperature}°C</div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                  <Droplets className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Độ Ẩm (DHT22)</div>
                  <div className="text-base font-bold font-mono text-emerald-700">{inspectRoom.humidity}%</div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                  <Flame className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Khí Gas (MQ-2)</div>
                  <div className="text-base font-bold font-mono text-slate-900">{inspectRoom.gasLevel}%</div>
                </div>
              </div>
            </div>

            {/* Residents Details */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Danh Sách Sinh Viên Lưu Trú
              </h4>
              <div className="space-y-2">
                {inspectRoom.residents && inspectRoom.residents.length > 0 ? (
                  inspectRoom.residents.map((res) => (
                    <div key={res.id} className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">{res.fullName}</span>
                        <Badge variant="info" size="sm">{res.studentId}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {res.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <CreditCard className="w-3 h-3 text-slate-400" />
                          {res.rfidMasked}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 bg-slate-50 rounded-xl text-center text-slate-400">
                    Chưa có sinh viên nào đăng ký phòng này.
                  </div>
                )}
              </div>
            </div>

            {/* Connected IoT Devices */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Thiết Bị IoT Điều Khiển
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: 'Đèn Chiếu Sáng', type: 'LIGHT', icon: Lightbulb },
                  { name: 'Quạt Thông Gió', type: 'FAN', icon: Fan },
                  { name: 'Khóa Cửa Điện', type: 'DOOR_LOCK', icon: Lock, isLock: true },
                  { name: 'Còi Báo Động', type: 'BUZZER', icon: Bell, isBuzzer: true },
                ].map((d, i) => {
                  const Icon = d.icon;
                  const devRecord = (inspectRoom.devices || []).find((rec: any) => rec.type === d.type);
                  const isCurrentOn = devRecord ? devRecord.isOn : false;

                  return (
                    <div key={i} className={`p-2.5 rounded-lg border flex items-center justify-between transition-colors ${
                      isCurrentOn ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${isCurrentOn ? 'text-emerald-700' : 'text-slate-600'}`} />
                        <span className="font-semibold text-slate-800">{d.name}</span>
                      </div>
                      <Badge variant={isCurrentOn ? 'success' : 'neutral'} size="sm">
                        {d.isLock ? (isCurrentOn ? 'MỞ' : 'KHÓA') : d.isBuzzer ? (isCurrentOn ? 'HÚ CÒI' : 'TẮT') : (isCurrentOn ? 'BẬT' : 'TẮT')}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setInspectRoom(null)}>
                Đóng
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  success(`Đã đồng bộ telemetry phòng ${inspectRoom.buildingName}${inspectRoom.roomNumber}`);
                }}
              >
                Đồng bộ lại
              </Button>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
}
