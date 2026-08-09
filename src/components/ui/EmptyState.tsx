import { ReactNode } from 'react';
import { clsx } from 'clsx';

type EmptyStateProps = {
 icon: ReactNode;
 title: string;
 description: string;
 action?: ReactNode;
 className?: string;
};

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
 return (
 <div className={clsx('flex flex-col items-center justify-center text-center p-8 bg-surface border-[1.5px] border-line-strong rounded-lg shadow-card', className)}>
 <div className="w-[34px] h-[34px] rounded bg-accent-wash border-[1.5px] border-ink flex items-center justify-center text-accent mb-4">
 {icon}
 </div>
 <h3 className="text-base font-bold text-ink mb-1.5">{title}</h3>
 <p className="text-xs text-subtle max-w-[280px] mb-6">{description}</p>
 {action}
 </div>
 );
}
