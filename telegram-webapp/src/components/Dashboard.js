import React, { useState } from 'react';
import { FiCopy, FiCheck, FiUsers, FiActivity, FiTrendingUp, FiDollarSign } from 'react-icons/fi';
import { FaWhatsapp, FaTelegram, FaCar, FaChartLine } from 'react-icons/fa';

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

      // Уведомление для пользователя
      if (window.Telegram?.WebApp?.showPopup) {
        window.Telegram.WebApp.showPopup({
          message: 'Ссылка скопирована!',
          buttons: [{ type: 'ok' }]
        });
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
      {/* Welcome Section */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(255,140,0,0.05) 0%, rgba(255,140,0,0.1) 100%)',
        borderColor: 'rgba(255,140,0,0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{
            width: '50px',
            height: '50px',
            background: 'linear-gradient(135deg, var(--shiba-orange) 0%, var(--shiba-orange-dark) 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FaCar size={24} color="#000" />
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '4px' }}>
              Добро пожаловать!
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--shiba-text-secondary)' }}>
              Партнёр #{String(data?.partnerId || '0000').slice(-4)}
            </p>
          </div>
        </div>

        <div style={{
          padding: '16px',
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '12px',
          marginBottom: '16px'
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Ваша партнёрская ссылка
          </h3>
          <div className="link-container" style={{
            fontSize: '12px',
            wordBreak: 'break-all',
            padding: '12px',
            background: 'rgba(0,0,0,0.5)',
            borderRadius: '8px',
            border: '1px solid rgba(255,140,0,0.2)'
          }}>
            {data?.partnerLink || 'Загрузка...'}
          </div>
        </div>

        <button className="button-primary copy-button" onClick={copyLink}>
          {copied ? <FiCheck size={18} /> : <FiCopy size={18} />}
          <span>{copied ? 'СКОПИРОВАНО!' : 'КОПИРОВАТЬ ССЫЛКУ'}</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="icon">
            <FiTrendingUp />
          </div>
          <div className="stat-value">{stats.todayClicks}</div>
          <div className="stat-label">Сегодня</div>
        </div>

        <div className="stat-card">
          <div className="icon">
            <FaChartLine />
          </div>
          <div className="stat-value">{stats.totalClicks}</div>
          <div className="stat-label">Всего</div>
        </div>

        <div className="stat-card">
          <div className="icon" style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' }}>
            <FaWhatsapp color="white" size={24} />
          </div>
          <div className="stat-value">{stats.whatsappClicks}</div>
          <div className="stat-label">WhatsApp</div>
        </div>

        <div className="stat-card">
          <div className="icon" style={{ background: 'linear-gradient(135deg, #229ED9 0%, #0088CC 100%)' }}>
            <FaTelegram color="white" size={24} />
          </div>
          <div className="stat-value">{stats.telegramClicks}</div>
          <div className="stat-label">Telegram</div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;