'use client';
import React from 'react';

export interface SkeletonProps {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'text';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height,
}: SkeletonProps) {
  const variantStyles = {
    rectangular: 'rounded-lg',
    circular: 'rounded-full',
    text: 'rounded-md h-4',
  }[variant];

  return (
    <div
      className={`bg-slate-200/80 animate-pulse ${variantStyles} ${className}`}
      style={{
        width: width !== undefined ? width : undefined,
        height: height !== undefined ? height : undefined,
      }}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="admin-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton variant="text" className="w-24 h-4" />
        <Skeleton variant="circular" className="w-8 h-8" />
      </div>
      <Skeleton variant="text" className="w-32 h-8" />
      <div className="flex items-center justify-between pt-2">
        <Skeleton variant="text" className="w-20 h-3" />
        <Skeleton variant="text" className="w-16 h-4 rounded-full" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="admin-card overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <Skeleton variant="text" className="w-36 h-4" />
        <Skeleton variant="text" className="w-20 h-4" />
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 py-2 border-b border-slate-100 last:border-0">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} variant="text" className="flex-1 h-4" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
