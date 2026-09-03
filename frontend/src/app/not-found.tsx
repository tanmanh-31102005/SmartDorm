import React from 'react';
import Link from 'next/link';
import { FileQuestion, Home, LayoutDashboard, UserCheck } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F6F8FB] flex items-center justify-center p-4 antialiased">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-6 sm:p-8 text-center space-y-5">
        {/* 404 Icon */}
        <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 flex items-center justify-center mx-auto shadow-xs">
          <FileQuestion className="w-8 h-8" />
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <div className="text-4xl font-extrabold text-blue-900 font-mono tracking-tight">404</div>
          <h1 className="text-lg font-bold text-slate-900">
            Không Tìm Thấy Trang Yêu Cầu
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            Đường dẫn bạn truy cập không tồn tại hoặc đã được chuyển sang phân hệ khác trong hệ thống ký túc xá SmartDorm.
          </p>
        </div>

        {/* Navigation Quick Links */}
        <div className="flex flex-col gap-2 pt-2">
          <Link
            href="/dashboard"
            className="w-full py-2.5 px-4 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Vào Bảng Điều Khiển Quản Trị</span>
          </Link>

          <Link
            href="/student/dashboard"
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold transition-all flex items-center justify-center gap-2"
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Vào Cổng Thông Tin Sinh Viên</span>
          </Link>
        </div>

        <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400">
          Hệ Thống Quản Lý Ký Túc Xá Thông Minh SmartDorm Enterprise
        </div>
      </div>
    </div>
  );
}
