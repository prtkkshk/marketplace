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
    <div className={`p-8 text-center flex flex-col items-center justify-center flex-1 ${className}`}>
      <div className="mb-3">{icon}</div>
      <h3 className="font-display text-xl text-ink mb-1">{title}</h3>
      {description && <p className="text-sm text-ink-3 max-w-xs mb-6">{description}</p>}
      
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-sm">
        {actionLabel && onAction && (
          <Button variant="ghost" size="md" onClick={onAction} className="w-full sm:w-auto">
            {actionLabel}
          </Button>
        )}
        {secondaryActionLabel && onSecondaryAction && (
          <Button variant="primary" size="md" onClick={onSecondaryAction} className="w-full sm:w-auto">
            {secondaryActionLabel}
          </Button>
        )}
      </div>
    </div>
  );
};
