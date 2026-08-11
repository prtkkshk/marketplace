import React from 'react';
import { Outlet } from 'react-router-dom';
import { DesktopHeader } from './DesktopHeader';
import { BottomNav } from './BottomNav';
import { ThemeProvider } from '../../lib/theme';
import { useExitPrompt } from '../../lib/hooks/useExitPrompt';
import { ExitPromptSheet } from './ExitPromptSheet';

export const AppShell: React.FC = () => {
 const { showPrompt, exitFallback, confirmExit, cancelExit } = useExitPrompt();
 return (
 <ThemeProvider>
 <div className="min-h-screen bg-bg flex flex-col antialiased">
 <DesktopHeader />
 <main className="flex-1 w-full pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
 <Outlet />
 </main>
 <BottomNav />
 <ExitPromptSheet 
 isOpen={showPrompt}
 isFallback={exitFallback}
 onClose={cancelExit}
 onConfirm={confirmExit}
 />
 </div>
 </ThemeProvider>
 );
};
