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

  useEffect(() => {
    const initApp = async () => {
      try {
        const tg = getTelegramWebApp();
        
        // Настраиваем Telegram Web App
        tg.ready();
        tg.expand();
        tg.setHeaderColor('#667eea');
        tg.setBackgroundColor('#ffffff');
        
        // Получаем данные пользователя из Telegram
        const user = tg.initDataUnsafe?.user;
        
        if (!user) {
          throw new Error('Не удалось получить данные пользователя');
        }

        // Загружаем данные партнера
        const data = await fetchPartnerData(user.id);
        setPartnerData(data);
        
        // Настраиваем кнопку "Назад"
        tg.BackButton.show();
        tg.BackButton.onClick(() => {
          tg.close();
        });
        
      } catch (err) {
        console.error('Ошибка инициализации:', err);
        setError(err.message);
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
    <div className="app">
      <div className="container">
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