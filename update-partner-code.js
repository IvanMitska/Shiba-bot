require('dotenv').config();
const { Partner, sequelize } = require('./src/database/models');

async function updatePartnerCode() {
  console.log('\n=== UPDATING PARTNER CODE ===\n');

  try {
    const partner = await Partner.findOne({
      where: { telegramId: '1734337242' }
    });

    if (!partner) {
      console.log('❌ Partner not found');
      return;
    }

    console.log('Current partner info:');
    console.log(`  ID: ${partner.id}`);
    console.log(`  Username: ${partner.username}`);
    console.log(`  Current code: ${partner.uniqueCode}`);

    // Update to the code from screenshot
    const newCode = 'a9T8-OYH';

    // Check if new code already exists
    const existingPartner = await Partner.findOne({
      where: { uniqueCode: newCode }
    });

    if (existingPartner && existingPartner.id !== partner.id) {
      console.log(`\n❌ Code ${newCode} already exists for another partner`);
      return;
    }

    // Update the code
    await partner.update({ uniqueCode: newCode });

    console.log(`\n✅ Code updated to: ${newCode}`);
    console.log(`New partner link: ${partner.getPartnerLink()}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

// Ask for confirmation
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

readline.question('Do you want to update the code to a9T8-OYH? (yes/no): ', (answer) => {
  if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
    updatePartnerCode();
  } else {
    console.log('Operation cancelled');
    process.exit(0);
  }
  readline.close();
});