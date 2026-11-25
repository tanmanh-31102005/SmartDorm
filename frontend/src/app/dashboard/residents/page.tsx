'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/ToastContext';
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
  Clock,
  RefreshCw,
  Home
} from 'lucide-react';

interface ResidentItem {
  id: string;
  studentId: string;
  fullName: string;
  email?: string;
  roomId?: string | null;
  roomNumber: string;
  buildingName: string;
  floor: number;
  phone: string;
  rfidMasked: string;
  status: 'ACTIVE' | 'AWAY' | 'SUSPENDED';
  lastAccess: string;
}

interface RoomOption {
  id: string;
  roomNumber: string;
  floor: number;
  buildingName: string;
}

export default function ResidentsPage() {
  const { success, error: toastError } = useToast();
  const [residents, setResidents] = useState<ResidentItem[]>([]);
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [inspectResident, setInspectResident] = useState<ResidentItem | null>(null);

  // Room allocation state inside modal
  const [targetRoomId, setTargetRoomId] = useState('');
  const [assigning, setAssigning] = useState(false);

  async function loadResidentsData() {
    try {
      setLoading(true);
      const [resResidents, resRooms] = await Promise.all([
        api.get('/rooms/residents/all'),
        api.get('/rooms'),
      ]);

      if (Array.isArray(resResidents.data)) {
        const mapped: ResidentItem[] = resResidents.data.map((u: any, i: number) => {
          const rfid = u.rfidCardId 
            ? `CARD_****-${u.rfidCardId.slice(-4).toUpperCase()}` 
            : 'Chưa liên kết';
          
          const lastLog = u.accessLogs?.[0];
          const lastAccessStr = lastLog?.timestamp 
            ? new Date(lastLog.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' (Hôm nay)'
            : 'Chưa có lượt quẹt thẻ';

          return {
            id: u.id,
            studentId: u.studentId,
            fullName: u.fullName,
            email: u.email,
            roomId: u.roomId,
            roomNumber: u.room?.roomNumber || 'Chưa gán',
            buildingName: u.room?.building?.name || '---',
            floor: u.room?.floor || 0,
            phone: u.phone || 'Chưa cập nhật',
            rfidMasked: rfid,
            status: u.isActive ? 'ACTIVE' : 'SUSPENDED',
            lastAccess: lastAccessStr,
          };
        });
        setResidents(mapped);
      }

      if (Array.isArray(resRooms.data)) {
        setRooms(resRooms.data.map((r: any) => ({
          id: r.id,
          roomNumber: r.roomNumber,
          floor: r.floor,
          buildingName: r.building?.name || 'A',
        })));
      }
    } catch (err) {
      console.warn('Could not load residents, please check backend connection', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadResidentsData();
  }, []);

  useEffect(() => {
    if (inspectResident) {
      setTargetRoomId(inspectResident.roomId || '');
    }
  }, [inspectResident]);

  async function handleAssignRoom() {
    if (!inspectResident) return;
    setAssigning(true);
    try {
      await api.patch(`/rooms/residents/${inspectResident.id}/assign-room`, {
        roomId: targetRoomId ? targetRoomId : null,
      });

      const selectedRoom = rooms.find((r) => r.id === targetRoomId);
      const newRoomNumber = selectedRoom ? selectedRoom.roomNumber : 'Chưa gán';
      const newBuildingName = selectedRoom ? selectedRoom.buildingName : '---';
      const newFloor = selectedRoom ? selectedRoom.floor : 0;

      setResidents((prev) =>
        prev.map((r) =>
          r.id === inspectResident.id
            ? {
                ...r,
                roomId: targetRoomId || null,
                roomNumber: newRoomNumber,
                buildingName: newBuildingName,
                floor: newFloor,
              }
            : r
        )
      );

      setInspectResident((prev) =>
        prev
          ? {
              ...prev,
              roomId: targetRoomId || null,
              roomNumber: newRoomNumber,
              buildingName: newBuildingName,
              floor: newFloor,
            }
          : null
      );

      success('Đã cập nhật phân bổ phòng cho sinh viên thành công!', 'Phân Bổ KTX');
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Không thể phân bổ phòng', 'Lỗi');
    } finally {
      setAssigning(false);
    }
  }

  const filtered = residents.filter((res) => {
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
            Danh bạ cư xá KTX, thông tin phân bổ phòng, thẻ từ RFID và trạng thái cập nhật trực tuyến.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={loadResidentsData}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            Làm mới
          </Button>
          <Badge variant="neutral" size="md">
            Tổng cộng: <strong className="text-slate-900 ml-1">{residents.length}</strong> sinh viên
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
            placeholder="Tìm theo MSSV (52300...), họ tên, số phòng..."
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
              { id: 'ACTIVE', label: 'Đang lưu trú' },
              { id: 'SUSPENDED', label: 'Tạm khóa' },
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
              Danh Sách Sinh Viên KTX Thực Tế
            </h3>
          </div>
          <span className="text-xs text-slate-400">Hiển thị {filtered.length} sinh viên</span>
        </div>

        {loading && residents.length === 0 ? (
          <div className="py-12 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-blue-900 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
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
                  <th className="py-3 px-4">Thẻ RFID</th>
                  <th className="py-3 px-4">Điện Thoại</th>
                  <th className="py-3 px-4">Lần Vào Cuối</th>
                  <th className="py-3 px-4">Trạng Thái</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
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
                          {res.fullName ? res.fullName.charAt(0).toUpperCase() : 'S'}
                        </div>
                        <div>
                          <div>{res.fullName}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{res.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-700">
                      {res.roomNumber !== 'Chưa gán' ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono">
                          Phòng {res.buildingName}{res.roomNumber}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[11px]">
                          Chưa phân bổ
                        </span>
                      )}
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
                        {res.status === 'ACTIVE' ? 'Đang lưu trú' : 'Tạm khóa'}
                      </Badge>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setInspectResident(res)}
                      >
                        Chi tiết & Xếp phòng
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Resident Detail & Room Allocation Modal */}
      {inspectResident && (
        <Modal
          isOpen={!!inspectResident}
          onClose={() => setInspectResident(null)}
          title={`Hồ Sơ Sinh Viên — ${inspectResident.fullName}`}
          description={`Mã Số Sinh Viên: ${inspectResident.studentId} | Email: ${inspectResident.email || '---'}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-900 text-white flex items-center justify-center text-lg font-bold">
                  {inspectResident.fullName ? inspectResident.fullName.charAt(0).toUpperCase() : 'S'}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{inspectResident.fullName}</h4>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    {inspectResident.roomNumber !== 'Chưa gán' 
                      ? `Hiện tại: Phòng ${inspectResident.buildingName}${inspectResident.roomNumber} (Tầng ${inspectResident.floor})`
                      : 'Trạng thái: Chưa được gán phòng lưu trú'
                    }
                  </div>
                </div>
              </div>
              <Badge variant={inspectResident.roomNumber !== 'Chưa gán' ? 'success' : 'warning'} size="sm">
                {inspectResident.roomNumber !== 'Chưa gán' ? 'Đã xếp phòng' : 'Chưa xếp phòng'}
              </Badge>
            </div>

            {/* Room Allocation Form for Admin */}
            <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2.5">
              <label className="block font-bold text-blue-900">
                Phân Bổ / Chuyển Phòng KTX Cho Sinh Viên:
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={targetRoomId}
                  onChange={(e) => setTargetRoomId(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:border-blue-700 font-medium"
                >
                  <option value="">-- Thu hồi phòng (Chưa gán phòng) --</option>
                  {rooms.map((rm) => (
                    <option key={rm.id} value={rm.id}>
                      Phòng {rm.roomNumber} (Tòa {rm.buildingName} - Tầng {rm.floor})
                    </option>
                  ))}
                </select>
                <Button
                  variant="primary"
                  size="sm"
                  loading={assigning}
                  onClick={handleAssignRoom}
                  className="bg-blue-900 hover:bg-blue-800"
                >
                  Lưu Phòng
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400 font-medium">Mã Thẻ RFID</span>
                <span className="font-mono font-bold text-slate-800">{inspectResident.rfidMasked}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400 font-medium">Số Điện Thoại</span>
                <span className="font-mono text-slate-800">{inspectResident.phone}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400 font-medium">Lượt Quẹt Thẻ Gần Nhất</span>
                <span className="text-slate-700">{inspectResident.lastAccess}</span>
              </div>
            </div>

            <div className="pt-2 text-right">
              <Button variant="secondary" size="sm" onClick={() => setInspectResident(null)}>
                Đóng Cửa Sổ
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
