import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Statistics from './components/Statistics';
import History from './components/History';
import Profile from './components/Profile';
import PartnerTraffic from './components/PartnerTraffic';
import { getTelegramWebApp } from './utils/telegram';
import axios from 'axios';
import './styles/index.css';
import { FiHome, FiBarChart2, FiClock, FiUser, FiUsers } from 'react-icons/fi';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [partnerData, setPartnerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState('App started');
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  // Scroll to top when tab changes
  const handleTabChange = (tabName) => {
    setActiveTab(tabName);

    // Мгновенная прокрутка вверх для надежности
    window.scrollTo(0, 0);

    // Также попробуем через document.documentElement
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    setIsHeaderVisible(true); // Show header when changing tabs

    // Дополнительно через requestAnimationFrame для гарантии
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
    });
  };

  // Handle scroll to hide/show header
  useEffect(() => {
    let ticking = false;
    let scrollY = window.scrollY;

    const updateHeader = () => {
      const currentScrollY = window.scrollY;

      if (Math.abs(currentScrollY - scrollY) < 5) {
        ticking = false;
        return;
      }

      if (currentScrollY > scrollY && currentScrollY > 80) {
        // Scrolling down & past 80px
        setIsHeaderVisible(false);
      } else if (currentScrollY < scrollY) {
        // Scrolling up
        setIsHeaderVisible(true);
      }

      scrollY = currentScrollY;
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateHeader);
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    const initApp = async () => {
      try {
        console.log('Starting Web App initialization...');
        setDebugInfo('Initializing...');

        // Инициализируем Telegram WebApp
        const tg = getTelegramWebApp();
        let telegramId = null;
        let authToken = null;

        if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
          telegramId = tg.initDataUnsafe.user.id;
          authToken = tg.initData;

          tg.ready();
          tg.expand && tg.expand();
          setDebugInfo(`User ID: ${telegramId}`);
        } else {
          // Тестовый режим
          console.warn('Running in test mode without Telegram');
        }

        // Получаем данные партнера с сервера
        try {
          if (telegramId && authToken) {
            // Настраиваем axios для отправки токена
            const apiUrl = process.env.REACT_APP_API_URL || window.location.origin + '/api';

            let response;
            try {
              // Сначала пробуем получить данные партнера
              response = await axios.get(`${apiUrl}/partner/info`, {
                headers: {
                  'Authorization': `Bearer ${authToken}`
                }
              });
            } catch (infoError) {
              // Если партнер не найден, регистрируем его
              if (infoError.response?.status === 401 || infoError.response?.status === 404) {
                console.log('Partner not found, registering...');
                setDebugInfo('Registering new partner...');

                const registerResponse = await axios.post(`${apiUrl}/partner/register`, {
                  initData: authToken
                });

                if (registerResponse.data.success) {
                  // После регистрации получаем обновленные данные
                  response = await axios.get(`${apiUrl}/partner/info`, {
                    headers: {
                      'Authorization': `Bearer ${authToken}`
                    }
                  });
                  setDebugInfo('Registration successful');
                } else {
                  throw new Error('Registration failed');
                }
              } else {
                throw infoError;
              }
            }

            if (response.data) {
              // Получаем статистику за сегодня
              const statsResponse = await axios.get(`${apiUrl}/partner/stats`, {
                headers: {
                  'Authorization': `Bearer ${authToken}`
                },
                params: {
                  period: 'today'
                }
              });

              // Use real data from API (now counts from Click table)
              const partnerData = {
                partnerId: response.data.uniqueCode || String(response.data.id),
                partnerLink: response.data.partnerLink,
                telegramBotLink: response.data.telegramBotLink,
                registrationDate: response.data.createdAt,
                statistics: {
                  todayClicks: statsResponse.data?.data?.totalClicks || 0,
                  // Use data from partner/info (now calculated from Click table)
                  totalClicks: response.data.totalClicks || 0,
                  whatsappClicks: response.data.whatsappClicks || 0,
                  telegramClicks: response.data.telegramClicks || 0,
                  conversionRate: 0,
                  earnings: 0
                }
              };

              setPartnerData(partnerData);
              setDebugInfo('Data loaded from server');
            }
          } else {
            // Тестовые данные для разработки
            // Используем текущий домен
            const currentDomain = window.location.hostname === 'localhost'
              ? 'http://localhost:3000'
              : `${window.location.protocol}//${window.location.host}`;

            // В тестовом режиме нет реальной даты регистрации
            const testData = {
              partnerId: 'TEST123',
              partnerLink: `${currentDomain}/r/TEST123`,
              registrationDate: null, // Нет даты в тестовом режиме
              statistics: {
                todayClicks: 5,
                totalClicks: 42,
                whatsappClicks: 25,
                telegramClicks: 17,
                conversionRate: 0,
                earnings: 0
              }
            };

            setPartnerData(testData);
            setDebugInfo('Test mode - no Telegram data');
          }
        } catch (apiError) {
          console.error('API Error:', apiError);
          // Используем тестовые данные при ошибке API
          // Используем текущий домен
          const currentDomain = window.location.hostname === 'localhost'
            ? 'http://localhost:3000'
            : `${window.location.protocol}//${window.location.host}`;

          // При ошибке API данных о регистрации нет
          const testData = {
            partnerId: String(telegramId || 'TEST123'),
            partnerLink: `${currentDomain}/r/${telegramId || 'TEST123'}`,
            registrationDate: null, // Нет данных о дате регистрации при ошибке API
            statistics: {
              todayClicks: 0,
              totalClicks: 0,
              whatsappClicks: 0,
              telegramClicks: 0,
              conversionRate: 0,
              earnings: 0
            }
          };

          setPartnerData(testData);
          setDebugInfo('API error - using fallback data');
        }

      } catch (err) {
        console.error('Ошибка инициализации:', err);
        setError(err.message || 'Неизвестная ошибка');
        setDebugInfo(`Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    // Прокрутка вверх при загрузке приложения
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

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
      case 'traffic':
        return <PartnerTraffic data={partnerData} />;
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
      <div className={`app-header ${isHeaderVisible ? 'visible' : 'hidden'}`}>
        <div className="header-content">
          <div className="logo-section">
            <div>
              <div className="logo-text">
                <span className="shiba">SHIBA</span>
                <span className="cars">CARS</span>
              </div>
              <div className="header-subtitle">ПАРТНЁРСКАЯ ПРОГРАММА</div>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Debug info - temporary */}
        {false && (
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
        )}

        <div className="main-content">
          {renderContent()}
        </div>

        {/* Bottom Navigation */}
        <div className="bottom-tabs">
          <button
            className={`bottom-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleTabChange('dashboard')}
          >
            <span className="tab-icon">
              <FiHome size={20} />
            </span>
            <span className="tab-label">ГЛАВНАЯ</span>
          </button>
          <button
            className={`bottom-tab ${activeTab === 'statistics' ? 'active' : ''}`}
            onClick={() => handleTabChange('statistics')}
          >
            <span className="tab-icon">
              <FiBarChart2 size={20} />
            </span>
            <span className="tab-label">СТАТ.</span>
          </button>
          <button
            className={`bottom-tab ${activeTab === 'traffic' ? 'active' : ''}`}
            onClick={() => handleTabChange('traffic')}
          >
            <span className="tab-icon">
              <FiUsers size={20} />
            </span>
            <span className="tab-label">ТРАФИК</span>
          </button>
          <button
            className={`bottom-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => handleTabChange('history')}
          >
            <span className="tab-icon">
              <FiClock size={20} />
            </span>
            <span className="tab-label">ИСТОРИЯ</span>
          </button>
          <button
            className={`bottom-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => handleTabChange('profile')}
          >
            <span className="tab-icon">
              <FiUser size={20} />
            </span>
            <span className="tab-label">ПРОФИЛЬ</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;