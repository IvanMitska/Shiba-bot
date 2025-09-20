import React, { useState, useEffect } from 'react';
import { FaWhatsapp, FaTelegram, FaGlobe } from 'react-icons/fa';
import axios from 'axios';

const History = ({ data }) => {
  const [clicks, setClicks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [countryStats, setCountryStats] = useState({});

  useEffect(() => {
    loadClicksData();
  }, [data]);

  const loadClicksData = async () => {
    try {
      setLoading(true);

      // Получаем токен авторизации из Telegram WebApp
      const tg = window.Telegram?.WebApp;
      const authToken = tg?.initData;

      if (!authToken && !data) {
        setClicks([]);
        setCountryStats({});
        setLoading(false);
        return;
      }

      const apiUrl = process.env.REACT_APP_API_URL || window.location.origin + '/api';

      // Загружаем последние клики
      const clicksResponse = await axios.get(`${apiUrl}/partner/clicks`, {
        headers: authToken ? {
          'Authorization': `Bearer ${authToken}`
        } : {},
        params: {
          limit: 20  // Последние 20 кликов
        }
      });

      // Загружаем аналитику для географии
      const analyticsResponse = await axios.get(`${apiUrl}/partner/analytics`, {
        headers: authToken ? {
          'Authorization': `Bearer ${authToken}`
        } : {},
        params: { days: 30 }  // За последние 30 дней
      });

      const realClicks = clicksResponse.data?.clicks || [];
      const analytics = analyticsResponse.data;

      // Преобразуем клики в нужный формат
      const formattedClicks = realClicks.map(click => ({
        id: click.id,
        source: click.redirectType || 'direct',
        timestamp: new Date(click.clickedAt),
        country: click.country || 'Unknown',
        ip: click.ipAddress
      }));

      setClicks(formattedClicks);
      setCountryStats(analytics?.countryStats || {});

    } catch (error) {
      console.error('Error loading clicks data:', error);
      // Fallback к пустым данным при ошибке
      setClicks([]);
      setCountryStats({});
    } finally {
      setLoading(false);
    }
  };

  const getSourceIcon = (source) => {
    switch (source) {
      case 'whatsapp':
        return <FaWhatsapp color="#25D366" size={20} />;
      case 'telegram':
        return <FaTelegram color="#0088cc" size={20} />;
      default:
        return <FaGlobe color="var(--shiba-orange)" size={20} />;
    }
  };

  const getSourceName = (source) => {
    switch (source) {
      case 'whatsapp':
        return 'WhatsApp';
      case 'telegram':
        return 'Telegram';
      default:
        return 'Прямой переход';
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const clickTime = new Date(timestamp);
    const diffInHours = (now - clickTime) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - clickTime) / (1000 * 60));
      return `${diffInMinutes} мин. назад`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} ч. назад`;
    } else {
      const days = Math.floor(diffInHours / 24);
      return `${days} д. назад`;
    }
  };

  const getCountryFlag = (country) => {
    const flags = {
      'RU': '🇷🇺',
      'KZ': '🇰🇿',
      'BY': '🇧🇾',
      'UA': '🇺🇦',
      'UZ': '🇺🇿',
      'US': '🇺🇸',
      'GB': '🇬🇧',
      'DE': '🇩🇪',
      'FR': '🇫🇷',
      'TR': '🇹🇷',
      'Unknown': '🌍'
    };
    return flags[country] || '🌍';
  };

  const getCountryName = (countryCode) => {
    const names = {
      'RU': 'Россия',
      'KZ': 'Казахстан',
      'BY': 'Беларусь',
      'UA': 'Украина',
      'UZ': 'Узбекистан',
      'US': 'США',
      'GB': 'Великобритания',
      'DE': 'Германия',
      'FR': 'Франция',
      'TR': 'Турция',
      'Unknown': 'Неизвестно'
    };
    return names[countryCode] || countryCode;
  };

  const calculateCountryPercentages = () => {
    const totalClicks = Object.values(countryStats).reduce((sum, count) => sum + count, 0);

    if (totalClicks === 0) return [];

    return Object.entries(countryStats)
      .sort(([,a], [,b]) => b - a) // Сортируем по убыванию количества
      .slice(0, 5) // Берем топ 5 стран
      .map(([country, count]) => ({
        country,
        count,
        percentage: ((count / totalClicks) * 100).toFixed(1)
      }));
  };

  if (loading) {
    return (
      <div className="loader">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="history-page">
      <div className="history-card">
        <h3 className="history-title">История переходов</h3>

        {clicks.length === 0 ? (
          <div className="empty-history">
            Пока нет переходов по вашей ссылке
          </div>
        ) : (
          <div className="history-list">
            {clicks.map((click) => (
              <div key={click.id} className="history-item">
                <div className="history-source">
                  <div className="source-icon">
                    {getSourceIcon(click.source)}
                  </div>
                  <div className="source-info">
                    <div className="source-name">
                      {getSourceName(click.source)}
                    </div>
                    <div className="source-country">
                      {getCountryFlag(click.country)} {click.country}
                    </div>
                  </div>
                </div>
                <div className="history-time">
                  {formatTime(click.timestamp)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="history-card">
        <h3 className="history-title">География переходов</h3>
        <div className="geography-list">
          {calculateCountryPercentages().length === 0 ? (
            <div className="empty-history">
              Нет данных о географии переходов
            </div>
          ) : (
            calculateCountryPercentages().map((countryData, index) => (
              <div key={countryData.country} className="geography-item">
                <span className="country-label">
                  {getCountryFlag(countryData.country)} {getCountryName(countryData.country)}
                </span>
                <span className="country-value">{countryData.percentage}%</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default History;