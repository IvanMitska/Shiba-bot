require('dotenv').config();
const { sequelize } = require('./src/database/models');

async function addTelegramFields() {
  console.log('=== ADDING TELEGRAM FIELDS TO CLICKS TABLE ===\n');

  try {
    // Add telegram fields to clicks table
    await sequelize.query(`
      ALTER TABLE clicks
      ADD COLUMN IF NOT EXISTS telegram_user_id BIGINT,
      ADD COLUMN IF NOT EXISTS telegram_username VARCHAR(255),
      ADD COLUMN IF NOT EXISTS telegram_first_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS telegram_last_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS telegram_photo_url VARCHAR(500),
      ADD COLUMN IF NOT EXISTS telegram_language_code VARCHAR(10);
    `);

    console.log('✅ Telegram fields added successfully');

    // Verify fields were added
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'clicks'
      AND column_name LIKE 'telegram_%'
      ORDER BY column_name;
    `);

    console.log('\nAdded columns:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });

  } catch (error) {
    console.error('❌ Error adding fields:', error.message);
  } finally {
    await sequelize.close();
  }
}

addTelegramFields();