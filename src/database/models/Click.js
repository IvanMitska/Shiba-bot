const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Click = sequelize.define('Click', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  partnerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'partner_id',
    references: {
      model: 'partners',
      key: 'id'
    }
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'ip_address'
  },
  ipHash: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'ip_hash'
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'user_agent'
  },
  deviceType: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'device_type'
  },
  browser: {
    type: DataTypes.STRING,
    allowNull: true
  },
  os: {
    type: DataTypes.STRING,
    allowNull: true
  },
  referer: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  country: {
    type: DataTypes.STRING,
    allowNull: true
  },
  region: {
    type: DataTypes.STRING,
    allowNull: true
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true
  },
  timezone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  utmSource: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'utm_source'
  },
  utmMedium: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'utm_medium'
  },
  utmCampaign: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'utm_campaign'
  },
  utmTerm: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'utm_term'
  },
  utmContent: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'utm_content'
  },
  redirectType: {
    type: DataTypes.ENUM('whatsapp', 'telegram', 'landing'),
    allowNull: true,
    field: 'redirect_type'
  },
  clickedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'clicked_at'
  },
  sessionId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'session_id'
  },
  isUnique: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_unique'
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'clicks',
  timestamps: false,
  underscored: true,
  indexes: [
    {
      fields: ['partner_id']
    },
    {
      fields: ['clicked_at']
    },
    {
      fields: ['ip_hash']
    },
    {
      fields: ['redirect_type']
    },
    {
      fields: ['country', 'city']
    },
    {
      fields: ['utm_source', 'utm_medium', 'utm_campaign']
    }
  ]
});

module.exports = Click;