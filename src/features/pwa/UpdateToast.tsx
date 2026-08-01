import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const UpdateToast: React.FC = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
    },
    onRegisterError(error) {
      console.error('SW registration error', error);
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="fixed top-4 right-4 left-4 md:left-auto md:max-w-sm z-50 p-3.5 bg-slate-900 text-white rounded-2xl shadow-xl flex items-center justify-between gap-3 text-xs border border-slate-700 animate-in slide-in-from-top-3">
      <div className="flex items-center gap-2">
        <RefreshCw className="w-4 h-4 text-brand-light animate-spin" />
        <span>New version of KGP Bazaar is available!</span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <Button
          variant="primary"
          size="sm"
          onClick={() => updateServiceWorker(true)}
        >
          Reload
        </Button>
        <button
          onClick={() => setNeedRefresh(false)}
          className="p-1 text-slate-400 hover:text-white rounded-md"
          aria-label="Dismiss update"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
