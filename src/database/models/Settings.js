const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Settings = sequelize.define('Settings', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  key: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  value: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('string', 'number', 'boolean', 'json', 'array'),
    defaultValue: 'string'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  category: {
    type: DataTypes.STRING,
    defaultValue: 'general'
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_public'
  },
  updatedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'updated_by',
    references: {
      model: 'admins',
      key: 'id'
    }
  }
}, {
  tableName: 'settings',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['key'],
      unique: true
    },
    {
      fields: ['category']
    },
    {
      fields: ['is_public']
    }
  ]
});

Settings.getValue = async function(key, defaultValue = null) {
  const setting = await this.findOne({ where: { key } });
  return setting ? setting.value : defaultValue;
};

Settings.setValue = async function(key, value, type = 'string', adminId = null) {
  const [setting, created] = await this.findOrCreate({
    where: { key },
    defaults: { value, type, updatedBy: adminId }
  });
  
  if (!created) {
    await setting.update({ value, type, updatedBy: adminId });
  }
  
  return setting;
};

Settings.getPublicSettings = async function() {
  const settings = await this.findAll({ where: { isPublic: true } });
  return settings.reduce((acc, setting) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {});
};

module.exports = Settings;