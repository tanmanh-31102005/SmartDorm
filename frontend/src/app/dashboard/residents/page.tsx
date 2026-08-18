'use client';
import { useState } from 'react';
import { INITIAL_ROOMS, RoomData } from '@/lib/smartdorm-data';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { 
  Users, 
  Search, 
  CreditCard, 
  DoorClosed, 
  Phone, 
  CheckCircle2, 
  Filter, 
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Building2,
  Clock
} from 'lucide-react';

interface ResidentItem {
  id: string;
  studentId: string;
  fullName: string;
  roomNumber: string;
  buildingName: string;
  floor: number;
  phone: string;
  rfidMasked: string;
  status: 'ACTIVE' | 'AWAY' | 'SUSPENDED';
  lastAccess: string;
}

export default function ResidentsPage() {
  const [search, setSearch] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [inspectResident, setInspectResident] = useState<ResidentItem | null>(null);

  // Flatten all residents from rooms
  const allResidents: ResidentItem[] = INITIAL_ROOMS.flatMap((r) =>
    (r.residents || []).map((res, i) => ({
      id: res.id,
      studentId: res.studentId,
      fullName: res.fullName,
      roomNumber: r.roomNumber,
      buildingName: r.buildingName,
      floor: r.floor,
      phone: res.phone,
      rfidMasked: res.rfidMasked,
      status: i % 5 === 0 ? 'AWAY' : 'ACTIVE',
      lastAccess: i === 0 ? '19:42 (Hôm nay)' : i === 1 ? '18:15 (Hôm nay)' : 'Hôm qua, 22:30',
    }))
  );

  const filtered = allResidents.filter((res) => {
    const matchSearch =
      res.fullName.toLowerCase().includes(search.toLowerCase()) ||
      res.studentId.toLowerCase().includes(search.toLowerCase()) ||
      `${res.buildingName}${res.roomNumber}`.toLowerCase().includes(search.toLowerCase());

    const matchBuilding = selectedBuilding === 'ALL' || res.buildingName === selectedBuilding;
    const matchStatus = selectedStatus === 'ALL' || res.status === selectedStatus;

    return matchSearch && matchBuilding && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Hồ Sơ Quản Lý Sinh Viên Lưu Trú</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Danh bạ cư xá KTX, thông tin thẻ từ RFID, liên lạc khẩn cấp và trạng thái ra vào.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="neutral" size="md">
            Tổng cộng: <strong className="text-slate-900 ml-1">842</strong> sinh viên lưu trú
          </Badge>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="admin-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo MSSV (SV2024...), họ tên, số phòng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-blue-900 focus:ring-2 focus:ring-blue-900/10 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Filters */}
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
            {[
              { id: 'ALL', label: 'Tất cả trạng thái' },
              { id: 'ACTIVE', label: 'Đang ở' },
              { id: 'AWAY', label: 'Tạm vắng' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setSelectedStatus(st.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  selectedStatus === st.id
                    ? 'bg-white text-slate-900 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Residents Table */}
      <div className="admin-card overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-900" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Danh Sách Sinh Viên KTX
            </h3>
          </div>
          <span className="text-xs text-slate-400">Hiển thị {filtered.length} sinh viên</span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            Không tìm thấy sinh viên phù hợp với từ khóa tìm kiếm.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Mã Sinh Viên</th>
                  <th className="py-3 px-4">Họ Và Tên</th>
                  <th className="py-3 px-4">Phòng / Tòa Nhà</th>
                  <th className="py-3 px-4">Thẻ RFID (Masked)</th>
                  <th className="py-3 px-4">Điện Thoại</th>
                  <th className="py-3 px-4">Lần Vào Cuối</th>
                  <th className="py-3 px-4">Trạng Thái</th>
                  <th className="py-3 px-4 text-right">Chi Tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-900">
                      {res.studentId}
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center text-[10px] font-bold">
                          {res.fullName.charAt(0)}
                        </div>
                        <span>{res.fullName}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-700">
                      Phòng {res.buildingName}{res.roomNumber} (Tầng {res.floor})
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-500">
                      <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {res.rfidMasked}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-600 font-mono">
                      {res.phone}
                    </td>

                    <td className="py-3 px-4 text-slate-500">
                      {res.lastAccess}
                    </td>

                    <td className="py-3 px-4">
                      <Badge variant={res.status === 'ACTIVE' ? 'success' : 'warning'} size="sm">
                        {res.status === 'ACTIVE' ? 'Đang ở' : 'Tạm vắng'}
                      </Badge>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setInspectResident(res)}
                      >
                        Hồ sơ
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Resident Detail Modal */}
      {inspectResident && (
        <Modal
          isOpen={!!inspectResident}
          onClose={() => setInspectResident(null)}
          title={`Hồ Sơ Sinh Viên — ${inspectResident.fullName}`}
          description={`Mã Số Sinh Viên: ${inspectResident.studentId}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-900 text-white flex items-center justify-center text-lg font-bold">
                {inspectResident.fullName.charAt(0)}
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">{inspectResident.fullName}</h4>
                <div className="text-slate-500 text-[11px] mt-0.5">
                  Phòng {inspectResident.buildingName}{inspectResident.roomNumber} · Tòa Nhà {inspectResident.buildingName}
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400 font-medium">Mã Thẻ RFID</span>
                <span className="font-mono font-bold text-slate-800">{inspectResident.rfidMasked}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400 font-medium">Số Điện Thoại</span>
                <span className="font-mono text-slate-800">{inspectResident.phone}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400 font-medium">Trạng Thái Lưu Trú</span>
                <Badge variant="success" size="sm">Hợp Lệ</Badge>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400 font-medium">Lượt Quẹt Thẻ Gần Nhất</span>
                <span className="text-slate-700">{inspectResident.lastAccess}</span>
              </div>
            </div>

            <div className="pt-3 text-right">
              <Button variant="secondary" size="sm" onClick={() => setInspectResident(null)}>
                Đóng
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
