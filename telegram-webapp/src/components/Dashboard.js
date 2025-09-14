import React, { useState } from 'react';
import { FiCopy, FiCheck, FiTrendingUp, FiUsers, FiDollarSign, FiActivity } from 'react-icons/fi';
import { FaWhatsapp, FaTelegram } from 'react-icons/fa';

const Dashboard = ({ data }) => {
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    if (data?.partnerLink) {
      navigator.clipboard.writeText(data.partnerLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      // Haptic feedback
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }
    }
  };

  const stats = data?.statistics || {
    todayClicks: 0,
    totalClicks: 0,
    whatsappClicks: 0,
    telegramClicks: 0,
    conversionRate: 0,
    earnings: 0
  };

  return (
    <div className="dashboard">
      <div className="card">
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
          Ваша партнерская ссылка
        </h2>
        <div className="link-container">
          {data?.partnerLink || 'Загрузка...'}
        </div>
        <button className="button-primary copy-button" onClick={copyLink}>
          {copied ? <FiCheck size={18} /> : <FiCopy size={18} />}
          <span>{copied ? 'Скопировано!' : 'Копировать ссылку'}</span>
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <FiActivity size={24} style={{ marginBottom: '8px' }} />
          <div className="stat-value">{stats.todayClicks}</div>
          <div className="stat-label">Переходов сегодня</div>
        </div>
        
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
          <FiUsers size={24} style={{ marginBottom: '8px' }} />
          <div className="stat-value">{stats.totalClicks}</div>
          <div className="stat-label">Всего переходов</div>
        </div>
        
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
          <FiTrendingUp size={24} style={{ marginBottom: '8px' }} />
          <div className="stat-value">{stats.conversionRate}%</div>
          <div className="stat-label">Конверсия</div>
        </div>
        
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
          <FiDollarSign size={24} style={{ marginBottom: '8px' }} />
          <div className="stat-value">{stats.earnings}₽</div>
          <div className="stat-label">Заработано</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
          Статистика по источникам
        </h3>
        <div style={{ display: 'flex', justifyContent: 'space-around', padding: '12px 0' }}>
          <div style={{ textAlign: 'center' }}>
            <FaWhatsapp size={32} color="#25D366" />
            <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '8px' }}>
              {stats.whatsappClicks}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--tg-theme-hint-color)' }}>
              WhatsApp
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <FaTelegram size={32} color="#0088cc" />
            <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '8px' }}>
              {stats.telegramClicks}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--tg-theme-hint-color)' }}>
              Telegram
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
          Последнее обновление
        </h3>
        <p style={{ fontSize: '14px', color: 'var(--tg-theme-hint-color)' }}>
          {new Date().toLocaleString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>
    </div>
  );
};

export default Dashboard;