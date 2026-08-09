import React from 'react';
import { Outlet } from 'react-router-dom';
import { DesktopHeader } from './DesktopHeader';
import { BottomNav } from './BottomNav';
import { ThemeProvider } from '../../lib/theme';

export const AppShell: React.FC = () => {
 return (
 <ThemeProvider>
 <div className="min-h-screen bg-bg flex flex-col antialiased">
 <DesktopHeader />
 <main className="flex-1 w-full pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
 <Outlet />
 </main>
 <BottomNav />
 </div>
 </ThemeProvider>
 );
};
