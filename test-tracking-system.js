require('dotenv').config();
const axios = require('axios');
const { Partner, Click, sequelize } = require('./src/database/models');

async function testTrackingSystem() {
  console.log('\n=== TESTING PARTNER TRACKING SYSTEM ===\n');

  try {
    // 1. Find your partner account
    const partnerCode = 'a9T8-OYH';
    console.log(`1. Looking for partner with code: ${partnerCode}`);

    const partner = await Partner.findOne({
      where: { uniqueCode: partnerCode }
    });

    if (!partner) {
      console.error('❌ Partner not found!');
      return;
    }

    console.log(`✅ Found partner:`, {
      id: partner.id,
      telegramId: partner.telegramId,
      username: partner.username,
      code: partner.uniqueCode,
      totalClicks: partner.totalClicks,
      whatsappClicks: partner.whatsappClicks,
      telegramClicks: partner.telegramClicks
    });

    // 2. Check recent clicks
    console.log('\n2. Checking recent clicks in database...');

    const recentClicks = await Click.findAll({
      where: { partnerId: partner.id },
      order: [['clickedAt', 'DESC']],
      limit: 5
    });

    console.log(`Found ${recentClicks.length} recent clicks:`);
    recentClicks.forEach((click, index) => {
      console.log(`  ${index + 1}. Click #${click.id}:`, {
        clickedAt: click.clickedAt,
        redirectType: click.redirectType,
        browser: click.browser,
        country: click.country,
        city: click.city
      });
    });

    // 3. Check statistics
    console.log('\n3. Calculating statistics...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayClicks = await Click.count({
      where: {
        partnerId: partner.id,
        clickedAt: { [sequelize.Op.gte]: today }
      }
    });

    const whatsappClicks = await Click.count({
      where: {
        partnerId: partner.id,
        redirectType: 'whatsapp'
      }
    });

    const telegramClicks = await Click.count({
      where: {
        partnerId: partner.id,
        redirectType: 'telegram'
      }
    });

    const landingClicks = await Click.count({
      where: {
        partnerId: partner.id,
        redirectType: 'landing'
      }
    });

    console.log('📊 Statistics:');
    console.log(`  Today clicks: ${todayClicks}`);
    console.log(`  Total clicks: ${partner.totalClicks}`);
    console.log(`  Landing views: ${landingClicks}`);
    console.log(`  WhatsApp clicks: ${whatsappClicks} (in DB) vs ${partner.whatsappClicks} (in partner)`);
    console.log(`  Telegram clicks: ${telegramClicks} (in DB) vs ${partner.telegramClicks} (in partner)`);

    // 4. Simulate a click
    console.log('\n4. Testing click tracking...');

    const baseUrl = process.env.DOMAIN || 'http://localhost:3000';
    const trackingUrl = `${baseUrl}/r/${partnerCode}`;

    console.log(`Simulating click to: ${trackingUrl}`);

    try {
      const response = await axios.get(trackingUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Test) AppleWebKit/537.36'
        }
      });

      console.log('✅ Landing page loaded successfully');
      console.log(`Response status: ${response.status}`);

      // Check if click was recorded
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second

      const newClicksCount = await Click.count({
        where: { partnerId: partner.id }
      });

      console.log(`Clicks count after test: ${newClicksCount}`);
    } catch (error) {
      console.error('❌ Error testing click:', error.message);
    }

    // 5. Test webapp API
    console.log('\n5. Testing webapp API...');

    const webappUrl = `${baseUrl}/api/webapp/partner/${partner.telegramId}`;
    console.log(`Testing API endpoint: ${webappUrl}`);

    try {
      const apiResponse = await axios.get(webappUrl, {
        headers: {
          'X-Telegram-Init-Data': 'test' // For development mode
        }
      });

      console.log('✅ API response received:');
      console.log('Statistics from API:', apiResponse.data.statistics);
    } catch (error) {
      console.error('❌ Error calling API:', error.message);
    }

    // 6. Database consistency check
    console.log('\n6. Checking database consistency...');

    // Refresh partner data
    await partner.reload();

    console.log('Partner counters after test:');
    console.log(`  totalClicks (partner): ${partner.totalClicks}`);
    console.log(`  whatsappClicks (partner): ${partner.whatsappClicks}`);
    console.log(`  telegramClicks (partner): ${partner.telegramClicks}`);

    const actualTotalClicks = await Click.count({
      where: { partnerId: partner.id }
    });

    console.log(`  Actual clicks in DB: ${actualTotalClicks}`);

    if (partner.totalClicks !== actualTotalClicks) {
      console.warn('⚠️ Mismatch between partner.totalClicks and actual clicks count!');
      console.log('This could be the issue with statistics not updating.');
    } else {
      console.log('✅ Click counts are consistent');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error(error.stack);
  } finally {
    await sequelize.close();
  }
}

// Run the test
testTrackingSystem();