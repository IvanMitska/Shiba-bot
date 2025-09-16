import React, { useState, useEffect } from 'react';
import { FaWhatsapp, FaTelegram, FaGlobe } from 'react-icons/fa';

const History = ({ data }) => {
  const [clicks, setClicks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Моковые данные без задержки для избежания анимации
    const mockClicks = [
      { id: 1, source: 'whatsapp', timestamp: new Date(), ip: '192.168.1.1', country: 'RU' },
      { id: 2, source: 'telegram', timestamp: new Date(Date.now() - 3600000), ip: '192.168.1.2', country: 'KZ' },
      { id: 3, source: 'direct', timestamp: new Date(Date.now() - 7200000), ip: '192.168.1.3', country: 'BY' },
      { id: 4, source: 'whatsapp', timestamp: new Date(Date.now() - 10800000), ip: '192.168.1.4', country: 'RU' },
      { id: 5, source: 'telegram', timestamp: new Date(Date.now() - 14400000), ip: '192.168.1.5', country: 'UA' },
    ];
    setClicks(mockClicks);
    setLoading(false);
  }, [data]);

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
      'UZ': '🇺🇿'
    };
    return flags[country] || '🌍';
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
          <div className="geography-item">
            <span className="country-label">🇷🇺 Россия</span>
            <span className="country-value">45%</span>
          </div>
          <div className="geography-item">
            <span className="country-label">🇰🇿 Казахстан</span>
            <span className="country-value">25%</span>
          </div>
          <div className="geography-item">
            <span className="country-label">🇧🇾 Беларусь</span>
            <span className="country-value">15%</span>
          </div>
          <div className="geography-item">
            <span className="country-label">🇺🇦 Украина</span>
            <span className="country-value">10%</span>
          </div>
          <div className="geography-item">
            <span className="country-label">🌍 Другие</span>
            <span className="country-value">5%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default History;