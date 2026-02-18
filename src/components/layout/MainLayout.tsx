import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { FloatingMessageBubble } from './FloatingMessageBubble';
import { useSettingsSync } from '@/hooks/useSettingsSync';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  useSettingsSync();

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Top Navigation */}
      <div className="lg:hidden">
        <MobileNav />
      </div>

      {/* Main Content */}
      <main className="lg:ml-16">
        <div className="min-h-screen p-4 pt-20 pb-4 lg:p-8 lg:pt-8 lg:pb-8">
          {children}
        </div>
      </main>

      {/* Floating Message Bubble */}
      <FloatingMessageBubble />
    </div>
  );
}
