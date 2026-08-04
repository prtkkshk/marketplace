import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="bg-ink text-paper text-xs font-semibold px-4 py-2 mx-auto my-2 max-w-sm rounded-full text-center flex items-center justify-center gap-2 sticky top-2 z-50 shadow-1 border border-ink-2">
      <WifiOff className="w-4 h-4 shrink-0 text-paper" />
      <span>You're offline. Viewing cached app shell.</span>
    </div>
  );
};
