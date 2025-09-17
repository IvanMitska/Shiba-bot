require('dotenv').config();
const { Partner } = require('../database/models');
const { syncDatabase } = require('../database/models');

async function createTestPartner() {
  try {
    console.log('Initializing database...');
    await syncDatabase(false);

    console.log('Creating test partner...');

    // Check if TEST123 exists
    let testPartner = await Partner.findOne({
      where: { uniqueCode: 'TEST123' }
    });

    if (testPartner) {
      console.log('Test partner already exists:', testPartner.uniqueCode);
      // Update to ensure it's active
      await testPartner.update({ isActive: true });
    } else {
      // Create new test partner
      testPartner = await Partner.create({
        telegramId: 123456789,
        username: 'test_user',
        firstName: 'Test',
        lastName: 'Partner',
        uniqueCode: 'TEST123',
        isActive: true,
        totalClicks: 0,
        uniqueVisitors: 0,
        whatsappClicks: 0,
        telegramClicks: 0
      });

      console.log('Test partner created:', testPartner.uniqueCode);
    }

    console.log('Partner link:', testPartner.getPartnerLink());
    console.log('✅ Test partner is ready!');

    process.exit(0);
  } catch (error) {
    console.error('Error creating test partner:', error);
    process.exit(1);
  }
}

createTestPartner();