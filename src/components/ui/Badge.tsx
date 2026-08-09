import { clsx } from 'clsx';


type BadgeProps = {
 children: React.ReactNode;
 variant?: 'default' | 'success' | 'danger';
 className?: string;
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
 const variants = {
 default: 'border-line-strong bg-surface text-ink',
 success: 'border-success bg-success-wash text-success',
 danger: 'border-danger bg-danger-wash text-danger',
 };

 return (
 <span className={clsx('inline-flex items-center px-1.5 py-0.5 rounded-sm border hairline text-badge tracking-[0.05em] uppercase font-bold', variants[variant], className)}>
 {children}
 </span>
 );
}
