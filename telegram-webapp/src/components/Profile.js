import React from 'react';
import { FiUser, FiCalendar, FiAward, FiTrendingUp, FiMail, FiPhone, FiLogOut } from 'react-icons/fi';
import { FaCar, FaWhatsapp, FaTelegram } from 'react-icons/fa';

const Profile = ({ data }) => {
  const user = window.Telegram?.WebApp?.initDataUnsafe?.user || {};

  // Generate avatar colors based on user ID
  const getAvatarColor = (id) => {
    const colors = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    ];
    return colors[(id || 0) % colors.length];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указана';
    const date = new Date(dateString);
    const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
                   'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const partnerId = data?.partnerId || 'TEST123';
  const stats = data?.statistics || {};

  return (
    <div className="profile-page">
      {/* User Info Card */}
      <div className="profile-card">
        <div className="profile-header">
          <div
            className="profile-avatar"
            style={{ background: getAvatarColor(user.id) }}
          >
            {user.first_name?.[0]?.toUpperCase() || 'I'}
          </div>
          <div className="profile-info">
            <h2 className="profile-name">
              {user.first_name || 'Ivan'} {user.last_name || ''}
            </h2>
            {user.username && (
              <p className="profile-username">@{user.username}</p>
            )}
          </div>
        </div>

        <div className="profile-info-grid">
          <div className="profile-info-card">
            <div className="info-header">ID ПАРТНЕРА</div>
            <div className="info-value">
              <FiUser className="info-icon" />
              <span>{partnerId}</span>
            </div>
          </div>

          <div className="profile-info-card">
            <div className="info-header">ДАТА РЕГИСТРАЦИИ</div>
            <div className="info-value">
              <FiCalendar className="info-icon" />
              <span>{formatDate(data?.registrationDate)}</span>
            </div>
          </div>

          <div className="profile-info-card">
            <div className="info-header">СТАТУС</div>
            <div className="info-value">
              <FiAward className="info-icon" />
              <span>Активный партнер</span>
            </div>
          </div>

          <div className="profile-info-card">
            <div className="info-header">УРОВЕНЬ</div>
            <div className="info-value">
              <FiTrendingUp className="info-icon" />
              <span>Бронза</span>
            </div>
          </div>
        </div>
      </div>


      {/* Contact Support */}
      <div className="profile-card">
        <h3 className="card-title">ПОДДЕРЖКА</h3>

        <div className="support-buttons">
          <button className="support-button">
            <FaTelegram size={20} />
            <span>Написать в поддержку</span>
          </button>

          <button className="support-button">
            <FiMail size={20} />
            <span>support@shibacars.com</span>
          </button>
        </div>
      </div>

      {/* Logout Button */}
      <button className="logout-button">
        <FiLogOut size={18} />
        <span>Выйти из аккаунта</span>
      </button>
    </div>
  );
};

export default Profile;