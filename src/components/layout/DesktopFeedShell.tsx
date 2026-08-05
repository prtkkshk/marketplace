import React from 'react';
import { PageContainer } from './PageContainer';

export const DesktopFeedShell: React.FC<{
  sidebarContent?: React.ReactNode;
  children: React.ReactNode;
}> = ({ sidebarContent, children }) => {
  return (
    <PageContainer className="py-0 flex flex-col h-full max-w-[1280px] md:px-5 lg:px-6">
      <div className="flex flex-col lg:flex-row flex-grow items-start w-full">
        {/* Desktop Left Rail */}
        {sidebarContent && (
          <aside className="hidden lg:block w-[250px] shrink-0 border-r border-line h-[calc(100vh-64px)] sticky top-16 overflow-y-auto bg-paper py-6 pr-6">
            {sidebarContent}
          </aside>
        )}
        
        {/* Main Grid Content */}
        <main className={`flex-grow min-w-0 w-full flex flex-col h-full py-4 lg:py-6 ${sidebarContent ? 'lg:pl-6' : ''}`}>
          {children}
        </main>
      </div>
    </PageContainer>
  );
};
