import React from 'react';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen bg-paper flex lg:flex-row">
      {/* Left panel (lg only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-wash to-accent-wash p-12 flex-col justify-between border-r border-line">
        <div>
           <Link to="/" className="font-display font-bold text-4xl text-ink mb-4 block hover:opacity-80 transition-opacity">
             KGP <span className="text-brand italic">Bazaar</span>
           </Link>
           <h1 className="font-display text-5xl text-ink leading-tight mt-12">
             Your campus<br />second-hand<br />marketplace
           </h1>
        </div>
      </div>
      
      {/* Right panel (form) */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 py-8">
         <div className="w-full max-w-[420px]">
           {/* Wordmark (mobile) */}
           <div className="lg:hidden text-center mb-8">
             <Link to="/" className="font-display font-bold text-3xl text-ink hover:opacity-80 transition-opacity">
               KGP <span className="text-brand italic">Bazaar</span>
             </Link>
           </div>
           
           <div className="bg-surface border border-line rounded-2xl p-6 md:p-8 shadow-sm">
             <div className="text-center mb-6">
               <h2 className="text-3xl font-display italic font-bold text-ink">{title}</h2>
               {subtitle && (
                 <p className="text-sm text-ink-3 mt-2">{subtitle}</p>
               )}
             </div>
             
             {children}
           </div>
         </div>
      </div>
    </div>
  );
};
