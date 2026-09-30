import React from 'react';
import { cn } from '../../utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  bordered?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  bordered = true,
  ...props
}) => {
  return (
    <div
      className={cn(
        'bg-navy-900/40 backdrop-blur-md rounded-xl shadow-card transition-all',
        bordered && 'border border-cyan-500/30/80',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={cn('px-6 py-4 border-b border-slate-100 flex items-center justify-between', className)}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <h3
      className={cn('text-base font-semibold text-cyan-50 tracking-tight', className)}
      {...props}
    >
      {children}
    </h3>
  );
};

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <p className={cn('text-xs text-cyan-400/80 mt-0.5', className)} {...props}>
      {children}
    </p>
  );
};

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div className={cn('p-6', className)} {...props}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={cn('px-6 py-3 bg-navy-950/60/70 border-t border-slate-100 rounded-b-xl flex items-center', className)}
      {...props}
    >
      {children}
    </div>
  );
};
