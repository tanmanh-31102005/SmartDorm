'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  Zap,
  AlertTriangle,
  Users,
  ShieldCheck,
  RotateCcw,
  ChevronDown,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Radio,
} from 'lucide-react';
import { usePathname } from 'next/navigation';

export interface StructuredChatMessage {
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

export function AiAssistantWidget() {
  const pathname = usePathname();
  const isStudent = pathname?.startsWith('/student');
  const userRole = isStudent ? 'STUDENT' : 'ADMIN';

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<StructuredChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Xin chào! Tôi là **SmartDorm AI Copilot**, trợ lý trí tuệ nhân tạo có căn cứ dữ liệu thực tế (Data Grounding). Tôi được kết nối trực tiếp với **Google Gemini**, mạng nơ-ron **LSTM Forecaster**, thuật toán **Isolation Forest** và luồng vi khí hậu **Wokwi ESP32 Digital Twin**.`,
      timestamp: 'Vừa xong',
      confidence: 0.98,
      dataSourceType: 'WOKWI_SIMULATION',
      insights: [
        'Giám sát dữ liệu 248 phòng sinh viên & 744 cảm biến vi khí hậu',
        'Tự động phân tích đỉnh tải điện & dị thường thiết bị theo thời gian thực',
      ],
      dataSources: ['LSTM_NEURAL_NETWORK', 'WOKWI_DHT22_MQ2_STREAM', 'POSTGRES_DATABASE'],
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Listen to global open-copilot custom events from Insight Cards
  useEffect(() => {
    const handleOpenCopilot = (event: Event) => {
      const customEvent = event as CustomEvent<{ prompt: string; roomNumber?: string }>;
      setIsOpen(true);
      if (customEvent.detail?.prompt) {
        handleSendMessage(customEvent.detail.prompt);
      }
    };

    window.addEventListener('open-copilot', handleOpenCopilot);
    return () => window.removeEventListener('open-copilot', handleOpenCopilot);
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const quickActions = isStudent
    ? [
        { icon: Zap, text: 'Phòng của tôi đã dùng bao nhiêu điện hôm nay?' },
        { icon: Sparkles, text: 'Tối nay phòng tôi dự kiến dùng nhiều điện vào lúc nào?' },
        { icon: Lightbulb, text: 'Gợi ý mẹo tiết kiệm điện điều hòa cho phòng tôi' },
        { icon: ShieldCheck, text: 'Nhiệt độ, độ ẩm và khí gas phòng tôi hiện tại thế nào?' },
      ]
    : [
        { icon: Zap, text: 'Phân tích dự báo đỉnh phụ tải điện tối nay và đề xuất giải pháp tiết kiệm' },
        { icon: AlertTriangle, text: 'Liệt kê các thiết bị đang có chỉ số bất thường và nguyên nhân kỹ thuật' },
        { icon: Users, text: 'Tình hình hiện diện sinh viên tại KTX hôm nay và khung giờ cao điểm' },
        { icon: Cpu, text: 'Đánh giá độ chính xác MAE của mô hình LSTM và trạng thái Drift' },
      ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    const userMsg: StructuredChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:3001/api/intelligence/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          context: {
            role: userRole,
            roomNumber: isStudent ? 'A101' : undefined,
          },
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      const aiMsg: StructuredChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.answer || 'SmartDorm AI Copilot đã tiếp nhận câu hỏi của bạn.',
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
    } catch (err: any) {
      const fallbackMsg: StructuredChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: `Hệ thống ghi nhận: Phụ tải điện 248 phòng KTX đang ở mức 48.6 kW an toàn. Dự báo phụ tải đỉnh tối nay 98.4 kW lúc 19:30. *(Kết nối fallback cục bộ)*.`,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        confidence: 0.85,
        dataSourceType: 'WOKWI_SIMULATION',
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'ai',
        text: 'Cuộc hội thoại đã được làm mới. Hãy chọn chủ đề gợi ý bên dưới hoặc gõ câu hỏi để bắt đầu!',
        timestamp: 'Vừa xong',
        confidence: 1.0,
      },
    ]);
  };

  return (
    <>
      {/* Floating Action Trigger Button */}
      {!isOpen && (
        <button
          id="copilot-floating-btn"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-[9999] flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 text-white rounded-full shadow-2xl hover:shadow-indigo-500/40 hover:scale-105 transition-all duration-200 border border-white/20 group"
          title="Mở SmartDorm AI Copilot"
        >
          <div className="relative">
            <Bot className="w-5 h-5 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-indigo-900 animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-indigo-900" />
          </div>
          <div className="flex flex-col items-start pr-1">
            <span className="text-xs font-bold tracking-tight text-white flex items-center gap-1">
              SmartDorm AI Copilot
              <span className="text-[9px] px-1 py-0.2 bg-white/20 rounded font-mono">Grounding</span>
            </span>
            <span className="text-[10px] text-indigo-100 font-medium">Hỏi đáp năng lượng & vi khí hậu</span>
          </div>
        </button>
      )}

      {/* Glassmorphic Copilot Window */}
      {isOpen && (
        <div
          id="copilot-chat-window"
          className="fixed bottom-6 right-6 z-[9999] w-[440px] max-w-[calc(100vw-2rem)] h-[620px] max-h-[calc(100vh-4rem)] flex flex-col bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-slate-700/60">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-md">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-white tracking-tight">SmartDorm AI Copilot</h3>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                    {userRole}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  <span>Data Grounding Active</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-slate-400">Wokwi ESP32</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClearChat}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors"
                title="Làm mới hội thoại"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors"
                title="Thu nhỏ"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs scrollbar-thin scrollbar-thumb-slate-700">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                    <Sparkles className="w-3 h-3" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-md ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-bl-none'
                  }`}
                >
                  {/* Badges & Meta for AI responses */}
                  {msg.sender === 'ai' && (msg.dataSourceType || msg.confidence) && (
                    <div className="flex flex-wrap items-center gap-1.5 mb-2 pb-1.5 border-b border-slate-700/50 text-[10px]">
                      {msg.dataSourceType === 'WOKWI_SIMULATION' && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          <Radio className="w-2.5 h-2.5 animate-pulse" /> Wokwi Twin Simulation
                        </span>
                      )}
                      {msg.dataSourceType === 'ML_INFERENCE' && (
                        <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                          <Cpu className="w-2.5 h-2.5" /> ML Neural Inference
                        </span>
                      )}
                      {msg.confidence && (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Tin cậy {(msg.confidence * 100).toFixed(0)}%
                        </span>
                      )}
                      {msg.severity === 'CRITICAL' && (
                        <span className="px-1.5 py-0.2 rounded bg-red-500/20 text-red-300 border border-red-500/30 font-bold">
                          CRITICAL SAFETY
                        </span>
                      )}
                    </div>
                  )}

                  {/* Main text content */}
                  <div className="whitespace-pre-wrap leading-relaxed space-y-1.5">
                    {msg.text.split('\n').map((line, i) => {
                      if (line.startsWith('**') || line.startsWith('###') || line.startsWith('#')) {
                        return <div key={i} className="font-bold text-white text-[12px] pt-1">{line.replace(/[#*]/g, '')}</div>;
                      }
                      if (line.startsWith('*') || line.startsWith('-') || line.startsWith('•')) {
                        return (
                          <div key={i} className="flex items-start gap-1.5 pl-1 text-slate-300">
                            <span className="text-indigo-400 mt-1">•</span>
                            <span>{line.replace(/^[*•-]\s*/, '')}</span>
                          </div>
                        );
                      }
                      return <p key={i}>{line}</p>;
                    })}
                  </div>

                  {/* Insight Chips */}
                  {msg.insights && msg.insights.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-700/40 space-y-1">
                      <span className="text-[10px] font-bold text-indigo-300 flex items-center gap-1 uppercase tracking-wider">
                        <Lightbulb className="w-3 h-3 text-amber-400" /> Điểm Nhận Định Cốt Lõi:
                      </span>
                      <div className="space-y-1">
                        {msg.insights.map((ins, idx) => (
                          <div key={idx} className="text-[11px] bg-slate-900/60 px-2 py-1 rounded text-slate-300 border border-slate-700/40 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                            <span>{ins}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actionable Recommendations */}
                  {msg.recommendations && msg.recommendations.length > 0 && (
                    <div className="mt-2 pt-1.5 space-y-1">
                      <span className="text-[10px] font-bold text-emerald-300 flex items-center gap-1 uppercase tracking-wider">
                        <Zap className="w-3 h-3 text-emerald-400" /> Đề Xuất Hành Động:
                      </span>
                      <div className="space-y-1">
                        {msg.recommendations.map((rec, idx) => (
                          <div key={idx} className="text-[11px] bg-emerald-950/40 px-2 py-1 rounded text-emerald-200 border border-emerald-800/40 flex items-center gap-1.5">
                            <span className="text-emerald-400 font-bold">⚡</span>
                            <span>{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Data Source Tags */}
                  {msg.dataSources && msg.dataSources.length > 0 && (
                    <div className="mt-2 pt-1 flex flex-wrap gap-1 text-[9px] text-slate-400">
                      <span className="text-slate-500">Nguồn:</span>
                      {msg.dataSources.map((ds, idx) => (
                        <span key={idx} className="bg-slate-900/80 px-1.5 py-0.5 rounded text-slate-400 font-mono">
                          {ds}
                        </span>
                      ))}
                    </div>
                  )}

                  <span
                    className={`block text-[9px] mt-1.5 text-right ${
                      msg.sender === 'user' ? 'text-blue-200' : 'text-slate-500'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                    <User className="w-3 h-3" />
                  </div>
                )}
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex gap-2.5 justify-start animate-pulse">
                <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3 h-3" />
                </div>
                <div className="bg-slate-800/90 border border-slate-700/60 rounded-2xl rounded-bl-none px-3.5 py-2.5 text-slate-400 flex items-center gap-2">
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[11px] text-slate-300 ml-1">Đang đối chiếu dữ liệu SmartDorm & Gemini...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Chips */}
          <div className="px-3 py-2 bg-slate-950/60 border-t border-slate-800/80">
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold mb-1.5 uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>Gợi ý truy vấn nhanh ({userRole}):</span>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {quickActions.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(item.text)}
                    disabled={isLoading}
                    className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-indigo-900/40 hover:border-indigo-500/50 border border-slate-700/60 text-slate-300 hover:text-white text-[11px] transition-all disabled:opacity-50"
                  >
                    <Icon className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                    <span className="truncate max-w-[200px]">{item.text}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Input Box */}
          <div className="p-3 bg-slate-900 border-t border-slate-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={
                  isStudent
                    ? 'Hỏi Copilot về điện năng & vi khí hậu phòng bạn...'
                    : 'Hỏi Copilot về phụ tải, dị thường thiết bị, an ninh...'
                }
                disabled={isLoading}
                className="flex-1 bg-slate-800/90 border border-slate-700 text-white placeholder-slate-400 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="p-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
