require('dotenv').config();

// Use Railway's DATABASE_URL if available
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found. Please set it to your Railway PostgreSQL URL');
  console.log('Example: DATABASE_URL=postgresql://user:pass@host/database node fix-railway-partner-code.js');
  process.exit(1);
}

const { Partner, Click, sequelize } = require('./src/database/models');

async function fixRailwayPartnerCode() {
  console.log('\n=== FIXING PARTNER CODE ON RAILWAY DATABASE ===\n');
  console.log('Database:', process.env.DATABASE_URL.split('@')[1]?.split('/')[0] || 'Railway PostgreSQL');

  try {
    // 1. Find Ivan's account by Telegram ID
    const ivan = await Partner.findOne({
      where: { telegramId: '1734337242' }
    });

    if (!ivan) {
      console.log('❌ Partner Ivan (telegramId: 1734337242) not found');

      // Try to find by username
      const ivanByUsername = await Partner.findOne({
        where: { username: 'IvanMitska' }
      });

      if (ivanByUsername) {
        console.log('Found by username:', ivanByUsername.username);
        console.log('Current code:', ivanByUsername.uniqueCode);

        // Update to a9T8-OYH
        await ivanByUsername.update({ uniqueCode: 'a9T8-OYH' });
        console.log('✅ Updated code to: a9T8-OYH');
      } else {
        console.log('❌ Partner not found by username either');
      }
      return;
    }

    console.log('\nCurrent information:');
    console.log(`  ID: ${ivan.id}`);
    console.log(`  Telegram ID: ${ivan.telegramId}`);
    console.log(`  Username: ${ivan.username}`);
    console.log(`  Current code: ${ivan.uniqueCode}`);
    console.log(`  Is Active: ${ivan.isActive}`);

    if (ivan.uniqueCode === 'a9T8-OYH') {
      console.log('\n✅ Code is already correct: a9T8-OYH');
      return;
    }

    // 2. Check if a9T8-OYH already exists
    const existingPartner = await Partner.findOne({
      where: { uniqueCode: 'a9T8-OYH' }
    });

    if (existingPartner && existingPartner.id !== ivan.id) {
      console.log(`\n⚠️ Code a9T8-OYH already exists for another partner:`);
      console.log(`  Username: ${existingPartner.username}`);
      console.log(`  Telegram ID: ${existingPartner.telegramId}`);

      // If it's a duplicate, we can delete it
      if (existingPartner.telegramId === ivan.telegramId) {
        console.log('\n✅ It\'s a duplicate account, removing it...');
        await existingPartner.destroy();
        console.log('Duplicate removed');
      } else {
        console.log('\n❌ Cannot use this code, it belongs to another partner');
        return;
      }
    }

    // 3. Update the code
    console.log(`\nUpdating code from ${ivan.uniqueCode} to a9T8-OYH...`);
    await ivan.update({ uniqueCode: 'a9T8-OYH', isActive: true });
    console.log('✅ Code updated successfully!');

    // 4. Verify the update
    await ivan.reload();
    console.log('\nVerification:');
    console.log(`  New code: ${ivan.uniqueCode}`);
    console.log(`  Partner link: https://shiba-cars-phuket.com/r/${ivan.uniqueCode}`);

    // 5. Check statistics
    const totalClicks = await Click.count({
      where: { partnerId: ivan.id }
    });

    console.log('\nStatistics:');
    console.log(`  Total clicks: ${totalClicks}`);
    console.log(`  WhatsApp clicks: ${ivan.whatsappClicks}`);

    console.log('\n✅ Railway database fixed successfully!');
    console.log('You can now use: https://shiba-cars-phuket.com/r/a9T8-OYH');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Details:', error);
  } finally {
    await sequelize.close();
  }
}

fixRailwayPartnerCode();