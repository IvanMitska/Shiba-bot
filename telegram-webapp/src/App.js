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
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    const initApp = async () => {
      try {
        console.log('Starting Web App initialization...');
        setDebugInfo('Initializing...');
        
        const tg = getTelegramWebApp();
        console.log('Telegram WebApp object:', tg);
        
        // Настраиваем Telegram Web App
        if (tg.ready) {
          tg.ready();
          console.log('Telegram Web App ready');
        }
        
        if (tg.expand) {
          tg.expand();
          console.log('Telegram Web App expanded');
        }
        
        // Получаем данные пользователя из Telegram
        const user = tg.initDataUnsafe?.user;
        console.log('User data:', user);
        setDebugInfo(`User: ${JSON.stringify(user)}`);
        
        if (!user || !user.id) {
          // В режиме разработки используем тестовые данные
          console.log('No user data, using test data');
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
        } else {
          // Загружаем данные партнера
          const data = await fetchPartnerData(user.id);
          setPartnerData(data);
        }
        
        // Настраиваем кнопку "Назад"
        if (tg.BackButton) {
          tg.BackButton.show();
          tg.BackButton.onClick(() => {
            tg.close();
          });
        }
        
      } catch (err) {
        console.error('Ошибка инициализации:', err);
        setError(err.message || 'Неизвестная ошибка');
        setDebugInfo(`Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    initApp();
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

  return (
    <div className="app" style={{ minHeight: '100vh', background: 'var(--tg-theme-bg-color, #ffffff)' }}>
      <div className="container">
        {/* Debug info - remove in production */}
        {debugInfo && (
          <div style={{ 
            padding: '10px', 
            background: '#f0f0f0', 
            marginBottom: '10px',
            fontSize: '12px',
            wordBreak: 'break-all'
          }}>
            Debug: {debugInfo}
          </div>
        )}
        
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Главная
          </button>
          <button 
            className={`tab ${activeTab === 'statistics' ? 'active' : ''}`}
            onClick={() => setActiveTab('statistics')}
          >
            Статистика
          </button>
          <button 
            className={`tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            История
          </button>
          <button 
            className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Профиль
          </button>
        </div>
        
        {renderContent()}
      </div>
    </div>
  );
}

export default App;