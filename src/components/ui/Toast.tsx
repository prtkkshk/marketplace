import React, { createContext, useContext, useState, useCallback } from 'react';
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
