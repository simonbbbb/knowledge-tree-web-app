import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AIChatPanel } from './AIChatPanel';
import { useUIStore } from '@/lib/store';
import { cn } from '@/lib/utils';

export function AppLayout() {
  const { sidebarOpen, chatPanelOpen } = useUIStore();

  return (
    <div className="flex h-screen overflow-hidden">
      {sidebarOpen && <Sidebar />}

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />

        <main className={cn('flex-1 overflow-y-auto bg-background p-6')}>
          <Outlet />
        </main>
      </div>

      {chatPanelOpen && <AIChatPanel />}
    </div>
  );
}
