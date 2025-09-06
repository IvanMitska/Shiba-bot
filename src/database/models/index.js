const sequelize = require('../../config/database');
const Partner = require('./Partner');
const Click = require('./Click');
const Admin = require('./Admin');
const Settings = require('./Settings');

Partner.hasMany(Click, { 
  foreignKey: 'partner_id',
  as: 'clicks'
});

Click.belongsTo(Partner, { 
  foreignKey: 'partner_id',
  as: 'partner'
});

Settings.belongsTo(Admin, {
  foreignKey: 'updated_by',
  as: 'updatedByAdmin'
});

const syncDatabase = async (force = false) => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    await sequelize.sync({ force, alter: !force });
    console.log('Database synchronized successfully.');
    
    if (force) {
      await initializeDefaultSettings();
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
};

const initializeDefaultSettings = async () => {
  const defaultSettings = [
    {
      key: 'welcome_message',
      value: 'Добро пожаловать в систему партнеров аренды транспорта!',
      type: 'string',
      category: 'messages',
      isPublic: true
    },
    {
      key: 'landing_title',
      value: 'Аренда транспорта',
      type: 'string',
      category: 'landing',
      isPublic: true
    },
    {
      key: 'landing_subtitle',
      value: 'Свяжитесь с нами удобным способом',
      type: 'string',
      category: 'landing',
      isPublic: true
    },
    {
      key: 'whatsapp_message',
      value: 'Здравствуйте! Я пришел от партнера. Интересует аренда транспорта.',
      type: 'string',
      category: 'messages',
      isPublic: true
    },
    {
      key: 'telegram_message',
      value: 'Здравствуйте! Я пришел от партнера. Интересует аренда транспорта.',
      type: 'string',
      category: 'messages',
      isPublic: true
    },
    {
      key: 'tracking_enabled',
      value: true,
      type: 'boolean',
      category: 'system',
      isPublic: false
    },
    {
      key: 'analytics_retention_days',
      value: 90,
      type: 'number',
      category: 'system',
      isPublic: false
    }
  ];
  
  for (const setting of defaultSettings) {
    await Settings.findOrCreate({
      where: { key: setting.key },
      defaults: setting
    });
  }
  
  console.log('Default settings initialized.');
};

module.exports = {
  sequelize,
  Partner,
  Click,
  Admin,
  Settings,
  syncDatabase
};