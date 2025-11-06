require('dotenv').config();
const { Partner, sequelize } = require('./src/database/models');

async function checkDatabaseInfo() {
  console.log('\n=== DATABASE INFO ===\n');

  // Show which database we're connected to
  console.log('DATABASE_URL:', process.env.DATABASE_URL ?
    process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':***@') : 'Not set');

  console.log('\nChecking database connection...');

  try {
    // Get database name
    const [dbInfo] = await sequelize.query("SELECT current_database(), version()");
    console.log('Current database:', dbInfo[0].current_database);
    console.log('PostgreSQL version:', dbInfo[0].version.split(',')[0]);

    // Check all partners
    console.log('\n=== ALL PARTNERS IN DATABASE ===\n');
    const partners = await sequelize.query(
      "SELECT id, telegram_id, username, unique_code, total_clicks, created_at FROM partners ORDER BY id",
      { type: sequelize.QueryTypes.SELECT }
    );

    partners.forEach(p => {
      console.log(`ID: ${p.id}, TG: ${p.telegram_id}, User: ${p.username}, Code: ${p.unique_code}, Clicks: ${p.total_clicks}`);
    });

    // Check if there's any partner with code a9T8-OYH
    console.log('\n=== SEARCHING FOR CODE a9T8-OYH ===\n');
    const [searchResult] = await sequelize.query(
      "SELECT * FROM partners WHERE unique_code = 'a9T8-OYH' OR unique_code LIKE '%a9T8%'"
    );

    if (searchResult && searchResult.length > 0) {
      console.log('Found partner with similar code:');
      console.log(searchResult);
    } else {
      console.log('No partner found with code a9T8-OYH or similar');
    }

    // Check partner history/updates
    console.log('\n=== PARTNER WITH ID=1 DETAILS ===\n');
    const [partner1] = await sequelize.query(
      "SELECT * FROM partners WHERE id = 1"
    );

    if (partner1 && partner1.length > 0) {
      console.log('Full data for partner ID=1:');
      Object.keys(partner1[0]).forEach(key => {
        console.log(`  ${key}: ${partner1[0][key]}`);
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkDatabaseInfo();