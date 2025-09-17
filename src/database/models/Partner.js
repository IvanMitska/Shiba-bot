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
  // Используем отдельный домен для партнерских ссылок если он указан
  const domain = process.env.LANDING_DOMAIN || process.env.DOMAIN || 'https://localhost:3000';
  // Убираем trailing slash если есть
  const cleanDomain = domain.replace(/\/$/, '');
  return `${cleanDomain}/r/${this.uniqueCode}`;
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