const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Admin = sequelize.define('Admin', {
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
  role: {
    type: DataTypes.ENUM('super_admin', 'admin', 'moderator'),
    defaultValue: 'admin'
  },
  permissions: {
    type: DataTypes.JSONB,
    defaultValue: {
      viewPartners: true,
      managePartners: false,
      viewAnalytics: true,
      exportData: false,
      systemSettings: false
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_login_at'
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'admins',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['telegram_id']
    },
    {
      fields: ['role']
    },
    {
      fields: ['is_active']
    }
  ]
});

Admin.prototype.hasPermission = function(permission) {
  if (this.role === 'super_admin') return true;
  return this.permissions[permission] === true;
};

Admin.prototype.updateLastLogin = async function() {
  await this.update({ lastLoginAt: new Date() });
};

module.exports = Admin;