import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'cond' | 'neg' | 'fixed' | 'flag' | 'pin' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'muted';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'cond',
  size = 'md',
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center uppercase font-bold tracking-[0.07em] rounded-full';

  const variantStyles = {
    cond: 'bg-accent-wash text-accent border border-accent-line',
    neg: 'bg-accent-wash text-accent border border-accent-line',
    fixed: 'bg-accent-wash text-accent border border-accent-line',
    flag: 'bg-ink text-paper',
    pin: 'bg-accent text-paper',
    // Fallbacks to keep old code compiling if any
    primary: 'bg-brand-wash text-brand',
    secondary: 'bg-surface-alt text-ink-2 border border-line',
    success: 'bg-surface-alt text-ink-2 border border-line',
    warning: 'bg-accent-wash text-accent border border-accent-line',
    danger: 'bg-danger-wash text-danger border border-brand-line',
    muted: 'border border-line text-ink-3',
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-[10px] px-2 py-0.5', // spec says uppercase 10px tracking-[0.07em]
  };

  return (
    <span className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`} {...props}>
      {children}
    </span>
  );
};
