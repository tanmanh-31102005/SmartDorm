'use client';
import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastContext';
import { 
  Settings, 
  Bell, 
  Moon, 
  Lock, 
  ShieldCheck, 
  Save,
  Smartphone
} from 'lucide-react';

export default function StudentSettingsPage() {
  const { success } = useToast();
  const [notifyAccess, setNotifyAccess] = useState(true);
  const [notifyClimate, setNotifyClimate] = useState(true);
  const [autoLightOff, setAutoLightOff] = useState(true);
  const [saving, setSaving] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      success('Đã lưu tùy chọn cá nhân sinh viên thành công!', 'Cài Đặt');
    }, 500);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Cài Đặt & Tùy Chọn Phòng Ở</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Tùy biến thông báo qua ứng dụng di động và cài đặt tự động hóa thiết bị phòng KTX.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="admin-card p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 pb-3 border-b border-slate-100">
            Thông Báo & Cảnh Báo Di Động
          </h3>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer">
              <div>
                <div className="font-bold text-slate-900">Thông báo mỗi khi quẹt thẻ mở cửa</div>
                <div className="text-slate-500 text-[11px]">Gửi thông báo đẩy tức thời khi có người quẹt thẻ vào phòng A101</div>
              </div>
              <input
                type="checkbox"
                checked={notifyAccess}
                onChange={(e) => setNotifyAccess(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer">
              <div>
                <div className="font-bold text-slate-900">Cảnh báo nhiệt độ & chất lượng không khí</div>
                <div className="text-slate-500 text-[11px]">Nhận thông báo khi nhiệt độ phòng vượt 32°C hoặc phát hiện rò rỉ khí gas</div>
              </div>
              <input
                type="checkbox"
                checked={notifyClimate}
                onChange={(e) => setNotifyClimate(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer">
              <div>
                <div className="font-bold text-slate-900">Tự động tắt đèn khi phòng không có người</div>
                <div className="text-slate-500 text-[11px]">Cảm biến chuyển động tự động ngắt đèn sau 15 phút không phát hiện người</div>
              </div>
              <input
                type="checkbox"
                checked={autoLightOff}
                onChange={(e) => setAutoLightOff(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            loading={saving}
            className="bg-emerald-600 hover:bg-emerald-700"
            icon={<Save className="w-4 h-4" />}
          >
            Lưu Tùy Chọn
          </Button>
        </div>
      </form>
    </div>
  );
}
