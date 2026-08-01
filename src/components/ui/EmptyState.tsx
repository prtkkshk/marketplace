import React from 'react';
import { PackageOpen } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = <PackageOpen className="w-10 h-10 text-content-muted stroke-[1.5]" />,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`p-8 text-center bg-surface-card border border-surface-border rounded-2xl flex flex-col items-center justify-center ${className}`}>
      <div className="mb-3">{icon}</div>
      <h3 className="text-base font-semibold text-content-primary mb-1">{title}</h3>
      {description && <p className="text-xs text-content-muted max-w-xs mb-4">{description}</p>}
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
