'use client';
import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'py-1.5 px-3 text-xs rounded-md gap-1.5',
      md: 'py-2 px-4 text-xs font-semibold rounded-lg gap-2',
      lg: 'py-2.5 px-5 text-sm font-semibold rounded-lg gap-2.5',
    }[size];

    const variantClasses = {
      primary: 'bg-blue-900 hover:bg-blue-800 text-white shadow-xs border border-transparent disabled:bg-blue-900/60',
      secondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-2xs disabled:bg-slate-50 disabled:text-slate-400',
      danger: 'bg-red-600 hover:bg-red-700 text-white shadow-xs border border-transparent disabled:bg-red-600/60',
      ghost: 'bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-transparent',
      outline: 'bg-transparent hover:bg-blue-50 text-blue-700 border border-blue-200 disabled:border-slate-200 disabled:text-slate-400',
    }[variant];

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center font-medium transition-all duration-150 cursor-pointer disabled:cursor-not-allowed select-none ${sizeClasses} ${variantClasses} ${className}`}
        {...props}
      >
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />}
        {!loading && icon && iconPosition === 'left' && <span className="flex-shrink-0">{icon}</span>}
        <span>{children}</span>
        {!loading && icon && iconPosition === 'right' && <span className="flex-shrink-0">{icon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
