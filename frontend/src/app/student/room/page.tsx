'use client';
import { useState } from 'react';
import { MetricCard } from '@/components/ui/MetricCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  DoorClosed, 
  Users, 
  Thermometer, 
  Droplets, 
  Flame, 
  Phone, 
  CreditCard, 
  Building2, 
  MapPin,
  CheckCircle2,
  Calendar
} from 'lucide-react';

export default function StudentRoomPage() {
  const roomInfo = {
    roomNumber: '101',
    building: 'Tòa Nhà A',
    address: 'Khu Cư Xá A, KTX Đại học Bách Khoa',
    floor: 1,
    capacity: 4,
    occupied: 4,
    checkInDate: '01/09/2023',
    contractEnd: '30/06/2024',
    roomType: 'Phòng Tiêu Chuẩn 4 Người (Máy lạnh + Cảm biến IoT)',
  };

  const roommates = [
    { name: 'Nguyễn Văn An (Bạn)', studentId: 'SV2024001', major: 'Khoa Học Máy Tính', phone: '0901234567', card: 'CARD_****-C3D4', isMe: true },
    { name: 'Trần Thị Bình', studentId: 'SV2024002', major: 'Kỹ Thuật Điện', phone: '0907654321', card: 'CARD_****-G7H8' },
    { name: 'Phạm Minh Đức', studentId: 'SV2024004', major: 'Kỹ Thuật Phần Mềm', phone: '0912345678', card: 'CARD_****-M3N4' },
    { name: 'Hoàng Quốc Việt', studentId: 'SV2024005', major: 'Hệ Thống Thông Tin', phone: '0987654321', card: 'CARD_****-P5Q6' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Hồ Sơ Phòng Ở Sinh Viên — Phòng A101</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Thông tin hợp đồng lưu trú, các thành viên cùng phòng và tiêu chuẩn trang thiết bị KTX.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="success" size="md">
            Hợp đồng lưu trú có hiệu lực
          </Badge>
        </div>
      </div>

      {/* Overview Info Card */}
      <div className="admin-card p-6 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
            A101
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">{roomInfo.roomType}</h3>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {roomInfo.address}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Tòa & Tầng</span>
            <div className="font-bold text-slate-900 mt-0.5">{roomInfo.building} · Tầng {roomInfo.floor}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Sĩ Số Phòng</span>
            <div className="font-bold text-slate-900 mt-0.5">{roomInfo.occupied}/{roomInfo.capacity} Người (Đủ)</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Ngày Nhận Phòng</span>
            <div className="font-bold text-slate-900 mt-0.5 font-mono">{roomInfo.checkInDate}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Hạn Hợp Đồng</span>
            <div className="font-bold text-emerald-700 mt-0.5 font-mono">{roomInfo.contractEnd}</div>
          </div>
        </div>
      </div>

      {/* Roommates Detailed List */}
      <div className="admin-card p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-700" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Danh Sách Sinh Viên Cùng Phòng
            </h3>
          </div>
          <Badge variant="neutral" size="sm">
            4 Thành Viên
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roommates.map((mem, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${
                mem.isMe ? 'bg-emerald-50/40 border-emerald-200' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                    mem.isMe ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {mem.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900">{mem.name}</div>
                    <div className="text-[11px] text-slate-500">{mem.major}</div>
                  </div>
                </div>

                <Badge variant={mem.isMe ? 'success' : 'neutral'} size="sm">
                  {mem.isMe ? 'Bạn' : 'Cùng phòng'}
                </Badge>
              </div>

              <div className="space-y-1 text-xs text-slate-600 pt-2 border-t border-slate-200/80">
                <div className="flex justify-between">
                  <span className="text-slate-400">Mã sinh viên:</span>
                  <span className="font-mono font-bold text-slate-800">{mem.studentId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Số điện thoại:</span>
                  <span className="font-mono text-slate-800">{mem.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Mã thẻ RFID:</span>
                  <span className="font-mono text-slate-600">{mem.card}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
