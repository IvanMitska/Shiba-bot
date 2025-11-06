require('dotenv').config();
const { Partner, Click, sequelize } = require('./src/database/models');

async function checkClicksAfterFix() {
  console.log('\n=== CHECKING CLICKS AFTER FIX ===\n');

  try {
    // Find Ivan's partner
    const partner = await Partner.findOne({
      where: { telegramId: '1734337242' }
    });

    if (!partner) {
      console.log('❌ Partner not found');
      return;
    }

    console.log('Partner info:');
    console.log(`  ID: ${partner.id}`);
    console.log(`  Code: ${partner.uniqueCode}`);
    console.log(`  Total clicks (in partner): ${partner.totalClicks}`);
    console.log(`  WhatsApp clicks (in partner): ${partner.whatsappClicks}`);
    console.log(`  Telegram clicks (in partner): ${partner.telegramClicks}`);

    // Count actual clicks in database
    const totalClicksInDB = await Click.count({
      where: { partnerId: partner.id }
    });

    const whatsappClicksInDB = await Click.count({
      where: {
        partnerId: partner.id,
        redirectType: 'whatsapp'
      }
    });

    const telegramClicksInDB = await Click.count({
      where: {
        partnerId: partner.id,
        redirectType: 'telegram'
      }
    });

    const landingClicksInDB = await Click.count({
      where: {
        partnerId: partner.id,
        redirectType: 'landing'
      }
    });

    console.log('\nActual clicks in database:');
    console.log(`  Total clicks: ${totalClicksInDB}`);
    console.log(`  Landing views: ${landingClicksInDB}`);
    console.log(`  WhatsApp clicks: ${whatsappClicksInDB}`);
    console.log(`  Telegram clicks: ${telegramClicksInDB}`);

    // Get recent clicks
    const recentClicks = await Click.findAll({
      where: { partnerId: partner.id },
      order: [['clickedAt', 'DESC']],
      limit: 5
    });

    console.log(`\nRecent clicks (${recentClicks.length}):`);
    if (recentClicks.length > 0) {
      recentClicks.forEach((click, index) => {
        console.log(`  ${index + 1}. Click #${click.id}:`);
        console.log(`     Time: ${click.clickedAt}`);
        console.log(`     Type: ${click.redirectType}`);
        console.log(`     Browser: ${click.browser}`);
        console.log(`     IP Hash: ${click.ipHash ? click.ipHash.substring(0, 10) + '...' : 'N/A'}`);
      });
    } else {
      console.log('  No clicks found');
    }

    // Test API
    console.log('\n=== TESTING API ===');
    const axios = require('axios');
    try {
      const response = await axios.get(`http://localhost:3000/api/webapp/partner/${partner.telegramId}`, {
        headers: { 'X-Telegram-Init-Data': 'test' }
      });
      console.log('API Statistics:', response.data.statistics);
    } catch (error) {
      console.log('API Error:', error.message);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkClicksAfterFix();