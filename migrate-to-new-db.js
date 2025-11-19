require('dotenv').config();

// Скрипт для переноса данных из старой базы Postgres в новую Postgres-iHNJ

const { Sequelize, DataTypes } = require('sequelize');

// URL старой базы данных (Postgres)
const OLD_DB_URL = 'postgresql://postgres:CSToGdtVnEakEwrNQLAEezSrHqkafjGo@hopper.proxy.rlwy.net:44490/railway';

async function migrateData() {
  console.log('\n=== МИГРАЦИЯ ДАННЫХ В POSTGRES-iHNJ ===\n');

  // NEW_DB_URL должен быть в DATABASE_URL
  const NEW_DB_URL = process.env.DATABASE_URL;

  if (!NEW_DB_URL) {
    console.error('❌ DATABASE_URL не установлен!');
    console.log('Сначала обновите .env файл с URL от Postgres-iHNJ');
    process.exit(1);
  }

  if (NEW_DB_URL === OLD_DB_URL) {
    console.error('❌ DATABASE_URL все еще указывает на старую базу!');
    console.log('Обновите DATABASE_URL на URL от Postgres-iHNJ');
    process.exit(1);
  }

  try {
    // Подключаемся к обеим базам
    console.log('🔄 Подключаемся к старой базе данных...');
    const oldDb = new Sequelize(OLD_DB_URL, {
      logging: false,
      dialectOptions: {
        ssl: { require: true, rejectUnauthorized: false }
      }
    });
    await oldDb.authenticate();
    console.log('✅ Подключено к старой БД');

    console.log('🔄 Подключаемся к новой базе данных...');
    const newDb = new Sequelize(NEW_DB_URL, {
      logging: false,
      dialectOptions: {
        ssl: { require: true, rejectUnauthorized: false }
      }
    });
    await newDb.authenticate();
    console.log('✅ Подключено к новой БД');

    // Определяем модели для обеих баз
    const defineModels = (sequelize) => {
      const Partner = sequelize.define('Partner', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        telegramId: {
          type: DataTypes.STRING,
          field: 'telegram_id'
        },
        username: DataTypes.STRING,
        firstName: {
          type: DataTypes.STRING,
          field: 'first_name'
        },
        lastName: {
          type: DataTypes.STRING,
          field: 'last_name'
        },
        uniqueCode: {
          type: DataTypes.STRING,
          field: 'unique_code'
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          field: 'is_active'
        },
        totalClicks: {
          type: DataTypes.INTEGER,
          field: 'total_clicks'
        },
        uniqueVisitors: {
          type: DataTypes.INTEGER,
          field: 'unique_visitors'
        },
        whatsappClicks: {
          type: DataTypes.INTEGER,
          field: 'whatsapp_clicks'
        },
        telegramClicks: {
          type: DataTypes.INTEGER,
          field: 'telegram_clicks'
        }
      }, {
        tableName: 'partners',
        timestamps: false
      });

      const Click = sequelize.define('Click', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        partnerId: {
          type: DataTypes.INTEGER,
          field: 'partner_id'
        },
        redirectType: {
          type: DataTypes.STRING,
          field: 'redirect_type'
        },
        ipAddress: {
          type: DataTypes.STRING,
          field: 'ip_address'
        },
        userAgent: {
          type: DataTypes.STRING,
          field: 'user_agent'
        },
        clickedAt: {
          type: DataTypes.DATE,
          field: 'clicked_at'
        }
      }, {
        tableName: 'clicks',
        timestamps: false
      });

      return { Partner, Click };
    };

    const oldModels = defineModels(oldDb);
    const newModels = defineModels(newDb);

    // Создаем таблицы в новой БД
    console.log('\n🔄 Создаем таблицы в новой БД...');
    await newDb.sync({ force: false });
    console.log('✅ Таблицы созданы');

    // Переносим партнеров
    console.log('\n🔄 Переносим партнеров...');
    const oldPartners = await oldModels.Partner.findAll({ raw: true });

    if (oldPartners.length > 0) {
      for (const partner of oldPartners) {
        const existing = await newModels.Partner.findOne({
          where: { telegramId: partner.telegramId }
        });

        if (!existing) {
          await newModels.Partner.create(partner);
          console.log(`   ✅ Партнер ${partner.username} перенесен`);
        } else {
          console.log(`   ⚠️ Партнер ${partner.username} уже существует`);
        }
      }
      console.log(`✅ Перенесено партнеров: ${oldPartners.length}`);
    } else {
      console.log('   ℹ️ Нет партнеров для переноса');
    }

    // Переносим клики
    console.log('\n🔄 Переносим клики...');
    const oldClicks = await oldModels.Click.findAll({ raw: true });

    if (oldClicks.length > 0) {
      // Очищаем клики в новой БД
      await newModels.Click.destroy({ where: {} });

      // Добавляем клики пакетами
      const batchSize = 100;
      for (let i = 0; i < oldClicks.length; i += batchSize) {
        const batch = oldClicks.slice(i, i + batchSize);
        await newModels.Click.bulkCreate(batch);
        console.log(`   Перенесено ${Math.min(i + batchSize, oldClicks.length)}/${oldClicks.length} кликов`);
      }
      console.log(`✅ Перенесено кликов: ${oldClicks.length}`);
    } else {
      console.log('   ℹ️ Нет кликов для переноса');
    }

    // Проверяем результат
    console.log('\n📊 Статистика новой БД:');
    const newPartnerCount = await newModels.Partner.count();
    const newClickCount = await newModels.Click.count();
    console.log(`   Партнеров: ${newPartnerCount}`);
    console.log(`   Кликов: ${newClickCount}`);

    console.log('\n✅ Миграция завершена успешно!');
    console.log('\n📌 Теперь обновите DATABASE_URL в Railway на URL от Postgres-iHNJ');

    await oldDb.close();
    await newDb.close();

  } catch (error) {
    console.error('\n❌ Ошибка миграции:', error.message);
    if (error.original) {
      console.error('Детали:', error.original.message);
    }
  } finally {
    process.exit(0);
  }
}

// Запускаем миграцию
migrateData();