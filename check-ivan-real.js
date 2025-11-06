require('dotenv').config();
const { Partner, Click, sequelize } = require('./src/database/models');

async function checkIvanReal() {
  console.log('\n=== CHECKING IVAN\'S REAL DATA ===\n');

  try {
    // Find by Telegram ID
    const partner = await Partner.findOne({
      where: { telegramId: '1734337242' },
      raw: true
    });

    if (partner) {
      console.log('✅ Found partner by Telegram ID 1734337242:');
      console.log('   ID:', partner.id);
      console.log('   Telegram ID:', partner.telegramId || partner.telegram_id);
      console.log('   Username:', partner.username);
      console.log('   Name:', partner.firstName || partner.first_name, partner.lastName || partner.last_name);
      console.log('   Code:', partner.uniqueCode || partner.unique_code);
      console.log('   Active:', partner.isActive || partner.is_active);
      console.log('   Total clicks:', partner.totalClicks || partner.total_clicks);
      console.log('   WhatsApp clicks:', partner.whatsappClicks || partner.whatsapp_clicks);
      console.log('   Telegram clicks:', partner.telegramClicks || partner.telegram_clicks);
      console.log('   Link:', `https://shiba-cars-phuket.com/r/${partner.uniqueCode || partner.unique_code}`);
      console.log('');
    } else {
      console.log('❌ Not found by Telegram ID');
    }

    // Try to find by code a9T8-OYH
    console.log('Looking for partner with code a9T8-OYH...');
    const partnerByCode = await Partner.findOne({
      where: { uniqueCode: 'a9T8-OYH' },
      raw: true
    });

    if (partnerByCode) {
      console.log('✅ Found partner by code a9T8-OYH:');
      console.log('   ID:', partnerByCode.id);
      console.log('   Telegram ID:', partnerByCode.telegramId || partnerByCode.telegram_id);
      console.log('   Username:', partnerByCode.username);
      console.log('   Code:', partnerByCode.uniqueCode || partnerByCode.unique_code);
    } else {
      console.log('❌ Not found by code a9T8-OYH');
    }

    // Try raw SQL query
    console.log('\nTrying raw SQL query...');
    const [results] = await sequelize.query(
      "SELECT id, telegram_id, username, unique_code, total_clicks FROM partners WHERE telegram_id = '1734337242'"
    );

    if (results && results.length > 0) {
      console.log('✅ Raw SQL result:');
      console.log(results[0]);
    }

    // Check all partners with ID 1
    console.log('\nChecking partner with ID = 1...');
    const partnerById = await Partner.findByPk(1, { raw: true });
    if (partnerById) {
      console.log('✅ Partner with ID 1:');
      console.log('   Telegram ID:', partnerById.telegramId || partnerById.telegram_id);
      console.log('   Code:', partnerById.uniqueCode || partnerById.unique_code);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkIvanReal();