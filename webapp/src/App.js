import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import Dashboard from './components/Dashboard';
import Analytics from './components/Analytics';
import History from './components/History';
import AdminPanel from './components/AdminPanel';
import Navigation from './components/Navigation';
import { useStore } from './store/store';
import { initTelegramWebApp } from './services/telegram';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const { setUser, setTheme } = useStore();

  useEffect(() => {
    const init = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        if (token) {
          localStorage.setItem('token', token);
          useStore.getState().setToken(token);
        }

        const tgData = initTelegramWebApp();
        if (tgData) {
          setUser(tgData.user);
          setTheme(tgData.colorScheme || 'dark');
        }
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize Telegram Web App:', error);
        setIsInitialized(true);
      }
    };

    init();
  }, [setUser, setTheme]);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0c]">
        <div className="w-6 h-6 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-[#0a0a0c]">
          <Navigation />
          <main className="container mx-auto px-4 md:px-8 py-6 md:py-10 max-w-4xl">
            <Routes>
              <Route path="/" element={<AdminPanel />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 2000,
            style: {
              background: '#18181b',
              color: '#fff',
              border: '1px solid #27272a',
              borderRadius: '8px',
              padding: '12px 16px',
              fontSize: '14px',
            },
          }}
        />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
