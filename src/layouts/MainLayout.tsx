import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { PanelLeftOpen } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { syncRepository } from '../database/repositories/syncRepository';

export const MainLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarHidden, setIsSidebarHidden] = useState<boolean>(() => {
    return localStorage.getItem('biojunction_taskbar_hidden') === 'true';
  });
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  const toggleSidebarHidden = () => {
    setIsSidebarHidden((prev) => {
      const next = !prev;
      localStorage.setItem('biojunction_taskbar_hidden', String(next));
      return next;
    });
  };

  // Keyboard shortcut Ctrl+B or Cmd+B to toggle taskbar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebarHidden();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const updateSyncBadge = async () => {
      try {
        const count = await syncRepository.countPending();
        setPendingSyncCount(count);
      } catch (err) {
        console.error('Failed to get pending sync count', err);
      }
    };

    updateSyncBadge();
    const interval = setInterval(updateSyncBadge, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-luxury-cream text-luxury-maroon flex flex-col lg:flex-row antialiased relative">
      {/* Floating reveal button when sidebar taskbar is hidden on desktop */}
      {isSidebarHidden && (
        <button
          type="button"
          onClick={toggleSidebarHidden}
          className="fixed left-3 top-24 z-40 hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl bg-luxury-maroon text-white font-bold text-xs shadow-2xl border border-luxury-gold/50 hover:bg-luxury-crimson transition-all animate-fade-in group"
          title="Show Navigation Taskbar (Ctrl+B)"
        >
          <PanelLeftOpen className="w-4 h-4 group-hover:scale-110 transition-transform text-luxury-gold" />
          <span>Show Taskbar</span>
        </button>
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={isSidebarHidden}
        onToggleCollapse={toggleSidebarHidden}
        pendingSyncCount={pendingSyncCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen transition-all duration-300">
        <Header
          onOpenSidebar={() => setSidebarOpen(true)}
          isSidebarHidden={isSidebarHidden}
          onToggleSidebar={() => {
            // If on mobile/small screen, toggle mobile drawer
            if (window.innerWidth < 1024) {
              setSidebarOpen((prev) => !prev);
            } else {
              toggleSidebarHidden();
            }
          }}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};
