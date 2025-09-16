import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Statistics from './components/Statistics';
import History from './components/History';
import Profile from './components/Profile';
import { getTelegramWebApp } from './utils/telegram';
import { fetchPartnerData } from './services/api';
import './styles/index.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [partnerData, setPartnerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState('App started');

  useEffect(() => {
    const initApp = async () => {
      try {
        console.log('Starting Web App initialization...');
        setDebugInfo('Initializing...');

        // Используем тестовые данные всегда для отладки
        const testData = {
          partnerId: 'TEST123',
          partnerLink: 'https://example.com/test',
          registrationDate: new Date().toISOString(),
          statistics: {
            todayClicks: 5,
            totalClicks: 42,
            whatsappClicks: 25,
            telegramClicks: 17,
            conversionRate: 12.5,
            earnings: 1250
          }
        };

        setPartnerData(testData);
        setDebugInfo('Test data loaded');

        // Пробуем инициализировать Telegram WebApp если доступен
        try {
          const tg = getTelegramWebApp();
          if (tg && tg.ready) {
            tg.ready();
            tg.expand && tg.expand();
            setDebugInfo(`Telegram OK, platform: ${tg.platform || 'unknown'}`);
          }
        } catch (tgError) {
          console.warn('Telegram WebApp not available:', tgError);
          setDebugInfo('Running without Telegram');
        }

      } catch (err) {
        console.error('Ошибка инициализации:', err);
        setError(err.message || 'Неизвестная ошибка');
        setDebugInfo(`Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    // Задержка для предотвращения краша при быстрой загрузке
    setTimeout(initApp, 100);
  }, []);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="loader">
          <div className="spinner"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="error-message">
          {error}
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard data={partnerData} />;
      case 'statistics':
        return <Statistics data={partnerData} />;
      case 'history':
        return <History data={partnerData} />;
      case 'profile':
        return <Profile data={partnerData} />;
      default:
        return <Dashboard data={partnerData} />;
    }
  };

  // Always show debug info for troubleshooting
  if (!loading && !error && !partnerData) {
    return (
      <div style={{ padding: '20px', background: '#000', color: '#fff', minHeight: '100vh' }}>
        <h2 style={{ color: '#FF8C00', marginBottom: '20px' }}>Debug Mode</h2>
        <div style={{ background: '#111', padding: '15px', borderRadius: '8px', marginBottom: '10px' }}>
          <strong>Loading:</strong> {String(loading)}<br/>
          <strong>Error:</strong> {error || 'none'}<br/>
          <strong>Data:</strong> {partnerData ? 'loaded' : 'null'}<br/>
          <strong>Debug Info:</strong> {debugInfo}<br/>
          <strong>Window.Telegram:</strong> {typeof window.Telegram !== 'undefined' ? 'exists' : 'missing'}<br/>
          <strong>WebApp:</strong> {window.Telegram?.WebApp ? 'exists' : 'missing'}
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 20px',
            background: '#FF8C00',
            color: '#000',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 'bold'
          }}
        >
          Reload
        </button>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Header with SHIBA CARS branding */}
      <div className="app-header">
        <div className="header-content">
          <div className="logo-section">
            <div>
              <div className="logo-text">
                <span className="shiba">SHIBA</span>
                <span className="cars">CARS</span>
              </div>
              <div className="header-subtitle">Партнёрская программа</div>
            </div>
          </div>
          <div className="premium-badge">
            ⭐ Premium
          </div>
        </div>
      </div>

      <div className="container">
        {/* Always show debug info for now */}
        <div style={{
          padding: '10px',
          background: 'rgba(255,140,0,0.1)',
          marginBottom: '10px',
          fontSize: '12px',
          wordBreak: 'break-all',
          color: '#FF8C00',
          borderRadius: '8px',
          border: '1px solid rgba(255,140,0,0.2)'
        }}>
          Debug: {debugInfo || 'No debug info'}<br/>
          Status: {loading ? 'Loading...' : error ? `Error: ${error}` : 'Ready'}
        </div>

        <div className="tabs">
          <button
            className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            🏠 Главная
          </button>
          <button
            className={`tab ${activeTab === 'statistics' ? 'active' : ''}`}
            onClick={() => setActiveTab('statistics')}
          >
            📊 Статистика
          </button>
          <button
            className={`tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            📜 История
          </button>
          <button
            className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            👤 Профиль
          </button>
        </div>

        <div className="fade-in">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default App;