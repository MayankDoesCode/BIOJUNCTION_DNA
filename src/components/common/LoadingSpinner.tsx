import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  label = 'Loading secure field records...',
  className,
}) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-7 h-7',
    lg: 'w-10 h-10',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-cyan-400/80', className)}>
      <Loader2 className={cn('animate-spin text-brand-600 mb-3', sizeMap[size])} />
      {label && <p className="text-sm font-medium text-cyan-300">{label}</p>}
    </div>
  );
};
