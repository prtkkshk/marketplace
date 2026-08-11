import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
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

 return createPortal(
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 transition-opacity duration-160">
 <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
 
 <div
 className="relative w-full max-w-lg bg-surface border-[1.5px] border-ink rounded-lg p-6 shadow-hard z-10 max-h-[90dvh] overflow-y-auto"
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
 </div>,
 document.body
 );
};
