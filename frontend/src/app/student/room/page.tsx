'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { 
  DoorClosed, 
  Users, 
  Phone, 
  CreditCard, 
  Building2, 
  MapPin, 
  CheckCircle2, 
  Calendar,
  AlertCircle,
  Sparkles,
  UserCheck,
  UserPlus
} from 'lucide-react';

export default function StudentRoomPage() {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [room, setRoom] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        // 1. Fetch live user profile
        const profileRes = await api.get('/auth/profile');
        const user = profileRes.data;
        setCurrentUser(user);

        const targetRoomId = user?.roomId || user?.room?.id || user?.room?.roomNumber;
        if (targetRoomId) {
          const roomRes = await api.get(`/rooms/${targetRoomId}`);
          if (roomRes.data) {
            setRoom(roomRes.data);
          }
        }
      } catch (err) {
        console.warn('Could not load room data from backend, falling back to local storage', err);
        const local = localStorage.getItem('user');
        if (local) {
          try {
            const parsed = JSON.parse(local);
            setCurrentUser(parsed);
            if (parsed.room) {
              setRoom(parsed.room);
            }
          } catch (e) {}
        }
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const buildingName = room?.building?.name || currentUser?.room?.building?.name || 'A';
  const roomNumber = room?.roomNumber || currentUser?.room?.roomNumber || '';
  const capacity = room?.capacity || 4;
  const residents: any[] = room?.users || [];
  const occupied = residents.length;
  const remainingSlots = Math.max(0, capacity - occupied);

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If user is not yet assigned to any room
  if (!roomNumber && !room) {
    return (
      <div className="space-y-6">
        <div className="admin-card p-10 text-center max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
            <DoorClosed className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Chưa Được Phân Bổ Phòng KTX</h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Tài khoản sinh viên <strong>{currentUser?.fullName || 'của bạn'}</strong> (MSSV: {currentUser?.studentId || '---'}) hiện chưa được gán vào phòng KTX nào.
            </p>
          </div>
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-left text-slate-600 space-y-1.5">
            <div className="font-semibold text-slate-800">💡 Hướng dẫn phân bổ phòng:</div>
            <div>• Ban Quản Trị KTX sẽ trực tiếp xếp phòng cho bạn trên cổng điều hành Admin.</div>
            <div>• Hoặc bạn có thể chọn phòng mong muốn khi cập nhật hồ sơ cá nhân.</div>
          </div>
          <div className="pt-2">
            <Link href="/student/profile">
              <Button variant="primary" className="bg-emerald-600 hover:bg-emerald-700 text-xs">
                Vào Hồ Sơ Cá Nhân
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Hồ Sơ Phòng Ở Sinh Viên — Phòng {buildingName}{roomNumber}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Thông tin hợp đồng lưu trú, các thành viên thực tế cùng phòng và trạng thái trang thiết bị KTX.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="success" size="md">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Hợp đồng lưu trú có hiệu lực</span>
          </Badge>
        </div>
      </div>

      {/* Overview Info Card */}
      <div className="admin-card p-6 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-bold flex items-center justify-center text-sm shadow-md shadow-emerald-700/20">
            {buildingName}{roomNumber}
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              Phòng Tiêu Chuẩn {capacity} Người (Khóa Thẻ RFID + Giám Sát IoT)
            </h3>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              Khu Cư Xá {buildingName}, Ký Túc Xá Sinh Viên
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Tòa & Tầng</span>
            <div className="font-bold text-slate-900 mt-0.5">
              Tòa Nhà {buildingName} · Tầng {room?.floor || 1}
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Sĩ Số Phòng Thực Tế</span>
            <div className="font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
              <span>{occupied}/{capacity} Người</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                occupied >= capacity 
                  ? 'bg-amber-100 text-amber-800' 
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {occupied >= capacity ? 'Đã đủ' : `Còn ${remainingSlots} chỗ`}
              </span>
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Ngày Nhận Phòng</span>
            <div className="font-bold text-slate-900 mt-0.5 font-mono">01/09/2024</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Hạn Hợp Đồng</span>
            <div className="font-bold text-emerald-700 mt-0.5 font-mono">30/06/2025</div>
          </div>
        </div>
      </div>

      {/* Roommates Detailed List */}
      <div className="admin-card p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-700" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Danh Sách Sinh Viên Đang Ở Phòng {buildingName}{roomNumber} ({occupied} người)
            </h3>
          </div>
          <Badge variant={occupied >= capacity ? 'neutral' : 'info'} size="sm">
            {occupied}/{capacity} Thành Viên
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Active Registered Roommates */}
          {residents.map((mem) => {
            const isMe = mem.id === currentUser?.id || mem.studentId === currentUser?.studentId;
            const rfidText = mem.rfidCardId 
              ? `CARD_****-${mem.rfidCardId.slice(-4).toUpperCase()}` 
              : 'Chưa liên kết thẻ';

            return (
              <div
                key={mem.id || mem.studentId}
                className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition ${
                  isMe 
                    ? 'bg-emerald-50/50 border-emerald-200 shadow-xs ring-1 ring-emerald-500/10' 
                    : 'bg-slate-50/70 border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                      isMe 
                        ? 'bg-emerald-600 text-white shadow-xs' 
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      {mem.fullName ? mem.fullName.charAt(0).toUpperCase() : 'S'}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900">
                        {mem.fullName} {isMe && '(Bạn)'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {mem.email || 'Sinh viên lưu trú'}
                      </div>
                    </div>
                  </div>

                  <Badge variant={isMe ? 'success' : 'neutral'} size="sm">
                    {isMe ? 'Bạn' : 'Cùng phòng'}
                  </Badge>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-200/80">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Mã sinh viên:</span>
                    <span className="font-mono font-bold text-slate-800">{mem.studentId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Số điện thoại:</span>
                    <span className="font-mono text-slate-800">{mem.phone || 'Chưa cập nhật'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Thẻ từ RFID:</span>
                    <span className="font-mono text-emerald-700 font-semibold">{rfidText}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Empty Slots Available */}
          {Array.from({ length: remainingSlots }).map((_, slotIdx) => (
            <div
              key={`empty-slot-${slotIdx}`}
              className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/30 flex flex-col justify-between space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-xs border border-dashed border-slate-300">
                    +
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-400">
                      Chỗ Trống (Slot {occupied + slotIdx + 1}/{capacity})
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Sẵn sàng đón sinh viên mới
                    </div>
                  </div>
                </div>
                <Badge variant="neutral" size="sm" className="opacity-60">
                  Còn trống
                </Badge>
              </div>

              <div className="text-[11px] text-slate-400 pt-2 border-t border-dashed border-slate-200">
                Phòng còn chỗ lưu trú, sinh viên đăng ký sẽ được xếp vào đây.
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
