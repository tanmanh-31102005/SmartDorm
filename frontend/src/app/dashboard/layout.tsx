'use client';
import { useEffect, useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getSocket } from '@/lib/socket';
import { Breadcrumbs, BreadcrumbItem } from '@/components/ui/Breadcrumbs';
import { NotificationDrawer, NotificationItem } from '@/components/ui/NotificationDrawer';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastContext';
import { useIntelligenceStore } from '@/lib/intelligence-store';
import { API_BASE_URL } from '@/lib/api';

import { 
  LayoutDashboard, 
  Building2, 
  DoorClosed, 
  Users, 
  Cpu, 
  Zap, 
  Thermometer, 
  ShieldCheck, 
  CreditCard, 
  ShieldAlert, 
  Flame, 
  BarChart3, 
  FileText, 
  Settings, 
  LogOut, 
  Bell, 
  ChevronDown, 
  Menu, 
  X, 
  HelpCircle, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Server,
  Sparkles,
  Bot,
  Radio,
  Sliders,
  CheckCircle2,
  Search,
  Activity
} from 'lucide-react';

interface NavItem {
  href: string;
  icon: any;
  label: string;
  badge?: string;
  badgeVariant?: 'critical' | 'warning' | 'info' | 'success';
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { warning } = useToast();

  const [user, setUser] = useState<any>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState('ALL');
  const [notifOpen, setNotifOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const userMenuRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'n-1',
      type: 'critical',
      title: 'Khói & Nhiệt độ vượt ngưỡng',
      description: 'Phòng B204 (Tòa B) đo được nhiệt độ 48.5°C và khí gas 68%.',
      source: 'MQ-2 Sensor · Tòa B',
      time: '2 phút trước',
      read: false,
      link: '/dashboard/alerts',
    },
    {
      id: 'n-2',
      type: 'warning',
      title: 'Cửa mở trái phép (Door Forced)',
      description: 'Cửa phòng C301 phát hiện mở mà không qua quẹt thẻ.',
      source: 'Door Sensor · Tòa C',
      time: '15 phút trước',
      read: false,
      link: '/dashboard/security',
    },
    {
      id: 'n-3',
      type: 'success',
      title: 'Nhiệt độ đã khôi phục',
      description: 'Phòng A201 nhiệt độ vi khí hậu đã ổn định 27.5°C.',
      source: 'DHT22 · Tòa A',
      time: '32 phút trước',
      read: true,
      link: '/dashboard/environment',
    },
  ]);
  const [hasEmergency, setHasEmergency] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!userData || !token) {
      router.replace('/login');
      return;
    }

    const parsed = JSON.parse(userData);
    setUser(parsed);

    // If student tries to access admin routes, redirect to student portal
    if (parsed.role === 'STUDENT') {
      router.replace('/student/dashboard');
      return;
    }

    const socket = getSocket();
    socket.on('connect', () => setWsConnected(true));
    socket.on('disconnect', () => setWsConnected(false));
    setWsConnected(socket.connected);

    socket.on('emergency:alert', (alert: any) => {
      setHasEmergency(true);
      const newNotif: NotificationItem = {
        id: `notif-${Date.now()}`,
        type: 'critical',
        title: alert.title || 'Phát hiện sự cố khẩn cấp!',
        description: alert.message || alert.description || `Sự cố tại phòng ${alert.roomId || ''}`,
        source: `Hệ thống an ninh · ${alert.roomId || ''}`,
        time: 'Vừa xong',
        read: false,
        link: '/dashboard/emergency',
      };
      setNotifications(prev => [newNotif, ...prev]);
      warning(`Sự cố khẩn cấp: ${newNotif.title}`, 'CẢNH BÁO IOT');
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('emergency:alert');
    };
  }, [router, warning]);

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

  const unreadCount = notifications.filter(n => !n.read).length;
  const { anomalies, recommendations } = useIntelligenceStore();

  const activeAnomaliesCount = anomalies.filter(a => a.status === 'OPEN').length;
  const pendingRecsCount = recommendations.filter(r => r.status === 'PENDING').length;

  const navSections: NavSection[] = [
    {
      title: 'TỔNG QUAN',
      items: [
        { href: '/dashboard', icon: LayoutDashboard, label: 'Bảng Điều Khiển' },
      ],
    },
    {
      title: 'INTELLIGENCE & AI',
      items: [
        { href: '/dashboard/intelligence', icon: Sparkles, label: 'AI Overview' },
        {
          href: '/dashboard/intelligence/anomalies',
          icon: AlertTriangle,
          label: 'Bất Thường Thiết Bị',
          badge: activeAnomaliesCount > 0 ? `${activeAnomaliesCount}` : undefined,
          badgeVariant: 'critical',
        },
        { href: '/dashboard/intelligence/occupancy', icon: Users, label: 'Dự Đoán Lưu Trú' },
        {
          href: '/dashboard/intelligence/recommendations',
          icon: Sliders,
          label: 'Khuyến Nghị Tối Ưu',
          badge: pendingRecsCount > 0 ? `${pendingRecsCount}` : undefined,
          badgeVariant: 'info',
        },
        { href: '/dashboard/intelligence/assistant', icon: Bot, label: 'Trợ Lý AI Copilot', badge: 'Live AI', badgeVariant: 'info' },
        { href: '/dashboard/intelligence/models', icon: Server, label: 'Hiệu Năng Mô Hình' },
      ],
    },
    {
      title: 'QUẢN LÝ KTX',
      items: [
        { href: '/dashboard/buildings', icon: Building2, label: 'Tòa Nhà KTX' },
        { href: '/dashboard/rooms', icon: DoorClosed, label: 'Danh Sách Phòng' },
        { href: '/dashboard/residents', icon: Users, label: 'Sinh Viên Lưu Trú' },
        { href: '/dashboard/devices', icon: Cpu, label: 'Thiết Bị Rơ-Le' },
      ],
    },
    {
      title: 'GIÁM SÁT IOT',
      items: [
        { href: '/dashboard/environment', icon: Thermometer, label: 'Vi Khí Hậu & Cảm Biến' },
        { href: '/dashboard/security', icon: ShieldCheck, label: 'An Ninh & Cửa Điện' },
        { href: '/dashboard/access-log', icon: CreditCard, label: 'Nhật Ký Quẹt Thẻ' },
      ],
    },
    {
      title: 'VẬN HÀNH & AN TOÀN',
      items: [
        { 
          href: '/dashboard/alerts', 
          icon: Flame, 
          label: 'Cảnh Báo & Sự Cố',
          badge: unreadCount > 0 ? `${unreadCount}` : undefined,
          badgeVariant: 'critical'
        },
        { href: '/dashboard/emergency', icon: ShieldAlert, label: 'Ứng Phó Khẩn Cấp' },
      ],
    },
    {
      title: 'PHÂN TÍCH & BÁO CÁO',
      items: [
        { href: '/dashboard/analytics', icon: BarChart3, label: 'Thống Kê Dữ Liệu' },
        { href: '/dashboard/reports', icon: FileText, label: 'Báo Cáo Định Kỳ' },
      ],
    },
    {
      title: 'HỆ THỐNG',
      items: [
        { href: '/dashboard/settings', icon: Settings, label: 'Cài Đặt Hệ Thống' },
      ],
    },
  ];

  // Dynamic breadcrumbs based on pathname
  const breadcrumbs: BreadcrumbItem[] = useMemo(() => {
    if (pathname === '/dashboard') {
      return [{ label: 'Bảng Điều Khiển' }];
    }
    const segments = pathname.replace('/dashboard/', '').split('/');
    
    const getLabel = (seg: string, fullPath: string) => {
      if (fullPath === '/dashboard/intelligence') return 'AI Intelligence Center';
      if (fullPath === '/dashboard/intelligence/anomalies') return 'Bất Thường Thiết Bị';
      if (fullPath === '/dashboard/intelligence/occupancy') return 'Dự Đoán Lưu Trú';
      if (fullPath === '/dashboard/intelligence/recommendations') return 'Khuyến Nghị AI';
      if (fullPath === '/dashboard/intelligence/models') return 'Hiệu Năng Mô Hình';
      if (fullPath === '/dashboard/intelligence/assistant') return 'Trợ Lý AI Copilot';

      const mapLabel: Record<string, string> = {
        intelligence: 'AI Intelligence',
        buildings: 'Tòa Nhà KTX',
        rooms: 'Danh Sách Phòng',
        residents: 'Sinh Viên Lưu Trú',
        devices: 'Thiết Bị Rơ-Le',
        energy: 'Tiêu Thụ Điện Năng',
        environment: 'Vi Khí Hậu & AQI',
        security: 'An Ninh & Cửa Điện',
        'access-log': 'Nhật Ký Quẹt Thẻ',
        alerts: 'Cảnh Báo & Sự Cố',
        emergency: 'Ứng Phó Khẩn Cấp',
        analytics: 'Thống Kê Dữ Liệu',
        reports: 'Báo Cáo Định Kỳ',
        settings: 'Cài Đặt Hệ Thống',
      };
      return mapLabel[seg] || seg;
    };

    let accum = '/dashboard';
    const items: BreadcrumbItem[] = [{ label: 'Trang Chủ', href: '/dashboard' }];
    segments.forEach((seg, idx) => {
      accum += `/${seg}`;
      items.push({
        label: getLabel(seg, accum),
        href: idx === segments.length - 1 ? undefined : accum,
      });
    });
    return items;
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-slate-900 font-sans antialiased flex flex-col">
      
      {/* ============================================================ */}
      {/* 🌟 1. PREMIUM TOPBAR (STICKY HEADER)                          */}
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
              href="/dashboard"
              className="flex items-center gap-3 no-underline select-none group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-900 to-indigo-700 text-white flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="hidden sm:block">
                <div className="font-extrabold text-base text-slate-900 tracking-tight leading-tight flex items-center gap-1.5">
                  <span>SmartDorm</span>
                  <span className="text-[10px] uppercase font-bold bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded-sm">Enterprise</span>
                </div>
                <div className="text-[11px] font-semibold text-slate-400">Hệ Thống Quản Lý KTX Thông Minh</div>
              </div>
            </Link>

            {/* Desktop Sidebar Collapse Toggle */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex items-center justify-center w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer ml-2"
              title={collapsed ? 'Mở rộng thanh menu' : 'Thu gọn thanh menu'}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Center: Search & Status Indicators */}
          <div className="hidden md:flex items-center gap-3 flex-1 max-w-md mx-4">
            
            {/* Live IoT Broker Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200/90 text-xs flex-shrink-0">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${wsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              <span className="text-[11px] font-semibold text-slate-700 hidden lg:inline">
                {wsConnected ? 'MQTT & WebSocket Live' : 'Đang kết nối...'}
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">1883</span>
            </div>

            {/* Building Quick Selector */}
            <div className="relative flex-1">
              <select
                value={selectedBuilding}
                onChange={(e) => setSelectedBuilding(e.target.value)}
                className="w-full pl-3 pr-8 py-1.5 bg-slate-100/90 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none hover:bg-white focus:bg-white focus:border-blue-900 transition-colors cursor-pointer appearance-none shadow-2xs"
              >
                <option value="ALL">🏢 Toàn Bộ Tòa Nhà (A, B, C)</option>
                <option value="A">🏢 Tòa Nhà A (Khu A)</option>
                <option value="B">🏢 Tòa Nhà B (Khu B)</option>
                <option value="C">🏢 Tòa Nhà C (Khu C)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Right: Quick Actions & User Profile */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            
            {/* Critical Emergency Banner Button */}
            {hasEmergency && (
              <button
                onClick={() => router.push('/dashboard/emergency')}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl animate-pulse cursor-pointer shadow-sm transition-all"
              >
                <AlertTriangle className="w-4 h-4 text-white" />
                <span className="hidden sm:inline">CẢNH BÁO SỰ CỐ!</span>
                <span className="sm:hidden">SỰ CỐ!</span>
              </button>
            )}

            {/* AI Copilot Quick Jump */}
            <Link
              href="/dashboard/intelligence/assistant"
              className="hidden xl:flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl border border-indigo-200 transition-colors shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>AI Copilot</span>
            </Link>

            {/* Swagger API Link */}
            <a
              href={`${API_BASE_URL}/api/docs`}
              target="_blank"
              rel="noreferrer"
              className="hidden lg:flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-900 hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors shadow-2xs"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span>API Docs</span>
            </a>

            {/* Notification Bell */}
            <button
              onClick={() => setNotifOpen(true)}
              className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
              aria-label="Thông báo"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-red-600 ring-2 ring-white animate-pulse" />
              )}
            </button>

            {/* User Profile Dropdown Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                  {user?.fullName?.charAt(0) || 'A'}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[110px]">{user?.fullName || 'Quản Trị Viên'}</div>
                  <div className="text-[10px] text-slate-400 font-semibold">Ban Quản Trị</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* User Menu Popover */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <div className="font-bold text-xs text-slate-900">{user?.fullName || 'Nguyễn Tấn Mạnh'}</div>
                    <div className="text-[11px] text-slate-500">{user?.email || 'admin@ktx.edu.vn'}</div>
                    <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Role: ADMIN</span>
                    </div>
                  </div>

                  <div className="p-1 space-y-0.5">
                    <button
                      onClick={() => { setHelpOpen(true); setUserMenuOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <HelpCircle className="w-4 h-4 text-blue-700" />
                      <span>Kiến trúc & Hướng dẫn</span>
                    </button>
                    <Link
                      href="/dashboard/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-slate-500" />
                      <span>Cài đặt hệ thống</span>
                    </Link>
                  </div>

                  <div className="p-1 border-t border-slate-100 mt-1">
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Đăng xuất tài khoản</span>
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
        
        {/* Mobile Drawer Backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* ============================================================ */}
        {/* 🌟 SIDEBAR (DRAWER TRÊN MOBILE, STICKY TRÊN DESKTOP)          */}
        {/* ============================================================ */}
        <aside
          className={`fixed inset-y-0 left-0 lg:sticky lg:top-16 lg:h-[calc(100vh-64px)] bg-white border-r border-slate-200 z-50 lg:z-30 transition-transform duration-300 ease-in-out flex flex-col flex-shrink-0 ${
            collapsed ? 'w-[72px]' : 'w-72 sm:w-64'
          } ${mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}`}
        >
          {/* Mobile Drawer Header */}
          <div className="lg:hidden p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center font-bold">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <div className="font-extrabold text-sm text-slate-900 leading-tight">SmartDorm</div>
                <div className="text-[10px] text-slate-400 font-semibold">Admin Workspace</div>
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
                  const active = pathname === item.href || (item.href !== '/dashboard' && item.href !== '/dashboard/intelligence' && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      title={collapsed ? item.label : undefined}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all relative select-none ${
                        active
                          ? 'bg-blue-900 text-white font-bold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                      }`}
                    >
                      <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
                      {!collapsed && <span className="truncate">{item.label}</span>}

                      {!collapsed && item.badge && (
                        <span
                          className={`ml-auto text-[10px] font-bold rounded-full h-4 min-w-[16px] px-1.5 flex items-center justify-center ${
                            item.badgeVariant === 'critical' ? 'bg-red-500 text-white' : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Bottom Sidebar Status Card */}
          <div className="p-3 border-t border-slate-200 bg-slate-50/70 space-y-2">
            {!collapsed && (
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs shadow-2xs">
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-[11px] font-semibold text-slate-700">IoT Engine Active</span>
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
          
          {/* Breadcrumb Header Bar */}
          <div className="bg-white/80 border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between">
            <Breadcrumbs items={breadcrumbs} />
            <div className="text-[11px] font-semibold text-slate-400 hidden sm:flex items-center gap-2">
              <span>Hệ Thống Trực Tuyến</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </div>
          </div>

          {/* Main Page Area */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
            {children}
          </main>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 🔔 NOTIFICATION CENTER DRAWER & MODAL                       */}
      {/* ============================================================ */}
      <NotificationDrawer
        isOpen={notifOpen}
        onClose={() => setNotifOpen(false)}
        notifications={notifications}
        onMarkAllRead={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
        onMarkRead={(id) => setNotifications(prev => prev.map(n => n.id === id ? ({ ...n, read: true }) : n))}
      />

      <Modal
        isOpen={helpOpen}
        onClose={() => setHelpOpen(false)}
        title="Kiến Trúc Kỹ Thuật SmartDorm"
        description="Tổng quan kiến trúc kỹ thuật chuẩn Enterprise của Smart Dormitory"
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 leading-relaxed">
            <h4 className="font-bold text-sm mb-1">Mô Hình Thiết Kế & Nguyên Lý Hoạt Động</h4>
            <p>
              Hệ thống SmartDorm ứng dụng các mẫu thiết kế hướng đối tượng nâng cao: 
              <strong> Command Pattern</strong> (Điều khiển thiết bị IoT & Hoàn tác Undo), 
              <strong> Strategy Pattern</strong> (Phản ứng tự động xử lý hỏa hoạn, rò rỉ khí gas), và 
              <strong> Observer Pattern</strong> (Phát sóng Socket.IO đa điểm tới toàn bộ dashboard quản trị).
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <div className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <Server className="w-4 h-4 text-blue-700" />
                <span>Backend & Database</span>
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                NestJS REST API + WebSocket Gateway, Prisma ORM, SQLite & InfluxDB Time-Series Telemetry bucket.
              </p>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <div className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-emerald-700" />
                <span>Hardware & Simulator</span>
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Wokwi ESP32 vi điều khiển kết nối MQTT Broker (Port 1883), DHT22, MQ-2, Rơ-le và RFID RC522.
              </p>
            </div>
          </div>

          <div className="pt-2 text-right">
            <Button variant="primary" size="sm" onClick={() => setHelpOpen(false)}>
              Đã hiểu
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
