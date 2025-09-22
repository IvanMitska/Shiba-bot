require('dotenv').config();
const { Partner } = require('./src/database/models');
const { subDays } = require('date-fns');

async function addTestPartner() {
  try {
    // Create a test partner with registration date 5 days ago
    const registrationDate = subDays(new Date(), 5);

    const [partner, created] = await Partner.findOrCreate({
      where: { telegramId: 1734337242 },
      defaults: {
        telegramId: 1734337242,
        username: 'IvanMitska',
        firstName: 'Ivan',
        lastName: '',
        isActive: true,
        totalClicks: 42,
        uniqueVisitors: 15,
        whatsappClicks: 25,
        telegramClicks: 17,
        createdAt: registrationDate,
        updatedAt: registrationDate
      }
    });

    if (!created) {
      // Update existing partner
      await partner.update({
        username: 'IvanMitska',
        firstName: 'Ivan',
        lastName: '',
        isActive: true,
        totalClicks: 42,
        uniqueVisitors: 15,
        whatsappClicks: 25,
        telegramClicks: 17,
        createdAt: registrationDate,
        updatedAt: registrationDate
      });
      console.log('Updated existing partner:', partner.uniqueCode);
    } else {
      console.log('Created new partner:', partner.uniqueCode);
    }

    console.log('Partner details:');
    console.log('- ID:', partner.id);
    console.log('- Telegram ID:', partner.telegramId);
    console.log('- Username:', partner.username);
    console.log('- Unique Code:', partner.uniqueCode);
    console.log('- Registration Date:', partner.createdAt);
    console.log('- Partner Link:', partner.getPartnerLink());

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addTestPartner();