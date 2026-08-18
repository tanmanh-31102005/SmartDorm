'use client';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getSocket } from '@/lib/socket';
import { Breadcrumbs, BreadcrumbItem } from '@/components/ui/Breadcrumbs';
import { Badge } from '@/components/ui/Badge';
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
  Radio, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  Flame,
  KeyRound
} from 'lucide-react';

interface NavSection {
  title: string;
  items: {
    href: string;
    icon: any;
    label: string;
    badge?: string;
  }[];
}

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!userData || !token) {
      router.replace('/login');
      return;
    }

    const parsed = JSON.parse(userData);
    setUser(parsed);

    const socket = getSocket();
    socket.on('connect', () => setWsConnected(true));
    socket.on('disconnect', () => setWsConnected(false));
    setWsConnected(socket.connected);

    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [router]);

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
        { href: '/student/energy', icon: Zap, label: 'Điện Năng Tiêu Thụ' },
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
      energy: 'Điện Năng Tiêu Thụ',
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
    <div className="flex min-h-screen bg-[#F6F8FB] text-slate-900 font-sans antialiased">
      
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Student Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 h-screen bg-white border-r border-slate-200 z-40 transition-all duration-200 flex flex-col ${
          collapsed ? 'w-[72px]' : 'w-64'
        } ${mobileOpen ? 'left-0' : '-left-full lg:left-0'}`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 border-b border-slate-200 flex items-center justify-between">
          <Link
            href="/student/dashboard"
            className="flex items-center gap-3 no-underline overflow-hidden select-none"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <div className="font-bold text-sm text-slate-900 tracking-tight leading-tight">SmartDorm</div>
                <div className="text-[10px] font-semibold text-emerald-700 truncate">Cổng Sinh Viên KTX</div>
              </div>
            )}
          </Link>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1 text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Categorized Nav Menu */}
        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
          {navSections.map((sec, idx) => (
            <div key={idx} className="space-y-1">
              {!collapsed && (
                <div className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  {sec.title}
                </div>
              )}
              {sec.items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all relative ${
                      active
                        ? 'bg-emerald-600 text-white font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom User Info */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/70 space-y-2.5">
          {user && (
            <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {user.fullName?.charAt(0) || 'S'}
                </div>
                {!collapsed && (
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold text-slate-800 truncate">{user.fullName || 'Nguyễn Văn An'}</div>
                    <div className="text-[10px] font-mono text-slate-500 truncate">{user.studentId || 'SV2024001'}</div>
                  </div>
                )}
              </div>

              {!collapsed && (
                <button
                  onClick={logout}
                  title="Đăng xuất"
                  className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Global Student Header */}
        <header className="h-16 px-4 sm:px-8 admin-header flex items-center justify-between sticky top-0 z-30">
          
          {/* Left: Breadcrumbs */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
              aria-label="Open navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Breadcrumbs items={breadcrumbs} homeHref="/student/dashboard" />
          </div>

          {/* Right Room Indicator & Status */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-800">
              <DoorClosed className="w-3.5 h-3.5 text-emerald-600" />
              <span>Phòng: <strong>Tòa A · Phòng 101</strong></span>
            </div>

            <div className="flex items-center gap-2 pl-1">
              <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                {user?.fullName?.charAt(0) || 'S'}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-xs font-bold text-slate-800 leading-tight">{user?.fullName || 'Nguyễn Văn An'}</div>
                <div className="text-[10px] text-emerald-700 font-medium">Sinh Viên Lưu Trú</div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Workspace */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
