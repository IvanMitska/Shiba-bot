import React, { useState } from 'react';
import { FiCopy, FiCheck, FiUsers, FiActivity } from 'react-icons/fi';
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
    earnings: 0
  };

  return (
    <div className="dashboard">
      <div className="card">
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#FFD700' }}>
          🔗 Ваша партнерская ссылка
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
        <div className="stat-card">
          <FiActivity size={24} style={{ marginBottom: '8px', color: '#FFD700' }} />
          <div className="stat-value">{stats.todayClicks}</div>
          <div className="stat-label">Переходов сегодня</div>
        </div>
        
        <div className="stat-card">
          <FiUsers size={24} style={{ marginBottom: '8px', color: '#FFD700' }} />
          <div className="stat-value">{stats.totalClicks}</div>
          <div className="stat-label">Всего переходов</div>
        </div>
        
        <div className="stat-card">
          <FaWhatsapp size={24} style={{ marginBottom: '8px', color: '#25D366' }} />
          <div className="stat-value">{stats.whatsappClicks}</div>
          <div className="stat-label">WhatsApp</div>
        </div>
        
        <div className="stat-card">
          <FaTelegram size={24} style={{ marginBottom: '8px', color: '#0088cc' }} />
          <div className="stat-value">{stats.telegramClicks}</div>
          <div className="stat-label">Telegram</div>
        </div>
      </div>


      <div className="card">
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#FFD700' }}>
          ⏱️ Последнее обновление
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