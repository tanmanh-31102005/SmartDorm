'use client';
import { useState, useEffect, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/ToastContext';
import { 
  Building2, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  ArrowRight, 
  ShieldCheck, 
  Radio,
  Cpu,
  KeyRound,
  User,
  Phone,
  Home,
  UserPlus,
  LogIn
} from 'lucide-react';

interface RoomOption {
  id: string;
  roomNumber: string;
  floor: number;
  buildingName: string;
}

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { success, error: toastError, info } = useToast();
  
  // Tab mode: 'login' or 'register'
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  // Common Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Registration specific fields
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [emailPrefix, setEmailPrefix] = useState('');
  const [roomId, setRoomId] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Rooms list for student room selection
  const [rooms, setRooms] = useState<RoomOption[]>([]);

  // State management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot password modal states
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState<'input' | 'sent'>('input');
  const [forgotLoading, setForgotLoading] = useState(false);

  // Fetch available rooms for registration dropdown
  useEffect(() => {
    async function fetchRooms() {
      try {
        const res = await api.get('/rooms');
        if (Array.isArray(res.data)) {
          const mapped = res.data.map((r: any) => ({
            id: r.id,
            roomNumber: r.roomNumber,
            floor: r.floor,
            buildingName: r.building?.name || 'A',
          }));
          setRooms(mapped);
        }
      } catch (err) {
        // Rooms will simply be empty if offline
      }
    }
    fetchRooms();
  }, []);

  // Handle Login submission
  async function handleLoginSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', { 
        email: email.trim(), 
        password: password 
      });
      const { user } = res.data;
      const jwtToken = res.data.token || res.data.access_token;
      
      if (rememberMe) {
        localStorage.setItem('token', jwtToken);
        localStorage.setItem('access_token', jwtToken);
        localStorage.setItem('user', JSON.stringify(user));
      } else {
        sessionStorage.setItem('token', jwtToken);
        sessionStorage.setItem('access_token', jwtToken);
        sessionStorage.setItem('user', JSON.stringify(user));
        // Still keep in localStorage for axios interceptor compatibility
        localStorage.setItem('token', jwtToken);
        localStorage.setItem('access_token', jwtToken);
        localStorage.setItem('user', JSON.stringify(user));
      }

      success(`Chào mừng ${user.fullName || 'bạn'} quay trở lại!`, 'Đăng nhập thành công');

      if (user.role === 'STUDENT') {
        router.push('/student/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Email hoặc mật khẩu không đúng. Vui lòng thử lại.';
      setError(msg);
      toastError(msg, 'Đăng nhập không thành công');
    } finally {
      setLoading(false);
    }
  }

  // Handle Register submission - registration is exclusively for students
  async function handleRegisterSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!emailPrefix.trim()) {
      setError('Vui lòng nhập mã số sinh viên hoặc tên để tạo email.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu và xác nhận mật khẩu không trùng khớp.');
      return;
    }

    if (password.length < 6) {
      setError('Mật khẩu phải chứa ít nhất 6 ký tự.');
      return;
    }

    setLoading(true);

    try {
      const cleanPrefix = emailPrefix.replace(/@.*$/, '').trim();
      const finalEmail = `${cleanPrefix}@student.edu.vn`.toLowerCase();

      const payload: any = {
        studentId: studentId.trim(),
        fullName: fullName.trim(),
        email: finalEmail,
        password: password,
        roomId: roomId ? roomId : undefined,
      };

      await api.post('/auth/register', payload);

      // Do NOT auto-login. User must log in with their created account.
      success(
        `Đăng ký tài khoản thành công (${finalEmail})! Vui lòng nhập mật khẩu để đăng nhập.`, 
        'Đăng ký thành công'
      );
      
      // Switch to login tab and prefill email
      setEmail(finalEmail);
      setMode('login');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Đăng ký thất bại. Email hoặc Mã sinh viên có thể đã được sử dụng.';
      setError(msg);
      toastError(msg, 'Lỗi đăng ký');
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotSubmit(e: FormEvent) {
    e.preventDefault();
    setForgotLoading(true);
    setTimeout(() => {
      setForgotLoading(false);
      setForgotStep('sent');
    }, 600);
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#F8FAFC]">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-100/60 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-100/50 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-4xl bg-white rounded-3xl border border-slate-200/80 shadow-[0_20px_50px_rgba(15,23,42,0.08)] overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        
        {/* Left Side: Modern Brand Panel */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#1E3A8A] text-white p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle Background Pattern */}
          <div 
            className="absolute inset-0 opacity-10 pointer-events-none" 
            style={{
              backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}
          />

          <div className="relative z-10">
            {/* Header Brand */}
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-base tracking-tight text-white block leading-none">
                  SmartDorm
                </span>
                <span className="text-[11px] font-medium text-slate-400 mt-1 block">
                  IoT Campus Platform
                </span>
              </div>
            </Link>

            {/* Value Proposition */}
            <div className="mt-10 space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-blue-900/60 text-blue-300 border border-blue-700/50">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Hệ Thống Xác Thực Trực Tuyến
              </span>
              <h1 className="text-2xl font-bold text-white tracking-tight leading-snug">
                {mode === 'login' ? (
                  <>
                    Cổng Quản Trị & <br />
                    <span className="text-blue-400">Không Gian Sinh Viên</span>
                  </>
                ) : (
                  <>
                    Đăng Ký Thành Viên <br />
                    <span className="text-blue-400">Ký Túc Xá Thông Minh</span>
                  </>
                )}
              </h1>
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                {mode === 'login' 
                  ? 'Đăng nhập để điều khiển rơ-le thiết bị phòng, theo dõi cảm biến DHT22/MQ-2 và giám sát an ninh ra vào thẻ RFID.'
                  : 'Tạo tài khoản mới để trải nghiệm hệ sinh thái phòng thông minh IoT, theo dõi trạng thái thiết bị và nhận thông báo tức thời.'
                }
              </p>
            </div>
          </div>

          {/* Minimalist Telemetry Indicators */}
          <div className="relative z-10 my-8 space-y-2">
            <div className="px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-300 font-medium">MQTT Broker (1883)</span>
              </div>
              <span className="text-emerald-400 font-mono text-[11px] font-semibold">Live Connected</span>
            </div>

            <div className="px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-slate-300 font-medium">ESP32 Hardware Nodes</span>
              </div>
              <span className="text-blue-400 font-mono text-[11px] font-semibold">Active Ready</span>
            </div>
          </div>

          {/* Bottom Security Badge */}
          <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Bảo mật mã hóa JWT & bcrypt
            </span>
            <span className="font-mono text-slate-400">v2.4.0</span>
          </div>
        </div>

        {/* Right Side: Clean Form with Tab Switcher */}
        <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-between bg-white">
          <div>
            {/* Header & Tab Switcher */}
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  {mode === 'login' ? 'Đăng Nhập Hệ Thống' : 'Đăng Ký Tài Khoản'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {mode === 'login' 
                    ? 'Nhập email và mật khẩu của bạn để tiếp tục' 
                    : 'Điền thông tin bên dưới để khởi tạo tài khoản mới'
                  }
                </p>
              </div>

              {/* Segmented Mode Switcher */}
              <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    mode === 'login'
                      ? 'bg-white text-blue-900 shadow-xs border border-slate-200'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Đăng Nhập</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('register'); setError(''); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    mode === 'register'
                      ? 'bg-white text-blue-900 shadow-xs border border-slate-200'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Đăng Ký</span>
                </button>
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl p-3 mb-4 flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* ================= LOGIN FORM ================= */}
            {mode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Email Đăng Nhập
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="name@ktx.edu.vn"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-blue-700 focus:ring-2 focus:ring-blue-700/10 transition-all font-medium placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Mật Khẩu
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Nhập mật khẩu của bạn"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-blue-700 focus:ring-2 focus:ring-blue-700/10 transition-all font-medium placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember me & Forgot Password */}
                <div className="flex items-center justify-between pt-0.5 text-xs">
                  <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-900 border-slate-300 focus:ring-blue-800"
                    />
                    <span>Ghi nhớ đăng nhập</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setForgotStep('input');
                      setForgotOpen(true);
                    }}
                    className="font-semibold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer"
                  >
                    Quên mật khẩu?
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-900/10 disabled:opacity-50 mt-2"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Đăng Nhập Vào Hệ Thống</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* ================= REGISTER FORM ================= */
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                {/* Full name & Student ID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Họ và Tên <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        placeholder="Nguyễn Tấn Mạnh"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-blue-700 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mã Số Sinh Viên (MSSV) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={studentId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setStudentId(val);
                          // Auto sync with emailPrefix if user hasn't explicitly customized email
                          if (!emailPrefix || emailPrefix === studentId) {
                            setEmailPrefix(val);
                          }
                        }}
                        required
                        placeholder="Ví dụ: 52300000"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-blue-700 font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Email with fixed suffix & Room selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Sinh Viên <span className="text-red-500">*</span>
                      <span className="text-slate-400 font-normal ml-1">(Chỉ cần nhập số)</span>
                    </label>
                    <div className="flex rounded-xl overflow-hidden border border-slate-300 focus-within:border-blue-700 focus-within:ring-2 focus-within:ring-blue-700/10 bg-slate-50 transition">
                      <div className="pl-3 py-2 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="text"
                        value={emailPrefix}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/@.*$/, '').trim();
                          setEmailPrefix(raw);
                        }}
                        required
                        placeholder="52300000"
                        className="w-full pl-2 pr-1 py-2 bg-transparent text-xs text-slate-900 outline-none font-medium placeholder:text-slate-400"
                      />
                      <div className="px-2.5 py-2 bg-slate-100 border-l border-slate-200 text-xs text-slate-600 font-semibold select-none flex items-center whitespace-nowrap">
                        @student.edu.vn
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Phòng KTX Lưu Trú
                    </label>
                    <div className="relative">
                      <Home className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <select
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-blue-700 font-medium cursor-pointer"
                      >
                        <option value="">-- Chưa gán phòng (chọn sau) --</option>
                        {rooms.map((r) => (
                          <option key={r.id} value={r.id}>
                            Phòng {r.roomNumber} (Tòa {r.buildingName} - Tầng {r.floor})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Note about phone number */}
                <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 text-[11px] text-blue-700 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0" />
                  <span>Số điện thoại & thẻ RFID sẽ được cập nhật trong <strong>Hồ Sơ Cá Nhân</strong> sau khi đăng nhập.</span>
                </div>

                {/* Password & Confirm Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mật Khẩu
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="Tối thiểu 6 ký tự"
                        className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-blue-700 font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Xác Nhận Mật Khẩu
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        placeholder="Nhập lại mật khẩu"
                        className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-blue-700 font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Submit Register Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-900/10 disabled:opacity-50 mt-3"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Tạo Tài Khoản & Tiếp Tục</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Bottom Switch Link */}
          <div className="pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            {mode === 'login' ? (
              <span>
                Chưa có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('register'); setError(''); }}
                  className="text-blue-700 font-bold hover:underline cursor-pointer"
                >
                  Đăng ký ngay
                </button>
              </span>
            ) : (
              <span>
                Đã có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); }}
                  className="text-blue-700 font-bold hover:underline cursor-pointer"
                >
                  Đăng nhập tại đây
                </button>
              </span>
            )}

            <Link href="/" className="text-slate-400 hover:text-slate-700 font-medium hover:underline">
              ← Trang chủ
            </Link>
          </div>
        </div>
      </div>

      {/* Forgot Password Flow Modal */}
      <Modal
        isOpen={forgotOpen}
        onClose={() => setForgotOpen(false)}
        title={forgotStep === 'input' ? 'Khôi Phục Mật Khẩu' : 'Đã Gửi Hướng Dẫn'}
        description={forgotStep === 'input' ? 'Nhập email trường đã đăng ký để nhận liên kết đặt lại mật khẩu.' : undefined}
      >
        {forgotStep === 'input' ? (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Của Bạn
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                  placeholder="name@ktx.edu.vn"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setForgotOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={forgotLoading}
                className="px-4 py-1.5 rounded-lg bg-blue-900 text-white text-xs font-bold hover:bg-blue-800 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {forgotLoading ? 'Đang gửi...' : 'Gửi Hướng Dẫn'}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-3 space-y-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center mx-auto">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Kiểm Tra Hộp Thư Đến</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu tới <strong className="text-slate-800">{forgotEmail}</strong>.
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 font-mono">
              Mã xác nhận bảo mật: <strong className="text-blue-700">849-201</strong>
            </div>
            <button
              type="button"
              onClick={() => {
                success('Mật khẩu mẫu đã được gửi tới email của bạn.', 'Hoàn tất');
                setForgotOpen(false);
              }}
              className="w-full py-2 rounded-lg bg-blue-900 text-white text-xs font-bold hover:bg-blue-800 cursor-pointer"
            >
              Tôi Đã Nhận Được Mã
            </button>
          </div>
        )}
      </Modal>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
          <div className="w-8 h-8 border-3 border-blue-900 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}

