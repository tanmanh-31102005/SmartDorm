'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { 
  Cpu, 
  Thermometer, 
  Droplets, 
  Flame, 
  Radio, 
  CreditCard, 
  Send, 
  CheckCircle2, 
  XCircle, 
  Activity,
  Terminal,
  Zap,
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface WokwiState {
  connected: boolean;
  lastSeen: Date | null;
  room: string;
  temperature: number | null;
  humidity: number | null;
  gasLevel: number | null;
  gasAlert: boolean;
  tempAlert: boolean;
  lastRfid: { cardId: string; authorized: boolean; time: Date } | null;
  lastCommand: { type: string; action: string; time: Date } | null;
}

export default function WokwiPanel() {
  const [state, setState] = useState<WokwiState>({
    connected: false, lastSeen: null, room: '—',
    temperature: null, humidity: null, gasLevel: null,
    gasAlert: false, tempAlert: false, lastRfid: null, lastCommand: null,
  });
  const [blinkSensor, setBlinkSensor] = useState(false);
  const [blinkRfid,   setBlinkRfid]   = useState(false);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [sensRes, accessRes] = await Promise.allSettled([
          api.get('/sensors/recent?limit=1'),
          api.get('/access-log?limit=1'),
        ]);

        if (sensRes.status === 'fulfilled' && Array.isArray(sensRes.value.data) && sensRes.value.data.length > 0) {
          const s = sensRes.value.data[sensRes.value.data.length - 1];
          setState(prev => ({
            ...prev,
            connected: true,
            lastSeen: new Date(s.recordedAt),
            room: s.room?.roomNumber || '101',
            temperature: s.temperature,
            humidity: s.humidity,
            gasLevel: s.gasLevel,
            gasAlert: s.gasAlert,
            tempAlert: s.tempAlert,
          }));
        }

        if (accessRes.status === 'fulfilled' && accessRes.value.data?.logs?.length > 0) {
          const log = accessRes.value.data.logs[0];
          setState(prev => ({
            ...prev,
            lastRfid: {
              cardId: log.rfidCardId,
              authorized: log.authorized,
              time: new Date(log.timestamp),
            },
          }));
        }
      } catch (e) {
        console.error('Wokwi initial data load', e);
      }
    }
    loadInitialData();

    const socket = getSocket();

    socket.on('sensor:update', (data: any) => {
      setState(prev => ({
        ...prev,
        connected:   true,
        lastSeen:    new Date(),
        room:        data.roomId || data.room || prev.room,
        temperature: data.temperature ?? prev.temperature,
        humidity:    data.humidity    ?? prev.humidity,
        gasLevel:    data.gas_level   ?? prev.gasLevel,
        gasAlert:    data.gas_alert   || false,
        tempAlert:   data.temp_alert  || false,
      }));
      setBlinkSensor(true);
      setTimeout(() => setBlinkSensor(false), 800);
    });

    socket.on('access:log', (data: any) => {
      setState(prev => ({
        ...prev,
        connected: true,
        lastSeen:  new Date(),
        lastRfid:  { cardId: data.rfidCardId || data.card_id, authorized: data.authorized, time: new Date() },
      }));
      setBlinkRfid(true);
      setTimeout(() => setBlinkRfid(false), 800);
    });

    socket.on('device:status', (data: any) => {
      setState(prev => ({
        ...prev,
        lastCommand: { type: data.deviceType || data.type, action: data.action, time: new Date() },
      }));
    });

    const timer = setInterval(() => {
      setState(prev => {
        if (prev.lastSeen && Date.now() - prev.lastSeen.getTime() > 30000) {
          return { ...prev, connected: false };
        }
        return prev;
      });
    }, 10000);

    return () => {
      socket.off('sensor:update');
      socket.off('access:log');
      socket.off('device:status');
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="admin-card p-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-900 leading-tight">Wokwi ESP32 IoT Node</h3>
              <span className="badge-clean badge-neutral font-mono text-[10px]">Phòng 101</span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Trạng thái kết nối phần cứng và dữ liệu vi mạch</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`badge-clean ${state.connected ? 'badge-success' : 'badge-neutral'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${state.connected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            {state.connected ? 'ESP32 Trực Tuyến' : 'Chưa Kết Nối'}
          </span>
        </div>
      </div>

      {!state.connected ? (
        <div className="py-8 text-center bg-slate-50/70 rounded-lg border border-dashed border-slate-200">
          <Radio className="w-8 h-8 text-slate-300 mx-auto mb-2 animate-pulse" />
          <p className="text-xs font-bold text-slate-700">Chưa nhận tín hiệu vi điều khiển ESP32</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Khởi chạy Wokwi Simulator trên VS Code hoặc Python Simulator để kết nối</p>
          <div className="mt-3 inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 text-xs font-mono px-3 py-1.5 rounded-lg shadow-2xs">
            <Terminal className="w-3.5 h-3.5 text-blue-600" />
            <span>python simulator/demo_quick.py</span>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* 3 Metric Chips */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Temperature */}
            <div className={`p-3.5 rounded-lg border text-center ${
              state.tempAlert 
                ? 'bg-red-50 border-red-200 text-red-900' 
                : 'bg-slate-50 border-slate-100 text-slate-900'
            }`}>
              <div className="flex items-center justify-center text-slate-400 mb-1">
                <Thermometer className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-xl font-bold font-mono mb-0.5">
                {state.temperature !== null ? `${state.temperature.toFixed(1)}°C` : '—'}
              </div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Nhiệt độ (DHT22)</div>
              {state.tempAlert && (
                <div className="text-[10px] font-bold text-red-600 mt-1 bg-red-100 py-0.5 rounded">
                  CẢNH BÁO NHIỆT CAO
                </div>
              )}
            </div>

            {/* Humidity */}
            <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50 text-center">
              <div className="flex items-center justify-center text-slate-400 mb-1">
                <Droplets className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl font-bold text-emerald-600 font-mono mb-0.5">
                {state.humidity !== null ? `${state.humidity.toFixed(0)}%` : '—'}
              </div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Độ ẩm (DHT22)</div>
            </div>

            {/* Gas Level */}
            <div className={`p-3.5 rounded-lg border text-center ${
              state.gasAlert 
                ? 'bg-red-50 border-red-200 text-red-900' 
                : 'bg-slate-50 border-slate-100 text-slate-900'
            }`}>
              <div className="flex items-center justify-center text-slate-400 mb-1">
                <Flame className={`w-4 h-4 ${(state.gasLevel || 0) > 40 ? 'text-red-600' : 'text-slate-400'}`} />
              </div>
              <div className={`text-xl font-bold font-mono mb-0.5 ${
                state.gasAlert ? 'text-red-600' : 'text-slate-900'
              }`}>
                {state.gasLevel !== null ? `${state.gasLevel.toFixed(0)}%` : '—'}
              </div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Nồng độ Gas (MQ-2)</div>
              {state.gasAlert && (
                <div className="text-[10px] font-bold text-red-600 mt-1 bg-red-100 py-0.5 rounded">
                  RÒ RỈ KHÍ GAS
                </div>
              )}
            </div>
          </div>

          {/* Gas Sensor Progress */}
          {state.gasLevel !== null && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-blue-600" />
                  Mức đo cảm biến Gas MQ-2 Analog Pin 34
                </span>
                <span className={`font-mono font-bold ${state.gasLevel > 60 ? 'text-red-600' : 'text-slate-700'}`}>
                  {state.gasLevel.toFixed(1)}%
                </span>
              </div>
              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(state.gasLevel, 100)}%`,
                    backgroundColor: state.gasLevel > 70 ? '#ef4444' : state.gasLevel > 40 ? '#f59e0b' : '#10b981'
                  }}
                />
              </div>
            </div>
          )}

          {/* Activity / Event Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* RFID Event */}
            <div className={`p-3 rounded-lg border ${
              blinkRfid ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-100'
            }`}>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                Lượt Quẹt Thẻ RFID Gần Nhất
              </div>
              {state.lastRfid ? (
                <div>
                  <div className={`text-xs font-bold flex items-center gap-1.5 ${
                    state.lastRfid.authorized ? 'text-emerald-700' : 'text-red-700'
                  }`}>
                    {state.lastRfid.authorized ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-red-600" />
                    )}
                    <span>{state.lastRfid.authorized ? 'Hợp lệ — Mở cửa' : 'Từ chối truy cập'}</span>
                  </div>
                  <div className="text-xs font-mono text-slate-600 mt-1 bg-white px-2 py-0.5 rounded border border-slate-200 inline-block font-medium">
                    {state.lastRfid.cardId}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400 font-medium">Chưa có lượt quẹt thẻ nào</div>
              )}
            </div>

            {/* Last Command */}
            <div className="p-3 rounded-lg border border-slate-100 bg-slate-50">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-slate-600" />
                Lệnh Điều Khiển Gần Nhất
              </div>
              {state.lastCommand ? (
                <div>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">{state.lastCommand.type}</span>
                    <span>→</span>
                    <span className="uppercase text-blue-600">{state.lastCommand.action}</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-1">
                    Thời gian: {state.lastCommand.time.toLocaleTimeString('vi-VN')}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400 font-medium">Chưa có lệnh điều khiển</div>
              )}
            </div>
          </div>

          {/* Timestamp */}
          <div className="text-right text-[11px] font-mono text-slate-400 pt-1 flex items-center justify-end gap-2">
            <span>Đồng bộ: {state.lastSeen?.toLocaleTimeString('vi-VN')}</span>
            {blinkSensor && (
              <span className="text-emerald-600 font-bold flex items-center gap-1 text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                TELEMETRY LIVE
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
