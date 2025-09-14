import React, { useState, useEffect } from 'react';
import { FaWhatsapp, FaTelegram, FaGlobe } from 'react-icons/fa';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const History = ({ data }) => {
  const [clicks, setClicks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Здесь должна быть загрузка реальных данных
    setTimeout(() => {
      // Моковые данные для примера
      const mockClicks = [
        { id: 1, source: 'whatsapp', timestamp: new Date(), ip: '192.168.1.1', country: 'RU' },
        { id: 2, source: 'telegram', timestamp: new Date(Date.now() - 3600000), ip: '192.168.1.2', country: 'KZ' },
        { id: 3, source: 'direct', timestamp: new Date(Date.now() - 7200000), ip: '192.168.1.3', country: 'BY' },
        { id: 4, source: 'whatsapp', timestamp: new Date(Date.now() - 10800000), ip: '192.168.1.4', country: 'RU' },
        { id: 5, source: 'telegram', timestamp: new Date(Date.now() - 14400000), ip: '192.168.1.5', country: 'UA' },
      ];
      setClicks(mockClicks);
      setLoading(false);
    }, 500);
  }, [data]);

  const getSourceIcon = (source) => {
    switch (source) {
      case 'whatsapp':
        return <FaWhatsapp color="#25D366" size={20} />;
      case 'telegram':
        return <FaTelegram color="#0088cc" size={20} />;
      default:
        return <FaGlobe color="#667eea" size={20} />;
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
      return format(clickTime, 'd MMM HH:mm', { locale: ru });
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
    <div className="history">
      <div className="card">
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
          История переходов
        </h3>
        
        {clicks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--tg-theme-hint-color)' }}>
            Пока нет переходов по вашей ссылке
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {clicks.map((click) => (
              <div key={click.id} className="history-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {getSourceIcon(click.source)}
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '500' }}>
                      {getSourceName(click.source)}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--tg-theme-hint-color)' }}>
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

      <div className="card">
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
          География переходов
        </h3>
        <div style={{ display: 'grid', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: 'white', borderRadius: '8px' }}>
            <span>🇷🇺 Россия</span>
            <span style={{ fontWeight: 'bold' }}>45%</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: 'white', borderRadius: '8px' }}>
            <span>🇰🇿 Казахстан</span>
            <span style={{ fontWeight: 'bold' }}>25%</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: 'white', borderRadius: '8px' }}>
            <span>🇧🇾 Беларусь</span>
            <span style={{ fontWeight: 'bold' }}>15%</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: 'white', borderRadius: '8px' }}>
            <span>🇺🇦 Украина</span>
            <span style={{ fontWeight: 'bold' }}>10%</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: 'white', borderRadius: '8px' }}>
            <span>🌍 Другие</span>
            <span style={{ fontWeight: 'bold' }}>5%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default History;