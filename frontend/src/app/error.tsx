'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home, LogIn } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console for diagnostic monitoring
    console.error('SmartDorm Global Error Boundary Caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#F6F8FB] flex items-center justify-center p-4 antialiased">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-6 sm:p-8 text-center space-y-5">
        {/* Animated Error Icon */}
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
          <AlertTriangle className="w-8 h-8 animate-bounce" />
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Đã Có Sự Cố Gián Đoạn
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            Hệ thống SmartDorm đã tự động bảo vệ phiên làm việc của bạn để ngăn ngừa mất dữ liệu. Sự cố có thể do gián đoạn mạng hoặc dịch vụ đang khởi động lại.
          </p>
        </div>

        {/* Technical Error Details (Collapsed / Subtle) */}
        {error?.message && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left">
            <div className="text-[10px] uppercase font-bold text-slate-400">Chi tiết kỹ thuật</div>
            <div className="font-mono text-xs text-slate-700 mt-1 break-words line-clamp-3">
              {error.message}
            </div>
            {error.digest && (
              <div className="text-[10px] text-slate-400 font-mono mt-1">
                Mã lỗi (Digest): {error.digest}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
          <button
            onClick={() => reset()}
            className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Thử Tải Lại</span>
          </button>

          <Link
            href="/dashboard"
            className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Trang Chủ</span>
          </Link>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>SmartDorm Platform v2.4</span>
          <Link href="/login" className="text-blue-700 hover:underline flex items-center gap-1">
            <LogIn className="w-3 h-3" />
            <span>Đăng nhập lại</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
