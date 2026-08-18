'use client';
import React from 'react';
import { Badge, BadgeVariant } from './Badge';

export interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  change?: {
    value: string;
    trend: 'up' | 'down' | 'neutral';
    label?: string;
  };
  tag?: string;
  tagVariant?: BadgeVariant;
  icon: React.ReactNode;
  iconBg?: string;
  highlight?: boolean;
  className?: string;
  onClick?: () => void;
}

export function MetricCard({
  label,
  value,
  subValue,
  change,
  tag,
  tagVariant = 'neutral',
  icon,
  iconBg = 'bg-slate-100 text-slate-700',
  highlight = false,
  className = '',
  onClick,
}: MetricCardProps) {
  return (
    <div
      onClick={onClick}
      className={`admin-card p-5 flex flex-col justify-between ${
        highlight ? 'border-red-300 bg-red-50/20 shadow-md ring-1 ring-red-200' : ''
      } ${onClick ? 'cursor-pointer hover:border-slate-300' : ''} ${className}`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 tracking-tight">{label}</span>
        <div className={`p-2 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
      </div>

      <div>
        <div className="flex items-baseline gap-2 mb-2">
          <div className="text-2xl font-bold text-slate-900 tracking-tight font-mono" suppressHydrationWarning>{value}</div>
          {change && (
            <span
              suppressHydrationWarning
              className={`text-[11px] font-bold flex items-center gap-0.5 ${
                change.trend === 'up'
                  ? 'text-emerald-700'
                  : change.trend === 'down'
                  ? 'text-blue-700'
                  : 'text-slate-500'
              }`}
            >
              {change.trend === 'up' ? '↑' : change.trend === 'down' ? '↓' : '•'} {change.value}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
          <span className="text-slate-400 truncate max-w-[150px]" suppressHydrationWarning>{subValue || (change?.label ?? '')}</span>
          {tag && (
            <Badge variant={tagVariant} size="sm">
              {tag}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
