import React from 'react';
import { AlertCircle} from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
 message?: string;
 onRetry?: () => void;
 className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
 message = "Couldn't load the feed",
 onRetry,
 className = ''}) => {
 return (
 <div className={`p-8 text-center bg-danger-wash border border-ink rounded-xl flex flex-col items-center justify-center ${className}`}>
 <AlertCircle className="w-8 h-8 text-danger mb-3" />
 <h3 className="font-display text-xl text-ink mb-1">Error</h3>
 <p className="text-sm text-danger font-medium max-w-xs mb-6">{message}</p>
 {onRetry && (
 <Button variant="secondary" size="md" onClick={onRetry} >
 Retry
 </Button>
 )}
 </div>
 );
};
