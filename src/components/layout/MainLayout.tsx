import { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { sidebarOpen } = useApp();
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main 
        className={cn(
          "min-h-screen transition-all duration-300",
          isMobile ? "ml-0" : (sidebarOpen ? "ml-72" : "ml-14")
        )}
      >
        {children}
      </main>
    </div>
  );
}
