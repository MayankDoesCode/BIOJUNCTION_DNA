import React, { useEffect, useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { ToastProvider } from './context/ToastContext';
import { initializeDatabase } from './database/initDb';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { ErrorState } from './components/common/ErrorState';

import { AuthProvider } from './context/AuthContext';

export const App: React.FC = () => {
  const [dbReady, setDbReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        await initializeDatabase();
        if (mounted) {
          setDbReady(true);
        }
      } catch (err) {
        console.error('Database initialization error:', err);
        if (mounted) {
          setInitError(err instanceof Error ? err.message : 'Failed to initialize local IndexedDB');
        }
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, []);

  if (initError) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <ErrorState
          title="Terminal Storage Offline"
          message={`Unable to initialize local encrypted database: ${initError}`}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  if (!dbReady) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <LoadingSpinner
          size="lg"
          label="Initializing Field Drug Testing Secure Local Store..."
          className="text-white"
        />
        <span className="text-xs text-slate-400 mt-2 font-mono">
          Verifying IndexedDB schema & demo forensic datasets
        </span>
      </div>
    );
  }

  return (
    <ToastProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;
