#!/usr/bin/env node

/**
 * Скрипт для миграции данных из SQLite в PostgreSQL
 * Использование: node scripts/migrate-to-postgres.js
 */

require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');

const SQLITE_PATH = './database.sqlite';
const POSTGRES_URL = process.env.POSTGRES_URL || 'postgresql://postgres:vTGnbzBKKOsXVDAMmYYTrfVOCeBzJLJe@autorack.proxy.rlwy.net:33433/railway';

console.log('🔄 Запуск миграции данных из SQLite в PostgreSQL...');

async function migrate() {
  // Подключение к SQLite
  const sqliteDb = new Sequelize({
    dialect: 'sqlite',
    storage: SQLITE_PATH,
    logging: false
  });

  // Подключение к PostgreSQL
  const postgresDb = new Sequelize(POSTGRES_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false
  });

  try {
    console.log('🔌 Проверка подключений...');
    await sqliteDb.authenticate();
    await postgresDb.authenticate();
    console.log('✅ Подключения установлены');

    // Определение моделей для SQLite
    const SqlitePartner = sqliteDb.define('Partner', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      telegramId: { type: DataTypes.BIGINT, field: 'telegram_id' },
      username: DataTypes.STRING,
      firstName: { type: DataTypes.STRING, field: 'first_name' },
      lastName: { type: DataTypes.STRING, field: 'last_name' },
      uniqueCode: { type: DataTypes.STRING, field: 'unique_code' },
      isActive: { type: DataTypes.BOOLEAN, field: 'is_active' },
      totalClicks: { type: DataTypes.INTEGER, field: 'total_clicks' },
      uniqueVisitors: { type: DataTypes.INTEGER, field: 'unique_visitors' },
      whatsappClicks: { type: DataTypes.INTEGER, field: 'whatsapp_clicks' },
      telegramClicks: { type: DataTypes.INTEGER, field: 'telegram_clicks' },
      lastActivityAt: { type: DataTypes.DATE, field: 'last_activity_at' },
      metadata: DataTypes.JSON
    }, { tableName: 'partners', timestamps: true, underscored: true });

    const SqliteClick = sqliteDb.define('Click', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      partnerId: { type: DataTypes.INTEGER, field: 'partner_id' },
      ipHash: { type: DataTypes.STRING, field: 'ip_hash' },
      userAgent: { type: DataTypes.TEXT, field: 'user_agent' },
      referer: DataTypes.STRING,
      country: DataTypes.STRING,
      city: DataTypes.STRING,
      redirectType: { type: DataTypes.ENUM('whatsapp', 'telegram'), field: 'redirect_type' },
      clickedAt: { type: DataTypes.DATE, field: 'clicked_at' },
      utmSource: { type: DataTypes.STRING, field: 'utm_source' },
      utmMedium: { type: DataTypes.STRING, field: 'utm_medium' },
      utmCampaign: { type: DataTypes.STRING, field: 'utm_campaign' },
      metadata: DataTypes.JSON
    }, { tableName: 'clicks', timestamps: true, underscored: true });

    // Определение моделей для PostgreSQL
    const PostgresPartner = postgresDb.define('Partner', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      telegramId: { type: DataTypes.BIGINT, field: 'telegram_id' },
      username: DataTypes.STRING,
      firstName: { type: DataTypes.STRING, field: 'first_name' },
      lastName: { type: DataTypes.STRING, field: 'last_name' },
      uniqueCode: { type: DataTypes.STRING, field: 'unique_code' },
      isActive: { type: DataTypes.BOOLEAN, field: 'is_active' },
      totalClicks: { type: DataTypes.INTEGER, field: 'total_clicks' },
      uniqueVisitors: { type: DataTypes.INTEGER, field: 'unique_visitors' },
      whatsappClicks: { type: DataTypes.INTEGER, field: 'whatsapp_clicks' },
      telegramClicks: { type: DataTypes.INTEGER, field: 'telegram_clicks' },
      lastActivityAt: { type: DataTypes.DATE, field: 'last_activity_at' },
      metadata: DataTypes.JSONB
    }, { tableName: 'partners', timestamps: true, underscored: true });

    const PostgresClick = postgresDb.define('Click', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      partnerId: { type: DataTypes.INTEGER, field: 'partner_id' },
      ipHash: { type: DataTypes.STRING, field: 'ip_hash' },
      userAgent: { type: DataTypes.TEXT, field: 'user_agent' },
      referer: DataTypes.STRING,
      country: DataTypes.STRING,
      city: DataTypes.STRING,
      redirectType: { type: DataTypes.ENUM('whatsapp', 'telegram'), field: 'redirect_type' },
      clickedAt: { type: DataTypes.DATE, field: 'clicked_at' },
      utmSource: { type: DataTypes.STRING, field: 'utm_source' },
      utmMedium: { type: DataTypes.STRING, field: 'utm_medium' },
      utmCampaign: { type: DataTypes.STRING, field: 'utm_campaign' },
      metadata: DataTypes.JSONB
    }, { tableName: 'clicks', timestamps: true, underscored: true });

    // Создание таблиц в PostgreSQL
    console.log('🏗️  Создание таблиц в PostgreSQL...');
    await postgresDb.sync({ force: false });
    console.log('✅ Таблицы созданы');

    // Миграция партнеров
    console.log('👥 Миграция партнеров...');
    const sqlitePartners = await SqlitePartner.findAll();
    console.log(`Найдено ${sqlitePartners.length} партнеров`);

    for (const partner of sqlitePartners) {
      const [postgresPartner, created] = await PostgresPartner.findOrCreate({
        where: { telegramId: partner.telegramId },
        defaults: partner.dataValues
      });

      if (created) {
        console.log(`✅ Создан партнер: ${partner.telegramId}`);
      } else {
        console.log(`⚠️  Партнер уже существует: ${partner.telegramId}`);
      }
    }

    // Миграция кликов
    console.log('📊 Миграция кликов...');
    const sqliteClicks = await SqliteClick.findAll();
    console.log(`Найдено ${sqliteClicks.length} кликов`);

    for (const click of sqliteClicks) {
      try {
        await PostgresClick.create(click.dataValues);
        console.log(`✅ Создан клик: ${click.id}`);
      } catch (error) {
        console.log(`⚠️  Ошибка при создании клика ${click.id}:`, error.message);
      }
    }

    console.log('🎉 Миграция завершена успешно!');

  } catch (error) {
    console.error('❌ Ошибка миграции:', error);
    process.exit(1);
  } finally {
    await sqliteDb.close();
    await postgresDb.close();
  }
}

// Запуск миграции
if (require.main === module) {
  migrate().catch(console.error);
}

module.exports = { migrate };