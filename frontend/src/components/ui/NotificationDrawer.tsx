'use client';
import React, { useState } from 'react';
import { Drawer } from './Drawer';
import { Badge } from './Badge';
import { Button } from './Button';
import { useRouter } from 'next/navigation';
import { 
  Bell, 
  Flame, 
  AlertTriangle, 
  ShieldCheck, 
  DoorOpen, 
  Zap, 
  CheckCheck, 
  ArrowRight,
  Clock
} from 'lucide-react';

export interface NotificationItem {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  source: string;
  time: string;
  read: boolean;
  link?: string;
}

export interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllRead?: () => void;
  onMarkRead?: (id: string) => void;
}

export function NotificationDrawer({
  isOpen,
  onClose,
  notifications: initialNotifications,
  onMarkAllRead,
  onMarkRead,
}: NotificationDrawerProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'unread'>('all');
  const [items, setItems] = useState<NotificationItem[]>(initialNotifications);

  // Sync state if props change
  React.useEffect(() => {
    setItems(initialNotifications);
  }, [initialNotifications]);

  const handleMarkAllRead = () => {
    setItems(prev => prev.map(n => ({ ...n, read: true })));
    if (onMarkAllRead) onMarkAllRead();
  };

  const handleItemClick = (item: NotificationItem) => {
    setItems(prev => prev.map(n => n.id === item.id ? { ...n, read: true } : n));
    if (onMarkRead) onMarkRead(item.id);
    if (item.link) {
      router.push(item.link);
      onClose();
    }
  };

  const filteredItems = items.filter(item => {
    if (filter === 'unread') return !item.read;
    if (filter === 'critical') return item.type === 'critical';
    if (filter === 'warning') return item.type === 'warning';
    return true;
  });

  const unreadCount = items.filter(i => !i.read).length;

  const icons = {
    critical: <Flame className="w-4 h-4 text-red-600" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-600" />,
    info: <DoorOpen className="w-4 h-4 text-blue-600" />,
    success: <ShieldCheck className="w-4 h-4 text-emerald-600" />,
  };

  const bgStyles = {
    critical: 'bg-red-50 border-red-200',
    warning: 'bg-amber-50 border-amber-200',
    info: 'bg-blue-50 border-blue-200',
    success: 'bg-emerald-50 border-emerald-200',
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-blue-900" />
          <span>Trung Tâm Thông Báo</span>
          {unreadCount > 0 && (
            <Badge variant="critical" size="sm">
              {unreadCount} mới
            </Badge>
          )}
        </div>
      }
      description="Cảnh báo an ninh, cảm biến vi khí hậu & nhật ký thời gian thực"
      width="max-w-md"
    >
      <div className="space-y-4">
        {/* Controls */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'unread', label: 'Chưa đọc' },
              { id: 'critical', label: 'Khẩn cấp' },
              { id: 'warning', label: 'Cảnh báo' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  filter === tab.id
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-[11px] font-semibold text-blue-900 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Đã đọc hết</span>
            </button>
          )}
        </div>

        {/* List */}
        {filteredItems.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">Không có thông báo nào</p>
            <p className="text-xs text-slate-400 mt-0.5">Tất cả hệ thống đang hoạt động an toàn</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredItems.map(item => (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  item.read
                    ? 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                    : `${bgStyles[item.type]} shadow-2xs`
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md bg-white/80 border border-slate-100 flex-shrink-0">
                      {icons[item.type]}
                    </div>
                    <span className={`text-xs font-bold ${item.read ? 'text-slate-800' : 'text-slate-900'}`}>
                      {item.title}
                    </span>
                  </div>

                  {!item.read && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-1" />
                  )}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mb-2 pl-7">
                  {item.description}
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pl-7 font-mono">
                  <span className="font-semibold text-slate-500">{item.source}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {item.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Drawer>
  );
}
