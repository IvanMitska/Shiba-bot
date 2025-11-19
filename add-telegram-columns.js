require('dotenv').config();
const { sequelize } = require('./src/database/models');

async function addTelegramColumns() {
  try {
    console.log('\n=== ДОБАВЛЕНИЕ TELEGRAM КОЛОНОК В ТАБЛИЦУ CLICKS ===\n');

    // Добавляем колонки для Telegram данных
    const queries = [
      `ALTER TABLE clicks ADD COLUMN IF NOT EXISTS telegram_user_id BIGINT`,
      `ALTER TABLE clicks ADD COLUMN IF NOT EXISTS telegram_username VARCHAR(255)`,
      `ALTER TABLE clicks ADD COLUMN IF NOT EXISTS telegram_first_name VARCHAR(255)`,
      `ALTER TABLE clicks ADD COLUMN IF NOT EXISTS telegram_last_name VARCHAR(255)`,
      `ALTER TABLE clicks ADD COLUMN IF NOT EXISTS telegram_photo_url TEXT`,
      `ALTER TABLE clicks ADD COLUMN IF NOT EXISTS telegram_language_code VARCHAR(10)`
    ];

    for (const query of queries) {
      try {
        await sequelize.query(query);
        console.log(`✅ Выполнено: ${query.substring(0, 60)}...`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`ℹ️ Колонка уже существует: ${query.substring(0, 60)}...`);
        } else {
          throw error;
        }
      }
    }

    // Проверяем результат
    const [columns] = await sequelize.query(
      `SELECT column_name, data_type
       FROM information_schema.columns
       WHERE table_name = 'clicks'
       AND column_name LIKE 'telegram_%'
       ORDER BY column_name`
    );

    console.log('\n📋 Telegram колонки в таблице clicks:');
    columns.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type}`);
    });

    console.log('\n✅ Миграция завершена успешно!');

  } catch (error) {
    console.error('❌ Ошибка миграции:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

addTelegramColumns();