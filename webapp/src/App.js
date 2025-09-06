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
        // Получаем токен из URL
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        if (token) {
          localStorage.setItem('token', token);
          useStore.getState().setToken(token);
        }
        
        const tgData = initTelegramWebApp();
        if (tgData) {
          setUser(tgData.user);
          setTheme(tgData.colorScheme || 'light');
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
      <div className="flex items-center justify-center min-h-screen bg-dark-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-orange"></div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-dark-bg font-porsche">
          <Navigation />
          <main className="container mx-auto px-4 py-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/history" element={<History />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1a1a1a',
              color: '#ffffff',
              border: '1px solid #2a2a2a',
            },
          }}
        />
      </Router>
    </QueryClientProvider>
  );
}

export default App;