const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');
const { nanoid } = require('nanoid');

const Partner = sequelize.define('Partner', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  telegramId: {
    type: DataTypes.BIGINT,
    unique: true,
    allowNull: false,
    field: 'telegram_id'
  },
  username: {
    type: DataTypes.STRING,
    allowNull: true
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'first_name'
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'last_name'
  },
  uniqueCode: {
    type: DataTypes.STRING(10),
    unique: true,
    allowNull: false,
    field: 'unique_code',
    defaultValue: () => nanoid(8)
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  totalClicks: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_clicks'
  },
  uniqueVisitors: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'unique_visitors'
  },
  whatsappClicks: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'whatsapp_clicks'
  },
  telegramClicks: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'telegram_clicks'
  },
  lastActivityAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_activity_at'
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'partners',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['telegram_id']
    },
    {
      fields: ['unique_code']
    },
    {
      fields: ['is_active']
    }
  ]
});

Partner.prototype.getPartnerLink = function() {
  // Приоритеты для домена:
  // 1. LANDING_DOMAIN (для Netlify лендинга)
  // 2. Railway публичный домен (если нет лендинга)
  // 3. DOMAIN (fallback)
  // 4. localhost для разработки

  let domain;

  if (process.env.LANDING_DOMAIN) {
    // Используем LANDING_DOMAIN для партнерских ссылок (Netlify)
    domain = process.env.LANDING_DOMAIN;
  } else if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    // Fallback на Railway домен если нет LANDING_DOMAIN
    domain = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  } else if (process.env.DOMAIN) {
    domain = process.env.DOMAIN;
  } else {
    domain = 'https://localhost:3000';
  }

  // Убираем trailing slash если есть
  const cleanDomain = domain.replace(/\/$/, '');
  return `${cleanDomain}/r/${this.uniqueCode}`;
};

// Get Telegram bot deep link for tracking referrals
Partner.prototype.getTelegramBotLink = function() {
  const botUsername = process.env.BOT_USERNAME || 'your_bot';
  // This will open bot with start parameter, allowing us to track user info
  return `https://t.me/${botUsername}?start=ref_${this.uniqueCode}`;
};

Partner.prototype.incrementClicks = async function(type = 'total') {
  const updates = {
    totalClicks: this.totalClicks + 1,
    lastActivityAt: new Date()
  };
  
  if (type === 'whatsapp') {
    updates.whatsappClicks = this.whatsappClicks + 1;
  } else if (type === 'telegram') {
    updates.telegramClicks = this.telegramClicks + 1;
  }
  
  await this.update(updates);
};

module.exports = Partner;