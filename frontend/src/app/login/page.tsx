'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
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
  UserCheck, 
  Sparkles,
  Radio,
  Cpu,
  Send,
  KeyRound,
  CheckCircle2
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  
  const [email, setEmail] = useState('admin@ktx.edu.vn');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot password modal states
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState<'input' | 'sent'>('input');
  const [forgotLoading, setForgotLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', { email, password });
      const { access_token, user } = res.data;
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      success(`Chào mừng ${user.fullName || 'bạn'} quay trở lại!`, 'Đăng nhập thành công');

      if (user.role === 'STUDENT') {
        router.push('/student/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      // Fallback mock login for demo when backend is offline
      if (!err.response || err.code === 'ERR_NETWORK') {
        let mockUser: any;
        if (email.includes('student') || email.startsWith('sv')) {
          mockUser = {
            id: 'mock-sv-1',
            studentId: 'SV2024001',
            fullName: 'Nguyễn Văn An',
            email: email,
            role: 'STUDENT',
            roomId: 'room-101',
          };
          localStorage.setItem('token', 'mock_student_jwt_token');
          localStorage.setItem('user', JSON.stringify(mockUser));
          success('Đăng nhập chế độ Demo Sinh Viên', 'Thông báo');
          router.push('/student/dashboard');
          return;
        } else {
          mockUser = {
            id: 'mock-admin-1',
            studentId: 'ADMIN001',
            fullName: 'Quản Trị Viên',
            email: email,
            role: 'ADMIN',
          };
          localStorage.setItem('token', 'mock_admin_jwt_token');
          localStorage.setItem('user', JSON.stringify(mockUser));
          success('Đăng nhập chế độ Demo Quản Trị Viên', 'Thông báo');
          router.push('/dashboard');
          return;
        }
      }

      const msg = err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại email hoặc mật khẩu.';
      setError(msg);
      toastError(msg, 'Lỗi đăng nhập');
    } finally {
      setLoading(false);
    }
  }

  function selectAccount(type: 'admin' | 'student') {
    setError('');
    if (type === 'admin') {
      setEmail('admin@ktx.edu.vn');
      setPassword('admin123');
    } else {
      setEmail('sv001@student.edu.vn');
      setPassword('sinhvien123');
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
            <div className="mt-12 space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-blue-900/60 text-blue-300 border border-blue-700/50">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Hệ Thống Trực Tuyến
              </span>
              <h1 className="text-2xl font-bold text-white tracking-tight leading-snug">
                Quản Lý Ký Túc Xá <br />
                <span className="text-blue-400">Thông Minh & An Toàn</span>
              </h1>
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                Tự động hóa cảm biến vi khí hậu, điều khiển thiết bị rơ-le qua MQTT và kiểm soát ra vào thẻ từ RFID.
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
              <span className="text-emerald-400 font-mono text-[11px] font-semibold">Online</span>
            </div>

            <div className="px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-slate-300 font-medium">ESP32 Telemetry</span>
              </div>
              <span className="text-blue-400 font-mono text-[11px] font-semibold">1,186 Nodes</span>
            </div>
          </div>

          {/* Bottom Security Badge */}
          <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Bảo mật JWT & NVS
            </span>
            <span className="font-mono text-slate-400">v2.4</span>
          </div>
        </div>

        {/* Right Side: Clean Login Form */}
        <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-between bg-white">
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Đăng Nhập Cổng Quản Lý</h2>
              <p className="text-xs text-slate-500 mt-1">
                Chọn tài khoản hoặc nhập email và mật khẩu của bạn
              </p>
            </div>

            {/* Quick Demo Credentials Switcher */}
            <div className="mb-6 p-1.5 bg-slate-100/80 rounded-xl flex items-center gap-1 border border-slate-200/60">
              <button
                type="button"
                onClick={() => selectAccount('admin')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  email === 'admin@ktx.edu.vn'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className={`w-4 h-4 ${email === 'admin@ktx.edu.vn' ? 'text-blue-700' : 'text-slate-400'}`} />
                <span>Ban Quản Trị</span>
              </button>

              <button
                type="button"
                onClick={() => selectAccount('student')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  email === 'sv001@student.edu.vn'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className={`w-4 h-4 ${email === 'sv001@student.edu.vn' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>Sinh Viên KTX</span>
              </button>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl p-3 mb-4 flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
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
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all font-medium placeholder:text-slate-400"
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
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all font-medium placeholder:text-slate-400"
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
                  <span>Ghi nhớ</span>
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
          </div>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Tài khoản demo đã sẵn sàng</span>
            <Link href="/" className="text-blue-700 font-semibold hover:underline">
              ← Về trang chủ
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
                success('Mật khẩu mẫu đã được khôi phục: admin123', 'Hoàn tất');
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
