import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { syncRepository } from '../database/repositories/syncRepository';

export const MainLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

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
    <div className="min-h-screen bg-navy-800/60 flex flex-col lg:flex-row antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        pendingSyncCount={pendingSyncCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header onOpenSidebar={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};
