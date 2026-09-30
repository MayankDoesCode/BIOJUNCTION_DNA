import React from 'react';
import { cn } from '../../utils/cn';

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'neutral'
  | 'outline';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  className?: string;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-luxury-gold/20 text-luxury-maroon border-luxury-gold/50 font-bold',
  primary: 'bg-luxury-crimson/15 text-luxury-crimson border-luxury-crimson/30 font-bold',
  success: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold',
  warning: 'bg-amber-50 text-amber-800 border-amber-300 font-bold',
  danger: 'bg-rose-50 text-rose-800 border-rose-300 font-bold',
  neutral: 'bg-[#f1f0cc] text-luxury-taupe border-[#d5bf86]/40 font-semibold',
  outline: 'bg-transparent text-luxury-maroon border-[#d5bf86]/60 font-semibold',
};

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-slate-500',
  primary: 'bg-blue-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
  neutral: 'bg-slate-400',
  outline: 'bg-slate-400',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className,
  dot = false,
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium border rounded-full',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
        variantStyles[variant],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full mr-1.5 shrink-0',
            dotColors[variant]
          )}
        />
      )}
      {children}
    </span>
  );
};
