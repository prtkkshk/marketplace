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
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity">
      {/* Backdrop tap to close */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Sheet Content Container */}
      <div
        className="relative w-full max-w-lg bg-surface-card border border-surface-border rounded-t-3xl md:rounded-2xl p-6 shadow-xl z-10 max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Sheet dialog'}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-surface-border">
          {title ? (
            <h2 className="text-lg font-bold text-content-primary">{title}</h2>
          ) : (
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto md:hidden" />
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-content-muted hover:text-content-primary hover:bg-slate-100 transition-colors ml-auto"
            aria-label="Close sheet"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
};
