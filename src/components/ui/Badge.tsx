import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'muted';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center font-medium rounded-md tracking-tight';

  const variantStyles = {
    primary: 'bg-brand-wash text-brand-primary',
    secondary: 'bg-sky-100 text-sky-800',
    success: 'bg-emerald-50 text-status-success border border-emerald-200',
    warning: 'bg-amber-50 text-status-warning border border-amber-200',
    danger: 'bg-rose-50 text-status-danger border border-rose-200',
    muted: 'bg-slate-100 text-content-muted',
  };

  const sizeStyles = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-0.5',
  };

  return (
    <span className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`} {...props}>
      {children}
    </span>
  );
};
