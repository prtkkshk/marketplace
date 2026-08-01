import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-light disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] min-h-[44px] px-4';

  const variantStyles = {
    primary: 'bg-brand-primary text-white hover:bg-sky-700 shadow-sm',
    secondary: 'bg-brand-wash text-brand-primary hover:bg-sky-100',
    outline: 'border border-surface-border bg-white text-content-primary hover:bg-slate-50',
    danger: 'bg-status-danger text-white hover:bg-rose-600 shadow-sm',
    ghost: 'text-content-muted hover:bg-slate-100 hover:text-content-primary',
  };

  const sizeStyles = {
    sm: 'text-xs min-h-[36px] px-3 py-1.5',
    md: 'text-sm min-h-[44px] px-4 py-2.5',
    lg: 'text-base min-h-[48px] px-6 py-3',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
      ) : leftIcon ? (
        <span className="mr-2 inline-flex items-center">{leftIcon}</span>
      ) : null}
      <span>{children}</span>
      {!isLoading && rightIcon && (
        <span className="ml-2 inline-flex items-center">{rightIcon}</span>
      )}
    </button>
  );
};
