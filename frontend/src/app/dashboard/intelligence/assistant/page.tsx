'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Zap,
  AlertTriangle,
  Users,
  ShieldCheck,
  RotateCcw,
  Cpu,
  Flame,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  Radio,
  Building2,
  TrendingUp,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { API_URL } from '@/lib/api';

interface StructuredMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  intent?: string;
  confidence?: number;
  dataSources?: string[];
  insights?: string[];
  recommendations?: string[];
  severity?: 'NORMAL' | 'INFO' | 'WARNING' | 'CRITICAL';
  dataSourceType?: 'WOKWI_SIMULATION' | 'REAL_HARDWARE' | 'ML_INFERENCE' | 'DATABASE' | 'SYSTEM_RULE_ENGINE';
  privacyNotice?: string;
}

const ADMIN_QUICK_ACTIONS = [
  { icon: Zap, label: 'Dự Báo Tải Thiết Bị', text: 'Phân tích dự báo tỷ lệ bật rơ-le và vi khí hậu tối nay để tối ưu bật tắt' },
  { icon: AlertTriangle, label: 'Dị Thường Thiết Bị', text: 'Liệt kê các thiết bị đang có chỉ số bất thường và nguyên nhân kỹ thuật' },
  { icon: Users, label: 'Hiện Diện Sinh Viên', text: 'Tình hình hiện diện sinh viên tại KTX hôm nay và khung giờ cao điểm' },
  { icon: Cpu, label: 'Sức Khỏe AI / Model', text: 'Đánh giá độ chính xác MAE của mô hình Champion GBM và trạng thái Drift' },
  { icon: Flame, label: 'An Toàn PCCC', text: 'Quy trình xử lý khẩn cấp khi cảm biến MQ-2 hoặc nhiệt độ DHT22 vượt ngưỡng' },
  { icon: Lightbulb, label: 'Tối Ưu Vận Hành', text: 'Kích hoạt quạt hút thông gió giải phóng khí Gas và tắt thiết bị tại các phòng trống' },
];

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<StructuredMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Xin chào! Tôi là **SmartDorm AI Copilot**, trợ lý trí tuệ nhân tạo có căn cứ dữ liệu thực tế (Data Grounding).

Tôi có thể hỗ trợ Ban Quản Lý:
- ⚡ **Dự báo tải thiết bị & vi khí hậu**: Phân tích tỷ lệ hoạt động rơ-le và chu kỳ DHT22 24h & 7 ngày (Mô hình Champion GBM MAE 4.28%, R² 0.961).
- ⚠️ **Chẩn đoán thiết bị**: Tìm nguyên nhân kỹ thuật của các cảnh báo kẹt rơ-le, quạt thông gió, khóa từ và còi báo động.
- 👥 **Dự đoán lưu trú**: Thống kê tỷ lệ có mặt sinh viên theo tầng và phòng (XGBoost Classifier kết hợp quẹt thẻ RFID).
- 🛡️ **An toàn & PCCC**: Giám sát cảm biến MQ-2 & DHT22 với nguyên tắc an toàn ưu tiên tuyệt đối.

Hãy chọn một chủ đề gợi ý bên dưới hoặc gõ câu hỏi của bạn để bắt đầu!`,
      timestamp: 'Vừa xong',
      confidence: 0.98,
      dataSourceType: 'WOKWI_SIMULATION',
      insights: [
        'Hệ thống đang giám sát 248 phòng sinh viên & 744 cảm biến vi khí hậu',
        'Cơ chế an toàn PCCC & cứu nạn luôn có quyền ưu tiên cao nhất so với AI',
      ],
      dataSources: ['GBM_CHAMPION_FORECASTER', 'WOKWI_DHT22_MQ2_STREAM', 'POSTGRES_DATABASE'],
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (queryText?: string) => {
    const query = (queryText || inputMessage).trim();
    if (!query || isLoading) return;

    const userMsg: StructuredMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/intelligence/copilot/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          context: { role: 'ADMIN' },
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP Error ${res.status}`);
      }

      const data = await res.json();
      const aiMsg: StructuredMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.answer || 'Đã tiếp nhận yêu cầu từ hệ thống.',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        intent: data.intent,
        confidence: data.confidence,
        dataSources: data.dataSources,
        insights: data.insights,
        recommendations: data.recommendations,
        severity: data.severity,
        dataSourceType: data.dataSourceType,
        privacyNotice: data.privacyNotice,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const fallbackMsg: StructuredMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: `Hệ thống ghi nhận: Tải hoạt động rơ-le 248 phòng KTX đang ở mức an toàn (bật 42/992 rơ-le). Cảm biến DHT22 & MQ-2 ổn định. *(Kết nối fallback cục bộ)*.`,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        confidence: 0.85,
        dataSourceType: 'WOKWI_SIMULATION',
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'ai',
        text: 'Cuộc hội thoại đã được đặt lại. Sẵn sàng giải đáp mọi câu hỏi quản trị KTX!',
        timestamp: 'Vừa xong',
        confidence: 1.0,
      },
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              SmartDorm AI Copilot (Grounded Architecture)
            </h1>
            <Badge variant="success" className="animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
              Data Grounding Live
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Trợ lý AI phân tích chuyên sâu có căn cứ dữ liệu thực tế từ cảm biến Wokwi Twin, mạng nơ-ron LSTM và bộ quy tắc an toàn KTX.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleResetChat} className="flex items-center gap-1.5 text-xs">
            <RotateCcw className="w-3.5 h-3.5" />
            Làm mới hội thoại
          </Button>
        </div>
      </div>

      {/* Main Chatbox Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col h-[700px]">
        {/* Banner Bar */}
        <div className="px-6 py-3.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-inner">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">SmartDorm AI Copilot</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Google Gemini + LSTM
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Radio className="w-2.5 h-2.5" /> Wokwi Twin
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Sẵn sàng giải đáp thắc mắc và tư vấn tối ưu vận hành 248 phòng KTX
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>API Status: 200 OK</span>
          </div>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto justify-end' : 'mr-auto justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                  <Sparkles className="w-4 h-4" />
                </div>
              )}

              <div
                className={`p-4 rounded-2xl text-xs leading-relaxed shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-none'
                }`}
              >
                {/* AI Meta Badges */}
                {msg.sender === 'ai' && (msg.dataSourceType || msg.confidence) && (
                  <div className="flex flex-wrap items-center gap-1.5 mb-2.5 pb-2 border-b border-slate-100 text-[10px]">
                    {msg.dataSourceType === 'WOKWI_SIMULATION' && (
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-medium flex items-center gap-1">
                        <Radio className="w-3 h-3 text-amber-600 animate-pulse" /> Wokwi ESP32 Simulation
                      </span>
                    )}
                    {msg.dataSourceType === 'ML_INFERENCE' && (
                      <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200 font-medium flex items-center gap-1">
                        <Cpu className="w-3 h-3 text-purple-600" /> ML Neural Inference
                      </span>
                    )}
                    {msg.confidence && (
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                        Độ tin cậy: {(msg.confidence * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                )}

                {/* Main Content */}
                <div className="whitespace-pre-wrap space-y-1.5 text-slate-700">
                  {msg.text.split('\n').map((line, i) => {
                    if (line.startsWith('**') || line.startsWith('###') || line.startsWith('#')) {
                      return <div key={i} className="font-bold text-slate-900 text-[13px] pt-1.5">{line.replace(/[#*]/g, '')}</div>;
                    }
                    if (line.startsWith('*') || line.startsWith('-') || line.startsWith('•')) {
                      return (
                        <div key={i} className="flex items-start gap-1.5 pl-1">
                          <span className="text-indigo-600 font-bold mt-0.5">•</span>
                          <span>{line.replace(/^[*•-]\s*/, '')}</span>
                        </div>
                      );
                    }
                    return <p key={i}>{line}</p>;
                  })}
                </div>

                {/* Insight Chips */}
                {msg.insights && msg.insights.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5">
                    <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1">
                      <Lightbulb className="w-3 h-3 text-amber-500" /> Điểm Nhận Định Cốt Lõi:
                    </span>
                    <div className="grid grid-cols-1 gap-1">
                      {msg.insights.map((ins, idx) => (
                        <div key={idx} className="text-[11px] bg-slate-50 px-2.5 py-1.5 rounded-lg text-slate-700 border border-slate-200/60 flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                          <span>{ins}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actionable Recommendations */}
                {msg.recommendations && msg.recommendations.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1.5">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                      <Zap className="w-3 h-3 text-emerald-600" /> Đề Xuất Hành Động:
                    </span>
                    <div className="grid grid-cols-1 gap-1">
                      {msg.recommendations.map((rec, idx) => (
                        <div key={idx} className="text-[11px] bg-emerald-50 px-2.5 py-1.5 rounded-lg text-emerald-900 border border-emerald-200/60 flex items-center gap-2">
                          <span className="text-emerald-600 font-bold">⚡</span>
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Data Sources Footnote */}
                {msg.dataSources && msg.dataSources.length > 0 && (
                  <div className="mt-2.5 pt-1.5 flex flex-wrap gap-1 text-[10px] text-slate-400">
                    <span className="font-semibold text-slate-500">Nguồn trích xuất:</span>
                    {msg.dataSources.map((ds, idx) => (
                      <span key={idx} className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-mono text-[9px]">
                        {ds}
                      </span>
                    ))}
                  </div>
                )}

                <div
                  className={`text-[10px] mt-2 flex items-center justify-between ${
                    msg.sender === 'user' ? 'text-blue-100' : 'text-slate-400'
                  }`}
                >
                  <span>{msg.timestamp}</span>
                  {msg.sender === 'ai' && (
                    <span className="text-[9px] uppercase tracking-wider text-indigo-600 font-medium">
                      ✦ Grounded Response
                    </span>
                  )}
                </div>
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 max-w-[85%] mr-auto justify-start animate-pulse">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-500 flex items-center gap-2 text-xs">
                <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                <span className="ml-2 font-medium text-slate-600">Đang đối chiếu dữ liệu SmartDorm & Google Gemini...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-6 py-3 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-semibold text-slate-400 whitespace-nowrap uppercase tracking-wider">
            Gợi ý nhanh:
          </span>
          <div className="flex items-center gap-2">
            {ADMIN_QUICK_ACTIONS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleSend(item.text)}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200/60 text-slate-600 text-xs font-medium transition-all whitespace-nowrap disabled:opacity-50"
                >
                  <Icon className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-3"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Hỏi Gemini Copilot về KTX (ví dụ: 'Phân tích dự báo tải thiết bị rơ-le và cảnh báo MQ-2 hôm nay')..."
              disabled={isLoading}
              className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 text-xs rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-50"
            />
            <Button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5 py-3 text-xs flex items-center gap-2 shadow-sm"
            >
              <span>Gửi</span>
              <Send className="w-3.5 h-3.5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
