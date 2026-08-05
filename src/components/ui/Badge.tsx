import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'condition' | 'negotiable' | 'sold' | 'primary' | 'danger' | 'flag' | 'pin' | 'secondary' | 'cond' | 'neg' | 'fixed' | 'warning' | 'success' | 'muted';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'condition',
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium';

  const variantStyles = {
    condition: 'bg-surface-alt text-ink-2 border border-line',
    negotiable: 'bg-accent-wash text-accent border border-accent-line',
    sold: 'bg-line/60 text-ink-3 border border-line uppercase tracking-wide',
    primary: 'bg-brand-wash text-brand border border-brand-line',
    danger: 'bg-danger-wash text-danger border border-danger',
    flag: 'bg-ink text-paper',
    pin: 'bg-accent text-paper',
    secondary: 'bg-surface-alt text-ink-2 border border-line',
    cond: 'bg-surface-alt text-ink-2 border border-line',
    neg: 'bg-accent-wash text-accent border border-accent-line',
    fixed: 'bg-surface-alt text-ink-2 border border-line',
    warning: 'bg-amber-100 text-amber-700 border border-amber-200',
    success: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    muted: 'bg-slate-100 text-slate-500 border border-slate-200',
  };

  return (
    <span className={`${baseStyles} ${variantStyles[variant] || variantStyles.condition} ${className}`} {...props}>
      {children}
    </span>
  );
};
