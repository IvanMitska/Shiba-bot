require('dotenv').config();
const { Telegraf } = require('telegraf');

async function setupWebhook() {
  try {
    const bot = new Telegraf(process.env.BOT_TOKEN);

    // Webhook URL for Railway
    const webhookUrl = 'https://shibo-tg-backend-production.up.railway.app/webhook';

    console.log('Setting up webhook...');
    console.log('Webhook URL:', webhookUrl);

    // Delete old webhook first
    await bot.telegram.deleteWebhook();
    console.log('✅ Old webhook deleted');

    // Set new webhook
    await bot.telegram.setWebhook(webhookUrl);
    console.log('✅ New webhook set');

    // Verify
    const webhookInfo = await bot.telegram.getWebhookInfo();
    console.log('\n📡 Webhook verification:', {
      url: webhookInfo.url,
      has_custom_certificate: webhookInfo.has_custom_certificate,
      pending_update_count: webhookInfo.pending_update_count,
      max_connections: webhookInfo.max_connections
    });

    if (webhookInfo.url === webhookUrl) {
      console.log('\n✅ SUCCESS! Webhook is now configured correctly!');
      console.log('Your bot should now respond to /start commands.');
    } else {
      console.log('\n⚠️ WARNING: Webhook URL mismatch!');
    }

  } catch (error) {
    console.error('❌ Error setting webhook:', error.message);
  }
}

setupWebhook();
