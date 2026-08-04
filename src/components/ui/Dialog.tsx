import React, { useEffect } from 'react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm transition-opacity">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      
      <div
        className="relative w-full max-w-lg bg-surface border border-line rounded-xl p-6 shadow-3 z-10 max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Dialog'}
      >
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-line">
          {title ? (
            <h2 className="text-lg font-bold text-ink">{title}</h2>
          ) : <div />}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-3 hover:text-ink hover:bg-surface-alt transition-colors ml-auto"
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
