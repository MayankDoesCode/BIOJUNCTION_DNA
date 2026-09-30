import React from 'react';
import { LucideIcon, FolderSearch } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../utils/cn';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = FolderSearch,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-10 text-center bg-navy-900/40 backdrop-blur-md rounded-xl border border-dashed border-cyan-400/40 my-4',
        className
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-navy-800/60 flex items-center justify-center text-cyan-400/80 mb-4 ring-8 ring-slate-50">
        <Icon className="w-7 h-7 text-cyan-300" />
      </div>
      <h3 className="text-base font-semibold text-cyan-100">{title}</h3>
      <p className="text-sm text-cyan-400/80 max-w-sm mt-1 mb-5">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
