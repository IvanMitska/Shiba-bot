import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiUser, FiMessageCircle, FiClock, FiGlobe, FiSmartphone } from 'react-icons/fi';
import { getTelegramWebApp } from '../utils/telegram';

const PartnerTraffic = ({ data }) => {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('all');

  useEffect(() => {
    fetchReferrals();
  }, [period]);

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      const tg = getTelegramWebApp();
      const authToken = tg?.initData;

      if (!authToken) {
        setError('Не удалось получить токен авторизации');
        setLoading(false);
        return;
      }

      const apiUrl = process.env.REACT_APP_API_URL || window.location.origin + '/api';
      const response = await axios.get(`${apiUrl}/partner/referrals`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        params: {
          period,
          limit: 50
        }
      });

      setReferrals(response.data.referrals || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching referrals:', err);
      setError('Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  };

  const openTelegramChat = (userId) => {
    if (!userId) return;

    // Open Telegram chat with user
    const tg = getTelegramWebApp();
    if (tg && tg.openTelegramLink) {
      tg.openTelegramLink(`https://t.me/${userId}`);
    } else {
      // Fallback - open in browser
      window.open(`https://t.me/${userId}`, '_blank');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'только что';
    if (minutes < 60) return `${minutes} мин назад`;
    if (hours < 24) return `${hours} ч назад`;
    if (days < 7) return `${days} д назад`;

    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getRedirectTypeLabel = (type) => {
    switch (type) {
      case 'whatsapp':
        return 'WhatsApp';
      case 'telegram':
        return 'Telegram';
      case 'landing':
        return 'Просмотр';
      default:
        return type || '-';
    }
  };

  const getRedirectTypeColor = (type) => {
    switch (type) {
      case 'whatsapp':
        return '#25D366';
      case 'telegram':
        return '#0088cc';
      case 'landing':
        return '#FF8C00';
      default:
        return '#666';
    }
  };

  if (loading) {
    return (
      <div className="partner-traffic">
        <div className="loader">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="partner-traffic">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="partner-traffic">
      <div className="traffic-header">
        <h2>Трафик партнеров</h2>
        <p className="traffic-subtitle">
          Список пользователей, перешедших по вашей ссылке
        </p>
      </div>

      <div className="period-selector">
        <button
          className={`period-btn ${period === 'today' ? 'active' : ''}`}
          onClick={() => setPeriod('today')}
        >
          Сегодня
        </button>
        <button
          className={`period-btn ${period === 'week' ? 'active' : ''}`}
          onClick={() => setPeriod('week')}
        >
          Неделя
        </button>
        <button
          className={`period-btn ${period === 'month' ? 'active' : ''}`}
          onClick={() => setPeriod('month')}
        >
          Месяц
        </button>
        <button
          className={`period-btn ${period === 'all' ? 'active' : ''}`}
          onClick={() => setPeriod('all')}
        >
          Все время
        </button>
      </div>

      <div className="referrals-stats">
        <div className="stat-box">
          <div className="stat-icon">
            <FiUser size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{referrals.length}</div>
            <div className="stat-label">Переходов</div>
          </div>
        </div>
      </div>

      {referrals.length === 0 ? (
        <div className="empty-state">
          <FiUser size={48} color="#666" />
          <p>Пока нет переходов</p>
          <p className="empty-subtitle">
            Поделитесь своей партнерской ссылкой, чтобы увидеть статистику
          </p>
        </div>
      ) : (
        <div className="referrals-list">
          {referrals.map((referral) => (
            <div key={referral.id} className="referral-card">
              <div className="referral-header">
                <div className="user-info">
                  <div className="user-avatar">
                    {referral.photoUrl ? (
                      <img src={referral.photoUrl} alt="User" />
                    ) : (
                      <FiUser size={24} />
                    )}
                  </div>
                  <div className="user-details">
                    <div className="user-name">
                      {referral.firstName || referral.lastName ? (
                        <>
                          {referral.firstName} {referral.lastName}
                        </>
                      ) : (
                        'Анонимный посетитель'
                      )}
                    </div>
                    {referral.username && (
                      <div className="user-username">@{referral.username}</div>
                    )}
                    {!referral.username && !referral.firstName && (
                      <div className="user-username" style={{color: '#888'}}>
                        {referral.deviceType || 'Неизвестное устройство'}
                      </div>
                    )}
                  </div>
                </div>
                {(referral.username || referral.userId) && (
                  <button
                    className="chat-btn"
                    onClick={() => openTelegramChat(referral.username || referral.userId)}
                    title="Открыть диалог"
                  >
                    <FiMessageCircle size={20} />
                  </button>
                )}
              </div>

              <div className="referral-details">
                <div className="detail-row">
                  <div className="detail-item">
                    <FiClock size={14} />
                    <span>{formatDate(referral.clickedAt)}</span>
                  </div>
                  <div className="detail-item">
                    <div
                      className="redirect-badge"
                      style={{ backgroundColor: getRedirectTypeColor(referral.redirectType) }}
                    >
                      {getRedirectTypeLabel(referral.redirectType)}
                    </div>
                  </div>
                </div>

                <div className="detail-row secondary">
                  {referral.country && (
                    <div className="detail-item">
                      <FiGlobe size={14} />
                      <span>{referral.country}{referral.city ? `, ${referral.city}` : ''}</span>
                    </div>
                  )}
                  {referral.deviceType && (
                    <div className="detail-item">
                      <FiSmartphone size={14} />
                      <span>{referral.deviceType}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PartnerTraffic;
