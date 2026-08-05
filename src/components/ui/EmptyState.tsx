import React from 'react';
import { PackageOpen } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = <PackageOpen className="w-10 h-10 text-ink-3 stroke-[1.5]" />,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
}) => {
  return (
    <div className={`bg-surface rounded-2xl border border-line shadow-sm p-10 flex flex-col items-center text-center flex-grow justify-center ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-brand-wash flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {description && <p className="text-sm text-ink-2 mt-1.5 max-w-[220px]">{description}</p>}
      
      <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-sm">
        {secondaryActionLabel && onSecondaryAction && (
          <Button variant="ghost" size="md" onClick={onSecondaryAction} className="w-full sm:w-auto">
            {secondaryActionLabel}
          </Button>
        )}
        {actionLabel && onAction && (
          <Button variant="primary" size="md" onClick={onAction} className="brand-gradient-btn w-full sm:w-auto text-white on-brand font-semibold border-0 motion-safe:hover:-translate-y-0.5 shadow-none">
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
};
