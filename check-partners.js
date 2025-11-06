require('dotenv').config();
const { Partner, Click, sequelize } = require('./src/database/models');

async function checkPartners() {
  console.log('\n=== CHECKING ALL PARTNERS ===\n');

  try {
    const partners = await Partner.findAll({
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    console.log(`Found ${partners.length} partners:\n`);

    partners.forEach(async (partner, index) => {
      console.log(`${index + 1}. Partner #${partner.id}:`);
      console.log(`   Telegram ID: ${partner.telegramId}`);
      console.log(`   Username: ${partner.username || 'N/A'}`);
      console.log(`   Name: ${partner.firstName || ''} ${partner.lastName || ''}`);
      console.log(`   Code: ${partner.uniqueCode}`);
      console.log(`   Active: ${partner.isActive}`);
      console.log(`   Total clicks: ${partner.totalClicks}`);
      console.log(`   WhatsApp clicks: ${partner.whatsappClicks}`);
      console.log(`   Telegram clicks: ${partner.telegramClicks}`);
      console.log(`   Partner Link: ${partner.getPartnerLink()}`);
      console.log(`   Created: ${partner.createdAt}`);
      console.log('');
    });

    // Check your specific Telegram ID
    const yourTelegramId = '293550895'; // Ваш Telegram ID из предыдущих логов
    console.log(`\nLooking for partner with Telegram ID: ${yourTelegramId}`);

    const yourPartner = await Partner.findOne({
      where: { telegramId: yourTelegramId }
    });

    if (yourPartner) {
      console.log('✅ Found your partner account:');
      console.log(`   Code: ${yourPartner.uniqueCode}`);
      console.log(`   Link: ${yourPartner.getPartnerLink()}`);

      // Count actual clicks
      const clickCount = await Click.count({
        where: { partnerId: yourPartner.id }
      });
      console.log(`   Clicks in database: ${clickCount}`);
    } else {
      console.log('❌ Your partner account not found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkPartners();