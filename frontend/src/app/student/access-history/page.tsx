'use client';
import { useEffect, useState } from 'react';
import { getSocket } from '@/lib/socket';
import api from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { 
  CreditCard, 
  LogIn, 
  LogOut, 
  CheckCircle2, 
  Clock, 
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Radio,
  RefreshCw
} from 'lucide-react';

interface AccessLogItem {
  id: string;
  time: string;
  date: string;
  action: 'ENTRY' | 'EXIT' | 'DENIED';
  door: string;
  status: string;
  cardId: string;
  studentName?: string;
  isNew?: boolean;
}

export default function StudentAccessHistoryPage() {
  const [logs, setLogs] = useState<AccessLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRfid, setUserRfid] = useState('CARD_A1B2C3D4');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/access-log?limit=50');
      if (res.data?.logs && Array.isArray(res.data.logs)) {
        const mapped = res.data.logs.map((l: any) => {
          const d = new Date(l.timestamp);
          const timeStr = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const dateStr = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
          const actionUpper = (l.action || 'entry').toUpperCase() as 'ENTRY' | 'EXIT' | 'DENIED';

          return {
            id: l.id,
            time: timeStr,
            date: dateStr,
            action: !l.authorized ? 'DENIED' : actionUpper === 'EXIT' ? 'EXIT' : 'ENTRY',
            door: `Cửa Phòng ${l.room?.building?.name || 'A'}${l.room?.roomNumber || '101'}`,
            status: l.authorized ? 'Hợp lệ' : 'Từ chối (Không cấp quyền)',
            cardId: l.rfidCardId,
            studentName: l.user?.fullName,
          };
        });
        setLogs(mapped);
      }
    } catch (e) {
      console.warn('Cannot fetch access logs from server, using fallback');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Read logged-in student info if available
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u.rfidCardId) setUserRfid(u.rfidCardId);
      }
    } catch (e) {}

    fetchLogs();

    // Subscribe to real-time RFID tap events from Wokwi / Simulator
    const socket = getSocket();
    const handleLiveAccess = (data: any) => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const dateStr = now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const actionUpper = (data.action || 'entry').toUpperCase();

      const newLog: AccessLogItem = {
        id: `live-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        time: timeStr,
        date: `Hôm nay, ${dateStr}`,
        action: !data.authorized ? 'DENIED' : actionUpper === 'EXIT' ? 'EXIT' : 'ENTRY',
        door: `Cửa Phòng ${data.building || 'A'}${data.room || '101'}`,
        status: data.authorized ? 'Hợp lệ (Vừa quẹt)' : 'Từ chối (Thẻ không hợp lệ)',
        cardId: data.cardId || data.rfidCardId || 'UNKNOWN',
        studentName: data.user?.fullName || data.user?.name || (data.authorized ? 'Sinh viên' : 'Thẻ lạ'),
        isNew: true,
      };

      setLogs((prev) => [newLog, ...prev.slice(0, 49)]);
    };

    socket.on('access:log', handleLiveAccess);

    return () => {
      socket.off('access:log', handleLiveAccess);
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Lịch Sử Quẹt Thẻ Của Bạn (RFID Access)</h1>
            <Badge variant="success" size="sm" dot pulse>
              Live Sync
            </Badge>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Dữ liệu đồng bộ trực tiếp thời gian thực từ phần cứng ESP32 / Wokwi và máy chủ KTX.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-700' : ''}`} />
            <span>Làm mới</span>
          </button>
          <Badge variant="success" size="md">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Thẻ Đang Hoạt Động</span>
          </Badge>
        </div>
      </div>

      {/* Access Logs List */}
      <div className="admin-card overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-700" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Nhật Ký Quẹt Thẻ Ra Vào Phòng Realtime
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
            <span className="text-xs text-slate-500 font-mono">UID: {userRfid}</span>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Chưa có lịch sử quẹt thẻ. Hãy quẹt thẻ trên Wokwi hoặc Simulator để xem nhật ký xuất hiện ngay lập tức.
            </div>
          ) : (
            logs.map((log) => {
              const isDenied = log.action === 'DENIED';
              const isEntry = log.action === 'ENTRY';

              return (
                <div
                  key={log.id}
                  className={`p-4 flex items-center justify-between transition-colors text-xs ${
                    log.isNew ? 'bg-emerald-50/80 animate-pulse' : 'hover:bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isDenied
                          ? 'bg-rose-100 text-rose-700'
                          : isEntry
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {isDenied ? (
                        <ShieldAlert className="w-4 h-4" />
                      ) : isEntry ? (
                        <LogIn className="w-4 h-4" />
                      ) : (
                        <LogOut className="w-4 h-4" />
                      )}
                    </div>

                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span>
                          {isDenied
                            ? 'Từ chối quẹt thẻ'
                            : isEntry
                            ? 'Mở cửa vào phòng'
                            : 'Rời khỏi phòng'}
                        </span>
                        {log.studentName && (
                          <span className="text-[11px] font-normal text-slate-500">
                            ({log.studentName})
                          </span>
                        )}
                        {log.isNew && (
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-600 text-white uppercase tracking-wider">
                            Vừa xong
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                        <span>{log.door}</span>
                        <span>•</span>
                        <span>UID: {log.cardId}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end">
                    <Badge variant={isDenied ? 'critical' : 'success'} size="sm" className="mb-1">
                      {log.status}
                    </Badge>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {log.date} · {log.time}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

