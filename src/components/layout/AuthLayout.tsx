import React from 'react';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
 children: React.ReactNode;
 title: string;
 subtitle?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
 return (
 <div className="min-h-screen bg-bg flex flex-col justify-center items-center px-4 py-8 relative">
  <div className="hidden md:block absolute top-6 left-6 md:top-8 md:left-8">
   <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
   <img src="/logo.svg" alt="KGP Bazaar Logo" className="w-8 h-8 rounded-xl" />
   <div className="flex items-baseline gap-1.5">
     <span className="font-display text-[24px] tracking-tight text-ink">KGP</span>
     <span className="font-display text-[24px] text-accent">Bazaar</span>
   </div>
   </Link>
  </div>
 
 <div className="w-full max-w-[400px]">
  {/* Mobile Wordmark Backup */}
  <div className="md:hidden flex justify-center mb-6">
   <Link to="/" className="flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
   <img src="/logo.svg" alt="KGP Bazaar Logo" className="w-10 h-10 rounded-xl" />
   <div className="flex items-baseline gap-1.5">
     <span className="font-display text-3xl tracking-tight text-ink">KGP</span>
     <span className="font-display text-3xl text-accent">Bazaar</span>
   </div>
   </Link>
  </div>

 <div className="bg-surface border border-line rounded-2xl p-6 md:p-8 shadow-hard">
 <div className="text-center mb-8">
 <h2 className="text-2xl md:text-3xl font-display font-extrabold tracking-tight text-ink">{title}</h2>
 {subtitle && (
 <p className="text-sm text-muted mt-2 leading-relaxed">{subtitle}</p>
 )}
 </div>
 
 {children}
 </div>
 </div>
 </div>
 );
};
