import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtitle?: string;
  badge?: React.ReactNode;
  variant?: 'blue' | 'emerald' | 'amber' | 'indigo' | 'rose' | 'default';
  onClick?: () => void;
}

const colorStyles = {
  blue: {
    iconBg: 'bg-blue-50 text-blue-600',
    border: 'border-l-4 border-l-brand-600',
  },
  emerald: {
    iconBg: 'bg-emerald-50 text-emerald-600',
    border: 'border-l-4 border-l-emerald-600',
  },
  amber: {
    iconBg: 'bg-amber-50 text-amber-600',
    border: 'border-l-4 border-l-amber-500',
  },
  indigo: {
    iconBg: 'bg-indigo-50 text-indigo-600',
    border: 'border-l-4 border-l-indigo-600',
  },
  rose: {
    iconBg: 'bg-rose-50 text-rose-600',
    border: 'border-l-4 border-l-rose-600',
  },
  default: {
    iconBg: 'bg-navy-800/60 text-cyan-200',
    border: 'border-l-4 border-l-slate-400',
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  subtitle,
  badge,
  variant = 'blue',
  onClick,
}) => {
  const styles = colorStyles[variant] || colorStyles.default;

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-navy-900/40 backdrop-blur-md rounded-xl p-5 shadow-card border border-cyan-500/30/80 transition-all flex flex-col justify-between',
        styles.border,
        onClick && 'cursor-pointer hover:shadow-md hover:border-cyan-400/40'
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400/80">
            {title}
          </span>
          <div className="text-2xl font-bold text-cyan-50 mt-1 tracking-tight">{value}</div>
        </div>
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', styles.iconBg)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-cyan-400/80 pt-2 border-t border-slate-100">
        <span>{subtitle || 'Field Record Cache'}</span>
        {badge}
      </div>
    </div>
  );
};
