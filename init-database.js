const { Sequelize } = require('sequelize');
require('dotenv').config();

// Uncomment the DATABASE_URL in .env file
const DATABASE_URL = 'postgresql://postgres:vTGnbzBKKOsXVDAMmYYTrfVOCeBzJLJe@autorack.proxy.rlwy.net:33433/railway';

async function initDatabase() {
  console.log('Connecting to PostgreSQL database on Railway...');

  const sequelize = new Sequelize(DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: console.log
  });

  try {
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Sync all models - this will create tables if they don't exist
    console.log('Creating tables...');
    await sequelize.sync({ force: false, alter: false });
    console.log('✅ All tables created successfully.');

    // Import models to initialize default data
    const { syncDatabase } = require('./src/database/models');
    await syncDatabase();
    console.log('✅ Default settings initialized.');

    // Show current tables
    const [results] = await sequelize.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);

    console.log('\n📊 Tables in database:');
    results.forEach(row => {
      console.log(`   - ${row.tablename}`);
    });

    console.log('\n✅ Database initialization complete!');
    console.log('ℹ️  Now uncomment the DATABASE_URL in your .env file to use this database.');

  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

initDatabase();