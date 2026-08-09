import os

dir_path = r'C:\Users\prtkk\Desktop\kgp_marketplace\codebase\src\components\ui'

files = {}

files['Sheet.tsx'] = """import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

export interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const Sheet: React.FC<SheetProps> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 transition-opacity duration-160">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      
      <div
        className="relative w-full max-w-lg bg-surface border-[1.5px] border-ink rounded-t-lg p-6 shadow-hard z-10 max-h-[90vh] overflow-y-auto transform transition-transform duration-220 ease-[cubic-bezier(0.2,0.9,0.3,1)] translate-y-0"
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Sheet dialog'}
      >
        <div className="flex flex-col mb-4 pb-3 border-b-[1.5px] border-line">
          <div className="w-12 h-1.5 bg-surface-2 rounded-full mx-auto mb-4 md:hidden" />
          <div className="flex items-center justify-between">
            {title ? (
              <h2 className="text-title font-bold text-ink">{title}</h2>
            ) : (
              <div />
            )}
            <button
              onClick={onClose}
              className="press flex items-center gap-1.5 px-3 py-1.5 rounded-sm border-[1.5px] border-transparent text-ink hover:bg-surface-2 transition-colors font-bold text-xs ml-auto"
              aria-label="Close sheet"
            >
              Close <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
};
"""

files['Dialog.tsx'] = """import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { SheetProps } from './Sheet';

export type DialogProps = SheetProps;

export const Dialog: React.FC<DialogProps> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 transition-opacity duration-160">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      
      <div
        className="relative w-full max-w-lg bg-surface border-[1.5px] border-ink rounded-lg p-6 shadow-hard z-10 max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Dialog'}
      >
        <div className="flex items-center justify-between mb-4 pb-2 border-b-[1.5px] border-line">
          {title ? (
            <h2 className="text-title font-bold text-ink">{title}</h2>
          ) : <div />}
          <button
            onClick={onClose}
            className="press p-1.5 rounded-sm border-[1.5px] border-transparent text-subtle hover:text-ink hover:bg-surface-2 transition-colors ml-auto"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};
"""

files['Toast.tsx'] = """import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { clsx } from 'clsx';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:max-w-sm z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={clsx(
              'pointer-events-auto p-3.5 rounded-[6px] border-[1.5px] border-ink shadow-hard flex items-center justify-between gap-3 text-sm font-medium transition-all transform duration-[180ms]',
              'bg-surface text-ink hover:pause focus-within:pause'
            )}
          >
            <div className="flex items-center gap-2">
              {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-success shrink-0" />}
              {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-danger shrink-0" />}
              {toast.type === 'info' && <Info className="w-4 h-4 text-accent shrink-0" />}
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="press p-1 rounded-sm text-subtle hover:text-ink transition-colors border-[1.5px] border-transparent focus-visible:outline-ink"
              aria-label="Dismiss toast"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
"""

for filename, content in files.items():
    with open(os.path.join(dir_path, filename), 'w', encoding='utf-8') as f:
        f.write(content)

print("More primitives generated successfully.")
