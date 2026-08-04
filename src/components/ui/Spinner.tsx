import React from 'react';
import { Loader2 } from 'lucide-react';

export const Spinner: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 24 }) => {
  return <Loader2 className={`animate-spin text-brand ${className}`} size={size} />;
};
