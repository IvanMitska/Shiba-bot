require('dotenv').config();

// Этот скрипт инициализирует новую базу данных Postgres-iHNJ
// и опционально переносит данные из старой базы

const { Sequelize } = require('sequelize');

async function initNewDatabase() {
  console.log('\n=== ИНИЦИАЛИЗАЦИЯ НОВОЙ БАЗЫ ДАННЫХ Postgres-iHNJ ===\n');

  // Проверяем наличие DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL не установлен в .env файле');
    console.log('\n📝 Инструкция:');
    console.log('1. Откройте Postgres-iHNJ в Railway');
    console.log('2. Скопируйте Connection URL');
    console.log('3. Добавьте в .env: DATABASE_URL=ваш_url_здесь');
    process.exit(1);
  }

  try {
    // Подключаемся к новой базе
    const sequelize = new Sequelize(process.env.DATABASE_URL, {
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    });

    console.log('🔄 Подключаемся к базе данных...');
    await sequelize.authenticate();
    console.log('✅ Подключение успешно!');

    // Загружаем модели
    const models = require('./src/database/models');

    console.log('\n🔄 Синхронизация моделей с базой данных...');

    // Создаем таблицы
    await sequelize.sync({ force: false });
    console.log('✅ Таблицы созданы!');

    // Проверяем структуру
    const [tables] = await sequelize.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('\n📊 Созданные таблицы:');
    tables.forEach(t => console.log(`   - ${t.table_name}`));

    // Создаем тестового партнера для проверки
    const { Partner } = models;

    // Проверяем, есть ли уже данные
    const existingCount = await Partner.count();

    if (existingCount === 0) {
      console.log('\n📝 База пустая. Создаем вашего партнера...');

      const ivan = await Partner.create({
        telegramId: '1734337242',
        username: 'IvanMitska',
        firstName: 'Ivan',
        lastName: 'Mitska',
        uniqueCode: 'a9T8-OYH',
        isActive: true,
        totalClicks: 0,
        uniqueVisitors: 0,
        whatsappClicks: 0,
        telegramClicks: 0
      });

      console.log('✅ Партнер создан:');
      console.log(`   Username: ${ivan.username}`);
      console.log(`   Код: ${ivan.uniqueCode}`);
      console.log(`   Ссылка: https://shiba-cars-phuket.com/r/${ivan.uniqueCode}`);
    } else {
      console.log(`\n✅ В базе уже есть ${existingCount} партнеров`);
    }

    console.log('\n✅ База данных Postgres-iHNJ готова к использованию!');
    console.log('\n📌 Не забудьте обновить DATABASE_URL в Railway:');
    console.log('   1. Откройте shibo-tg-backend в Railway');
    console.log('   2. Settings → Variables');
    console.log('   3. Обновите DATABASE_URL на URL от Postgres-iHNJ');

  } catch (error) {
    console.error('\n❌ Ошибка:', error.message);
    if (error.original) {
      console.error('Детали:', error.original.message);
    }
  } finally {
    process.exit(0);
  }
}

initNewDatabase();