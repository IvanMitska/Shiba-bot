import React, { useState } from 'react';
import { FiCopy, FiCheck, FiUsers, FiActivity, FiTrendingUp, FiDollarSign, FiExternalLink } from 'react-icons/fi';
import { FaWhatsapp, FaTelegram, FaChartLine } from 'react-icons/fa';
import shibaLogo from '../assets/logo.png';

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

  const openLanding = () => {
    if (data?.partnerLink) {
      // Haptic feedback
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
      }

      // Открываем через Telegram Web App API для корректной работы
      if (window.Telegram?.WebApp?.openLink) {
        window.Telegram.WebApp.openLink(data.partnerLink);
      } else {
        // Fallback для обычного браузера
        window.open(data.partnerLink, '_blank');
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
      <div className="card welcome-card" style={{
        background: 'rgba(26, 26, 26, 0.95)',
        borderColor: 'rgba(255, 255, 255, 0.08)',
        position: 'relative'
      }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            flexShrink: 0,
            overflow: 'hidden'
          }}>
            <img
              src={shibaLogo}
              alt="Shiba Logo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block'
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '700',
              marginBottom: '6px',
              color: '#ffffff'
            }}>
              Добро пожаловать
            </h2>
            <p style={{
              fontSize: '13px',
              color: 'var(--shiba-text-secondary)',
              fontWeight: '500'
            }}>
              Партнёр #{String(data?.partnerId || '0000').slice(-4)}
            </p>
          </div>
        </div>

        <div style={{
          padding: '14px',
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '12px',
          marginBottom: '16px',
          border: '1px solid rgba(255,255,255,0.06)'
        }}>
          <h3 style={{
            fontSize: '11px',
            fontWeight: '600',
            marginBottom: '10px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            color: 'var(--shiba-text-secondary)'
          }}>
            Партнёрская ссылка
          </h3>
          <div style={{
            fontSize: '13px',
            wordBreak: 'break-all',
            padding: '12px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#ffffff',
            fontWeight: '500',
            fontFamily: 'monospace'
          }}>
            {data?.partnerLink || 'Загрузка...'}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button className="button-primary" onClick={copyLink} style={{
            background: copied ? '#22c55e' : 'var(--shiba-orange)',
            padding: '14px',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: '600',
            letterSpacing: '0.3px',
            border: 'none',
            color: '#000000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            boxShadow: 'none'
          }}>
            {copied ? <FiCheck size={18} /> : <FiCopy size={18} />}
            <span>{copied ? 'Скопировано' : 'Копировать ссылку'}</span>
          </button>

          <button className="button-secondary" onClick={openLanding} style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#ffffff',
            padding: '14px',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: '600',
            letterSpacing: '0.3px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            boxShadow: 'none'
          }}>
            <FiExternalLink size={18} />
            <span>Открыть лендинг</span>
          </button>
        </div>

              </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card" style={{
          background: 'rgba(26, 26, 26, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          padding: '20px 16px',
          borderRadius: '16px'
        }}>
          <div className="icon" style={{
            background: 'var(--shiba-orange)',
            boxShadow: '0 4px 12px rgba(255, 140, 0, 0.25)',
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            marginBottom: '12px'
          }}>
            <FiTrendingUp size={22} />
          </div>
          <div className="stat-value" style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#ffffff',
            marginBottom: '4px'
          }}>{stats.todayClicks}</div>
          <div className="stat-label" style={{
            fontSize: '12px',
            color: 'var(--shiba-text-secondary)',
            fontWeight: '500',
            letterSpacing: '0.3px'
          }}>Сегодня</div>
        </div>

        <div className="stat-card" style={{
          background: 'rgba(26, 26, 26, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          padding: '20px 16px',
          borderRadius: '16px'
        }}>
          <div className="icon" style={{
            background: 'var(--shiba-orange)',
            boxShadow: '0 4px 12px rgba(255, 140, 0, 0.25)',
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            marginBottom: '12px'
          }}>
            <FaChartLine size={22} />
          </div>
          <div className="stat-value" style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#ffffff',
            marginBottom: '4px'
          }}>{stats.totalClicks}</div>
          <div className="stat-label" style={{
            fontSize: '12px',
            color: 'var(--shiba-text-secondary)',
            fontWeight: '500',
            letterSpacing: '0.3px'
          }}>Всего</div>
        </div>

        <div className="stat-card" style={{
          background: 'rgba(26, 26, 26, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          padding: '20px 16px',
          borderRadius: '16px'
        }}>
          <div className="icon" style={{
            background: '#25D366',
            boxShadow: '0 4px 12px rgba(37, 211, 102, 0.25)',
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            marginBottom: '12px'
          }}>
            <FaWhatsapp color="white" size={22} />
          </div>
          <div className="stat-value" style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#ffffff',
            marginBottom: '4px'
          }}>{stats.whatsappClicks}</div>
          <div className="stat-label" style={{
            fontSize: '12px',
            color: 'var(--shiba-text-secondary)',
            fontWeight: '500',
            letterSpacing: '0.3px'
          }}>WhatsApp</div>
        </div>

        <div className="stat-card" style={{
          background: 'rgba(26, 26, 26, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          padding: '20px 16px',
          borderRadius: '16px'
        }}>
          <div className="icon" style={{
            background: '#229ED9',
            boxShadow: '0 4px 12px rgba(34, 158, 217, 0.25)',
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            marginBottom: '12px'
          }}>
            <FaTelegram color="white" size={22} />
          </div>
          <div className="stat-value" style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#ffffff',
            marginBottom: '4px'
          }}>{stats.telegramClicks}</div>
          <div className="stat-label" style={{
            fontSize: '12px',
            color: 'var(--shiba-text-secondary)',
            fontWeight: '500',
            letterSpacing: '0.3px'
          }}>Telegram</div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;