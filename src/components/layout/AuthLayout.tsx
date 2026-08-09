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
 <Link to="/" className="font-display font-bold text-2xl text-ink hover:opacity-80 transition-opacity">
 KGP <span className="text-accent">Bazaar</span>
 </Link>
 </div>
 
 <div className="w-full max-w-[400px]">
 {/* Mobile Wordmark Backup */}
 <div className="md:hidden text-center mb-6">
 <Link to="/" className="font-display font-bold text-3xl text-ink hover:opacity-80 transition-opacity">
 KGP <span className="text-accent">Bazaar</span>
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
