import React, { ButtonHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'navy';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  leftIcon,
  rightIcon,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed select-none';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 h-8',
    md: 'text-sm px-4 py-2 gap-2 h-10',
    lg: 'text-base px-5 py-2.5 gap-2.5 h-12',
  };

  const variantStyles = {
    primary: 'bg-gradient-to-r from-luxury-maroon to-luxury-crimson hover:opacity-90 text-luxury-cream focus:ring-luxury-crimson shadow-md border border-transparent font-bold',
    navy: 'bg-luxury-maroon hover:bg-luxury-maroon/90 text-luxury-cream focus:ring-luxury-maroon shadow-md border border-transparent font-bold',
    secondary: 'bg-white hover:bg-luxury-gold/20 text-luxury-maroon focus:ring-luxury-gold border border-[#d5bf86]/50 font-semibold shadow-xs',
    outline: 'bg-white/80 backdrop-blur-md hover:bg-white text-luxury-maroon border border-[#d5bf86]/60 focus:ring-luxury-gold shadow-xs font-semibold',
    danger: 'bg-rose-700 hover:bg-rose-800 text-white focus:ring-rose-500 shadow-sm border border-transparent font-semibold',
    ghost: 'bg-transparent hover:bg-luxury-gold/15 text-luxury-maroon focus:ring-luxury-gold border border-transparent font-semibold',
  };

  return (
    <button
      className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};
