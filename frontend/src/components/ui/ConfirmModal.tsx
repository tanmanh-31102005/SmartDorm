'use client';
import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle, ShieldAlert, Info } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  loading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy bỏ',
  variant = 'danger',
  loading = false,
}: ConfirmModalProps) {
  const icon = {
    danger: <ShieldAlert className="w-6 h-6 text-red-600" />,
    warning: <AlertTriangle className="w-6 h-6 text-amber-600" />,
    primary: <Info className="w-6 h-6 text-blue-600" />,
  }[variant];

  const iconBg = {
    danger: 'bg-red-50 border-red-100',
    warning: 'bg-amber-50 border-amber-100',
    primary: 'bg-blue-50 border-blue-100',
  }[variant];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" maxWidth="sm" showCloseButton={false}>
      <div className="text-center pt-2">
        <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center border ${iconBg} mb-4`}>
          {icon}
        </div>
        <h3 className="text-base font-bold text-slate-900 mb-1.5">{title}</h3>
        <div className="text-xs text-slate-500 leading-relaxed mb-6">{message}</div>

        <div className="flex items-center justify-center gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading} className="w-1/2">
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={loading}
            className="w-1/2"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
