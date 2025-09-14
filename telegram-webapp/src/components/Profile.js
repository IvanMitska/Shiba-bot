import React from 'react';
import { FiUser, FiCalendar, FiAward, FiTrendingUp, FiSettings, FiHelpCircle } from 'react-icons/fi';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const Profile = ({ data }) => {
  const user = window.Telegram?.WebApp?.initDataUnsafe?.user || {};
  
  return (
    <div className="profile">
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '24px',
            fontWeight: 'bold'
          }}>
            {user.first_name?.[0] || 'U'}
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>
              {user.first_name} {user.last_name}
            </h2>
            {user.username && (
              <p style={{ fontSize: '14px', color: 'var(--tg-theme-hint-color)' }}>
                @{user.username}
              </p>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--tg-theme-secondary-bg-color)', borderRadius: '8px' }}>
            <FiUser size={20} color="#667eea" />
            <div>
              <div style={{ fontSize: '12px', color: 'var(--tg-theme-hint-color)' }}>ID партнера</div>
              <div style={{ fontSize: '14px', fontWeight: '500' }}>{data?.partnerId || user.id}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--tg-theme-secondary-bg-color)', borderRadius: '8px' }}>
            <FiCalendar size={20} color="#667eea" />
            <div>
              <div style={{ fontSize: '12px', color: 'var(--tg-theme-hint-color)' }}>Дата регистрации</div>
              <div style={{ fontSize: '14px', fontWeight: '500' }}>
                {data?.registrationDate ? 
                  format(new Date(data.registrationDate), 'd MMMM yyyy', { locale: ru }) :
                  'Сегодня'
                }
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--tg-theme-secondary-bg-color)', borderRadius: '8px' }}>
            <FiAward size={20} color="#667eea" />
            <div>
              <div style={{ fontSize: '12px', color: 'var(--tg-theme-hint-color)' }}>Статус</div>
              <div style={{ fontSize: '14px', fontWeight: '500' }}>Активный партнер</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--tg-theme-secondary-bg-color)', borderRadius: '8px' }}>
            <FiTrendingUp size={20} color="#667eea" />
            <div>
              <div style={{ fontSize: '12px', color: 'var(--tg-theme-hint-color)' }}>Уровень</div>
              <div style={{ fontSize: '14px', fontWeight: '500' }}>Бронза</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
          Достижения
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          <div style={{ textAlign: 'center', padding: '12px', background: 'white', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>🎯</div>
            <div style={{ fontSize: '10px', color: 'var(--tg-theme-hint-color)' }}>Первый клик</div>
          </div>
          <div style={{ textAlign: 'center', padding: '12px', background: 'white', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>🔥</div>
            <div style={{ fontSize: '10px', color: 'var(--tg-theme-hint-color)' }}>10 переходов</div>
          </div>
          <div style={{ textAlign: 'center', padding: '12px', background: 'white', borderRadius: '8px', opacity: 0.5 }}>
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>🏆</div>
            <div style={{ fontSize: '10px', color: 'var(--tg-theme-hint-color)' }}>100 переходов</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
          Настройки и поддержка
        </h3>
        <div style={{ display: 'grid', gap: '8px' }}>
          <button style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px',
            background: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            width: '100%',
            textAlign: 'left'
          }}>
            <FiSettings size={20} color="#667eea" />
            <span style={{ fontSize: '14px' }}>Настройки уведомлений</span>
          </button>
          
          <button style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px',
            background: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            width: '100%',
            textAlign: 'left'
          }}>
            <FiHelpCircle size={20} color="#667eea" />
            <span style={{ fontSize: '14px' }}>Помощь и поддержка</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;