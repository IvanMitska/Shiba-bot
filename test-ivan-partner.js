require('dotenv').config();
const axios = require('axios');
const { Partner, Click, sequelize } = require('./src/database/models');

async function testIvanPartner() {
  console.log('\n=== TESTING IVAN\'S PARTNER ACCOUNT ===\n');

  try {
    // Find Ivan's partner account
    const partner = await Partner.findOne({
      where: { telegramId: '1734337242' }
    });

    if (!partner) {
      console.error('❌ Partner not found!');
      return;
    }

    console.log('✅ Found partner account:');
    console.log(`   Code: ${partner.uniqueCode}`);
    console.log(`   Link: ${partner.getPartnerLink()}`);
    console.log(`   Total clicks: ${partner.totalClicks}`);
    console.log(`   WhatsApp clicks: ${partner.whatsappClicks}`);
    console.log(`   Telegram clicks: ${partner.telegramClicks}`);

    // Check clicks in database
    console.log('\n📊 Checking database statistics:');

    const totalClicks = await Click.count({
      where: { partnerId: partner.id }
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

    console.log(`   Total clicks in DB: ${totalClicks}`);
    console.log(`   Landing views: ${landingClicks}`);
    console.log(`   WhatsApp clicks in DB: ${whatsappClicks}`);
    console.log(`   Telegram clicks in DB: ${telegramClicks}`);

    // Simulate a click to test tracking
    console.log('\n🧪 Testing click tracking...');

    const baseUrl = 'http://localhost:3000';
    const trackingUrl = `${baseUrl}/r/${partner.uniqueCode}`;

    console.log(`Simulating visit to: ${trackingUrl}`);

    try {
      const response = await axios.get(trackingUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      });

      if (response.status === 200) {
        console.log('✅ Landing page loaded successfully');

        // Wait for database to update
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Check if click was recorded
        const newTotalClicks = await Click.count({
          where: { partnerId: partner.id }
        });

        console.log(`   Clicks after test: ${newTotalClicks} (was ${totalClicks})`);

        if (newTotalClicks > totalClicks) {
          console.log('✅ Click was tracked successfully!');

          // Get the last click details
          const lastClick = await Click.findOne({
            where: { partnerId: partner.id },
            order: [['clickedAt', 'DESC']]
          });

          console.log('\n📝 Last click details:');
          console.log(`   ID: ${lastClick.id}`);
          console.log(`   Time: ${lastClick.clickedAt}`);
          console.log(`   Browser: ${lastClick.browser}`);
          console.log(`   OS: ${lastClick.os}`);
          console.log(`   Device: ${lastClick.deviceType}`);
          console.log(`   Type: ${lastClick.redirectType}`);
        } else {
          console.log('⚠️ Click was not recorded');
        }
      }
    } catch (error) {
      console.error('❌ Error testing click:', error.message);
      console.log('Make sure the server is running on port 3000');
    }

    // Test the webapp API
    console.log('\n🔌 Testing webapp API...');

    try {
      const apiUrl = `${baseUrl}/api/webapp/partner/${partner.telegramId}`;
      console.log(`Calling: ${apiUrl}`);

      const apiResponse = await axios.get(apiUrl, {
        headers: {
          'X-Telegram-Init-Data': 'test' // For development mode
        }
      });

      console.log('✅ API response received:');
      console.log('Statistics:', apiResponse.data.statistics);
    } catch (error) {
      console.error('❌ Error calling API:', error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await sequelize.close();
  }
}

testIvanPartner();