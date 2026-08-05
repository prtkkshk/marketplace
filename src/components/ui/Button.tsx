import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'whats' | 'brand-secondary';
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
    'inline-flex items-center justify-center font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:opacity-50 disabled:cursor-not-allowed motion-safe:active:scale-95 rounded-full min-h-[44px] px-4';

  const variantStyles = {
    primary: 'bg-brand text-white hover:bg-brand-hover shadow-1',
    whats: 'bg-whats text-white hover:bg-whats-hover shadow-1',
    ghost: 'bg-transparent text-ink hover:bg-surface-alt',
    danger: 'bg-danger text-white hover:bg-danger/90 shadow-1',
    secondary: 'bg-transparent border-2 border-ink text-ink hover:bg-ink hover:text-paper',
    outline: 'bg-transparent border-2 border-ink text-ink hover:bg-ink hover:text-paper',
    'brand-secondary': 'bg-brand-wash text-brand border border-brand-line hover:bg-brand/10',
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
