'use client';
import { useState } from 'react';
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
  Save
} from 'lucide-react';

export default function StudentProfilePage() {
  const { success } = useToast();
  const [profile, setProfile] = useState({
    fullName: 'Nguyễn Văn An',
    studentId: 'SV2024001',
    email: 'sv001@student.edu.vn',
    phone: '0901234567',
    faculty: 'Khoa Khoa Học & Kỹ Thuật Máy Tính',
    room: 'Phòng 101 · Tòa Nhà A',
    rfidMasked: 'CARD_****-C3D4',
    rawRfid: 'CARD_A1B2C3D4',
    status: 'Đang lưu trú',
  });

  const [saving, setSaving] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      success('Đã cập nhật thông tin liên hệ sinh viên thành công!', 'Hồ Sơ');
    }, 600);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Hồ Sơ Sinh Viên Lưu Trú</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Thông tin định danh sinh viên, thẻ từ RFID mở cửa phòng và thông tin liên lạc.
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
          <div className="w-20 h-20 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-2xl font-bold mx-auto shadow-md">
            {profile.fullName.charAt(0)}
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900">{profile.fullName}</h3>
            <div className="font-mono text-xs text-slate-500 mt-0.5">{profile.studentId}</div>
            <Badge variant="info" size="sm" className="mt-2">
              Sinh viên chính quy
            </Badge>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-left space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Phòng ở:</span>
              <span className="font-bold text-slate-800">{profile.room}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Thẻ RFID:</span>
              <span className="font-mono font-bold text-emerald-700">{profile.rfidMasked}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Trạng thái:</span>
              <span className="font-bold text-slate-800">{profile.status}</span>
            </div>
          </div>
        </div>

        {/* Right Edit Form */}
        <div className="lg:col-span-8 admin-card p-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 pb-3 border-b border-slate-100 mb-4">
            Thông Tin Cá Nhân & Liên Lạc
          </h3>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Họ và Tên</label>
                <input
                  type="text"
                  value={profile.fullName}
                  disabled
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 font-semibold cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Mã Số Sinh Viên (MSSV)</label>
                <input
                  type="text"
                  value={profile.studentId}
                  disabled
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 font-mono font-semibold cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Email Trường</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 outline-none focus:bg-white focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Số Điện Thoại</label>
                <input
                  type="text"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 outline-none focus:bg-white focus:border-emerald-600 font-mono"
                />
              </div>
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
