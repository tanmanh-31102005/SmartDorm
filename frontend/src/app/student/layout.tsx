'use client';
import { useEffect, useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { Breadcrumbs, BreadcrumbItem } from '@/components/ui/Breadcrumbs';
import { useToast } from '@/components/ui/ToastContext';
import { 
  LayoutDashboard, 
  DoorClosed, 
  Cpu, 
  Zap, 
  CreditCard, 
  Bell, 
  User, 
  Settings, 
  LogOut, 
  Building2, 
  Menu, 
  X, 
  ChevronLeft,
  ChevronRight,
  ChevronDown, 
  CheckCircle2,
  Home,
  Activity
} from 'lucide-react';

interface StudentNavItem {
  href: string;
  icon: any;
  label: string;
  badge?: string;
}

interface NavSection {
  title: string;
  items: StudentNavItem[];
}

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { success, error, warning } = useToast();

  const [user, setUser] = useState<any>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!userData || !token) {
      router.replace('/login');
      return;
    }

    const parsed = JSON.parse(userData);
    setUser(parsed);

    // Sync live profile to reflect room changes made by Admin immediately
    async function syncProfile() {
      try {
        const res = await api.get('/auth/profile');
        if (res.data) {
          setUser(res.data);
          const currentLocal = JSON.parse(localStorage.getItem('user') || '{}');
          localStorage.setItem('user', JSON.stringify({ ...currentLocal, ...res.data }));
        }
      } catch (err) {}
    }
    syncProfile();

    function handleUserUpdate() {
      const refreshed = localStorage.getItem('user');
      if (refreshed) {
        try {
          setUser(JSON.parse(refreshed));
        } catch (e) {}
      }
    }
    window.addEventListener('storage', handleUserUpdate);
    window.addEventListener('userUpdated', handleUserUpdate);

    const socket = getSocket();
    socket.on('connect', () => setWsConnected(true));
    socket.on('disconnect', () => setWsConnected(false));
    setWsConnected(socket.connected);

    socket.on('access:log', (log: any) => {
      const myRoom = parsed?.room?.roomNumber || '101';
      if (log.room && String(log.room) !== String(myRoom)) return;
      const card = log.rfidCardId || log.cardId || 'UNKNOWN';
      const userName = log.user?.fullName || log.user?.name || 'Sinh viên';
      if (log.authorized) {
        success(`${userName} (${card}) vừa mở cửa P.${myRoom}`, 'QUẸT THẺ THÀNH CÔNG');
      } else {
        error(`Phát hiện thẻ lạ ${card} thử mở cửa P.${myRoom}!`, 'CẢNH BÁO AN NINH');
      }
    });

    socket.on('emergency:alert', (alert: any) => {
      warning(alert.message || alert.description || 'Cảnh báo an toàn KTX!', 'KHẨN CẤP');
    });

    return () => {
      window.removeEventListener('storage', handleUserUpdate);
      window.removeEventListener('userUpdated', handleUserUpdate);
      socket.off('connect');
      socket.off('disconnect');
      socket.off('access:log');
      socket.off('emergency:alert');
    };
  }, [router, success, error, warning]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.replace('/login');
  }

  const navSections: NavSection[] = [
    {
      title: 'PHÒNG CỦA TÔI',
      items: [
        { href: '/student/dashboard', icon: LayoutDashboard, label: 'Bảng Điều Khiển' },
        { href: '/student/room', icon: DoorClosed, label: 'Thông Tin Phòng' },
        { href: '/student/devices', icon: Cpu, label: 'Thiết Bị Phòng' },
      ],
    },
    {
      title: 'AN NINH & THẺ RFID',
      items: [
        { href: '/student/access-history', icon: CreditCard, label: 'Lịch Sử Ra Vào' },
        { href: '/student/alerts', icon: Bell, label: 'Cảnh Báo & Thông Báo' },
      ],
    },
    {
      title: 'TÀI KHOẢN',
      items: [
        { href: '/student/profile', icon: User, label: 'Hồ Sơ Sinh Viên' },
        { href: '/student/settings', icon: Settings, label: 'Cài Đặt' },
      ],
    },
  ];

  const breadcrumbs: BreadcrumbItem[] = useMemo(() => {
    if (pathname === '/student/dashboard' || pathname === '/student') {
      return [{ label: 'Cổng Sinh Viên' }];
    }
    const segment = pathname.replace('/student/', '');
    const mapLabel: Record<string, string> = {
      room: 'Thông Tin Phòng',
      devices: 'Thiết Bị Phòng',
      'access-history': 'Lịch Sử Ra Vào',
      alerts: 'Cảnh Báo',
      profile: 'Hồ Sơ Sinh Viên',
      settings: 'Cài Đặt',
    };
    return [
      { label: 'Cổng Sinh Viên', href: '/student/dashboard' },
      { label: mapLabel[segment] || segment },
    ];
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-slate-900 font-sans antialiased flex flex-col">
      
      {/* ============================================================ */}
      {/* 🌟 1. TOPBAR (HEADER TRÊN CÙNG)                               */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs h-16">
        <div className="w-full px-4 sm:px-6 flex items-center justify-between h-full gap-4">
          
          {/* Left: Brand Identity & Toggle Button */}
          <div className="flex items-center gap-3 sm:gap-4">
            
            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer"
              aria-label="Toggle Navigation"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Logo Brand */}
            <Link
              href="/student/dashboard"
              className="flex items-center gap-3 no-underline select-none group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="hidden sm:block">
                <div className="font-extrabold text-base text-slate-900 tracking-tight leading-tight flex items-center gap-1.5">
                  <span>SmartDorm</span>
                  <span className="text-[10px] uppercase font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-sm">Student</span>
                </div>
                <div className="text-[11px] font-semibold text-slate-400">Cổng Thông Tin Sinh Viên Ký Túc Xá</div>
              </div>
            </Link>

            {/* Desktop Sidebar Collapse Toggle */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex items-center justify-center w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer ml-2"
              title={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Center: Room Badge & Status */}
          <div className="hidden md:flex items-center gap-3">
            {user?.room?.roomNumber ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs shadow-2xs">
                <Home className="w-3.5 h-3.5 text-emerald-700" />
                <span className="font-bold text-emerald-800">
                  Phòng {user.room.building?.name || 'A'}-{user.room.roomNumber}
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold border-l border-emerald-300 pl-2">
                  {user?.studentId || 'SV-KTX'}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-xs shadow-2xs">
                <Home className="w-3.5 h-3.5 text-amber-700" />
                <span className="font-bold text-amber-800">
                  Chưa xếp phòng KTX
                </span>
                <span className="text-[10px] text-amber-600 font-semibold border-l border-amber-300 pl-2">
                  {user?.studentId || 'SV-KTX'}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs">
              <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              <span className="text-[11px] font-semibold text-slate-600">
                {wsConnected ? 'Kết Nối Trực Tuyến' : 'Đang kết nối...'}
              </span>
            </div>
          </div>

          {/* Right: User Profile Dropdown */}
          <div className="flex items-center gap-3">
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                  {user?.fullName?.charAt(0) || 'S'}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">{user?.fullName || 'Sinh Viên'}</div>
                  <div className="text-[10px] text-slate-400 font-semibold">{user?.studentId || 'Sinh Viên KTX'}</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <div className="font-bold text-xs text-slate-900">{user?.fullName || 'Nguyễn Văn An'}</div>
                    <div className="text-[11px] text-slate-500">{user?.email || 'sv001@student.edu.vn'}</div>
                    <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Role: STUDENT</span>
                    </div>
                  </div>

                  <div className="p-1 space-y-0.5">
                    <Link
                      href="/student/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      <User className="w-4 h-4 text-emerald-600" />
                      <span>Hồ sơ cá nhân</span>
                    </Link>
                    <Link
                      href="/student/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-slate-500" />
                      <span>Cài đặt tài khoản</span>
                    </Link>
                  </div>

                  <div className="p-1 border-t border-slate-100 mt-1">
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* 🌟 2. BODY CONTAINER (SIDEBAR + MAIN WORKSPACE)              */}
      {/* ============================================================ */}
      <div className="flex-1 flex min-h-[calc(100vh-64px)]">
        
        {/* Mobile Backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* ============================================================ */}
        {/* 🌟 STUDENT SIDEBAR (DRAWER TRÊN MOBILE, STICKY TRÊN DESKTOP)  */}
        {/* ============================================================ */}
        <aside
          className={`fixed inset-y-0 left-0 lg:sticky lg:top-16 lg:h-[calc(100vh-64px)] bg-white border-r border-slate-200 z-50 lg:z-30 transition-transform duration-300 ease-in-out flex flex-col flex-shrink-0 ${
            collapsed ? 'w-[72px]' : 'w-72 sm:w-64'
          } ${mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}`}
        >
          {/* Mobile Drawer Header */}
          <div className="lg:hidden p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <div className="font-extrabold text-sm text-slate-900 leading-tight">SmartDorm</div>
                <div className="text-[10px] text-slate-400 font-semibold">Cổng Sinh Viên KTX</div>
              </div>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 border border-slate-200 cursor-pointer"
              aria-label="Đóng menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Navigation Menu */}
          <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
            {navSections.map((sec, idx) => (
              <div key={idx} className="space-y-1">
                {!collapsed && (
                  <div className="px-3 text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                    {sec.title}
                  </div>
                )}
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href || (item.href !== '/student/dashboard' && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      title={collapsed ? item.label : undefined}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all relative select-none ${
                        active
                          ? 'bg-emerald-600 text-white font-bold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                      }`}
                    >
                      <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
                      {!collapsed && <span className="truncate">{item.label}</span>}

                      {!collapsed && item.badge && (
                        <span className="ml-auto text-[10px] font-bold rounded-full h-4 min-w-[16px] px-1.5 flex items-center justify-center bg-emerald-100 text-emerald-800">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Bottom Card */}
          <div className="p-3 border-t border-slate-200 bg-slate-50/70 space-y-2">
            {!collapsed && (
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs shadow-2xs">
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-[11px] font-semibold text-slate-700">Student Portal Active</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            )}
          </div>
        </aside>

        {/* ============================================================ */}
        {/* 🌟 MAIN CONTENT WORKSPACE                                    */}
        {/* ============================================================ */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#F6F8FB]">
          
          {/* Breadcrumbs Bar */}
          <div className="bg-white/80 border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between">
            <Breadcrumbs items={breadcrumbs} />
            <div className="text-[11px] font-semibold text-slate-400 hidden sm:flex items-center gap-2">
              <span>KTX Khu A · Phòng 101</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </div>
          </div>

          {/* Main Page Area — có padding bottom bù cho bottom nav trên mobile */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-[1600px] w-full mx-auto">
            {children}
          </main>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 📱 MOBILE BOTTOM NAVIGATION BAR (CHO SINH VIÊN DÙNG ĐIỆN THOẠI) */}
      {/* ============================================================ */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200 z-40 flex items-center justify-around px-2 shadow-lg">
        {[
          { href: '/student/dashboard', icon: LayoutDashboard, label: 'Trang Chủ' },
          { href: '/student/room', icon: DoorClosed, label: 'Phòng' },
          { href: '/student/devices', icon: Cpu, label: 'Thiết Bị' },
          { href: '/student/access-history', icon: CreditCard, label: 'Ra Vào' },
          { href: '/student/alerts', icon: Bell, label: 'Cảnh Báo' },
        ].map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full py-1 gap-1 text-[10px] font-bold transition-all relative ${
                active ? 'text-emerald-700' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${active ? 'bg-emerald-100 text-emerald-800' : ''}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="truncate max-w-[56px]">{item.label}</span>
              {active && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-emerald-700" />}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
