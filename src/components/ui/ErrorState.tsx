import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = 'Something went wrong while loading data. Please try again.',
  onRetry,
  className = '',
}) => {
  return (
    <div className={`p-6 text-center bg-rose-50/50 border border-rose-200 rounded-2xl flex flex-col items-center justify-center ${className}`}>
      <AlertCircle className="w-8 h-8 text-status-danger mb-2" />
      <p className="text-xs text-status-danger font-medium max-w-xs mb-4">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
          Retry
        </Button>
      )}
    </div>
  );
};
