import React, { useEffect } from 'react';
import { X } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-end md:items-stretch md:justify-end justify-center p-0 md:p-4 bg-ink/40 backdrop-blur-sm transition-opacity">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      
      <div
        className="relative w-full max-w-lg bg-surface border border-line rounded-t-[26px] md:rounded-xl p-6 shadow-3 z-10 max-h-[90vh] md:max-h-full md:h-full overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Sheet dialog'}
      >
        <div className="flex flex-col mb-4 pb-3 border-b border-line">
          <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 md:hidden" />
          <div className="flex items-center justify-between">
            {title ? (
              <h2 className="text-lg font-bold text-ink">{title}</h2>
            ) : (
              <div />
            )}
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-ink-3 hover:text-ink hover:bg-surface-alt transition-colors font-medium text-sm ml-auto"
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
