import React from 'react';
import { Outlet } from 'react-router-dom';
import { DesktopHeader } from './DesktopHeader';
import { BottomNav } from './BottomNav';

export const AppShell: React.FC = () => {
  return (
    <div className="min-h-screen bg-surface-bg flex flex-col antialiased">
      <DesktopHeader />
      <main className="flex-1 w-full max-w-6xl mx-auto pb-20 md:pb-6">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};
