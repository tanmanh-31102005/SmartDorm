'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastContext';
import { 
  User, 
  CreditCard, 
  Phone, 
  Mail, 
  Building2, 
  DoorClosed, 
  Calendar, 
  ShieldCheck,
  Save,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export default function StudentProfilePage() {
  const { success, error: toastError } = useToast();

  const [profile, setProfile] = useState({
    fullName: '',
    studentId: '',
    email: '',
    phone: '',
    faculty: 'Khoa Khoa Học & Kỹ Thuật Máy Tính',
    room: 'Đang tải thông tin phòng...',
    rfidMasked: 'Chưa liên kết thẻ RFID',
    rawRfid: '',
    status: 'Đang lưu trú',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // 1. Immediately populate from local cache if present
    const localUserStr = localStorage.getItem('user');
    if (localUserStr) {
      try {
        const u = JSON.parse(localUserStr);
        applyUserData(u);
      } catch (e) {}
    }

    // 2. Fetch fresh profile from backend
    async function fetchLiveProfile() {
      try {
        const res = await api.get('/auth/profile');
        if (res.data) {
          applyUserData(res.data);
          // Sync with local storage
          const existing = JSON.parse(localStorage.getItem('user') || '{}');
          localStorage.setItem('user', JSON.stringify({ ...existing, ...res.data }));
          window.dispatchEvent(new Event('userUpdated'));
        }
      } catch (err) {
        console.warn('Could not fetch remote profile, using cached data', err);
      } finally {
        setLoading(false);
      }
    }

    fetchLiveProfile();
  }, []);

  function applyUserData(u: any) {
    let roomStr = 'Chưa gán phòng KTX';
    if (u.room) {
      const bName = u.room.building?.name || 'A';
      roomStr = `Phòng ${u.room.roomNumber} · Tòa Nhà ${bName}`;
    }

    let rfidStr = 'Chưa liên kết thẻ RFID';
    if (u.rfidCardId) {
      rfidStr = `CARD_****-${u.rfidCardId.slice(-4).toUpperCase()}`;
    }

    setProfile((prev) => ({
      ...prev,
      fullName: u.fullName || prev.fullName || 'Sinh Viên KTX',
      studentId: u.studentId || prev.studentId || 'SV-KTX',
      email: u.email || prev.email || '',
      phone: u.phone || prev.phone || '',
      room: roomStr,
      rfidMasked: rfidStr,
      rawRfid: u.rfidCardId || '',
      status: u.isActive !== false ? 'Đang lưu trú' : 'Tạm khóa',
    }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await api.put('/auth/profile', {
        fullName: profile.fullName.trim(),
        email: profile.email.trim(),
        phone: profile.phone ? profile.phone.trim() : '',
      });

      if (res.data?.user) {
        const updated = res.data.user;
        applyUserData(updated);

        const existing = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...existing, ...updated }));
        window.dispatchEvent(new Event('userUpdated'));
      }

      success('Đã lưu và cập nhật thông tin cá nhân & số điện thoại thành công!', 'Hồ Sơ Cập Nhật');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không thể cập nhật thông tin. Vui lòng thử lại sau.';
      toastError(msg, 'Lỗi cập nhật');
    } finally {
      setSaving(false);
    }
  }

  const initialLetter = profile.fullName ? profile.fullName.trim().charAt(0).toUpperCase() : 'S';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Hồ Sơ Sinh Viên Lưu Trú</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Thông tin định danh sinh viên, số điện thoại liên lạc, phòng ở và thẻ từ RFID mở cửa.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="success" size="md">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Sinh Viên Đã Xác Thực</span>
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Profile Card */}
        <div className="lg:col-span-4 admin-card p-6 text-center space-y-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center text-2xl font-bold mx-auto shadow-md shadow-emerald-700/20">
            {initialLetter}
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900">
              {profile.fullName || 'Đang tải...'}
            </h3>
            <div className="font-mono text-xs text-slate-500 mt-0.5 font-semibold">
              MSSV: {profile.studentId || '---'}
            </div>
            <Badge variant="info" size="sm" className="mt-2">
              Sinh viên chính quy
            </Badge>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-left space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 flex items-center gap-1.5">
                <DoorClosed className="w-3.5 h-3.5 text-slate-400" />
                Phòng ở:
              </span>
              <span className="font-bold text-slate-800">{profile.room}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                Thẻ RFID:
              </span>
              <span className="font-mono font-bold text-emerald-700">{profile.rfidMasked}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                Trạng thái:
              </span>
              <span className="font-bold text-slate-800 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {profile.status}
              </span>
            </div>
          </div>
        </div>

        {/* Right Edit Form */}
        <div className="lg:col-span-8 admin-card p-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Thông Tin Cá Nhân & Liên Lạc
            </h3>
            <span className="text-[11px] text-slate-400">
              Có thể cập nhật số điện thoại và thông tin liên hệ
            </span>
          </div>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Họ và Tên
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={profile.fullName}
                    onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                    required
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Mã Số Sinh Viên (MSSV) <span className="text-slate-400 font-normal">(Cố định định danh)</span>
                </label>
                <div className="relative">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={profile.studentId}
                    disabled
                    className="w-full pl-9 pr-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 font-mono font-semibold cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Email Trường / Cá Nhân
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    required
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Số Điện Thoại <span className="text-emerald-700 font-normal">(Cập nhật tại đây)</span>
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="Ví dụ: 0912345678"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 font-mono transition"
                  />
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-[11px] text-slate-600">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Số điện thoại này được dùng để gửi SMS khẩn cấp & xác thực tài khoản KTX.
              </span>
              <span className="text-slate-400 font-medium">Bảo mật chuẩn AES</span>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                loading={saving}
                className="bg-emerald-600 hover:bg-emerald-700"
                icon={<Save className="w-4 h-4" />}
              >
                Lưu Thay Đổi
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
