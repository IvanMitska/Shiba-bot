require('dotenv').config();
const { Telegraf } = require('telegraf');

async function checkBotStatus() {
  try {
    const bot = new Telegraf(process.env.BOT_TOKEN);

    console.log('=== BOT STATUS CHECK ===');

    // Get bot info
    const botInfo = await bot.telegram.getMe();
    console.log('✅ Bot info:', {
      username: botInfo.username,
      id: botInfo.id,
      can_join_groups: botInfo.can_join_groups
    });

    // Get webhook info
    const webhookInfo = await bot.telegram.getWebhookInfo();
    console.log('\n📡 Webhook info:', {
      url: webhookInfo.url || 'NOT SET (polling mode?)',
      has_custom_certificate: webhookInfo.has_custom_certificate,
      pending_update_count: webhookInfo.pending_update_count,
      last_error_date: webhookInfo.last_error_date,
      last_error_message: webhookInfo.last_error_message,
      max_connections: webhookInfo.max_connections,
      allowed_updates: webhookInfo.allowed_updates
    });

    if (webhookInfo.last_error_message) {
      console.log('\n⚠️ LAST ERROR:', webhookInfo.last_error_message);
      console.log('Error date:', new Date(webhookInfo.last_error_date * 1000));
    }

    if (!webhookInfo.url) {
      console.log('\n⚠️ WARNING: Webhook is not set! Bot is in polling mode.');
      console.log('This means /start commands will NOT work on Railway hosting!');
    }

    console.log('\n=== ENVIRONMENT CHECK ===');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('RAILWAY_PUBLIC_DOMAIN:', process.env.RAILWAY_PUBLIC_DOMAIN || 'NOT SET');
    console.log('WEBAPP_URL:', process.env.WEBAPP_URL || 'NOT SET');
    console.log('Expected webhook URL:', `https://${process.env.RAILWAY_PUBLIC_DOMAIN || 'shibo-tg-backend-production.up.railway.app'}/webhook`);

  } catch (error) {
    console.error('❌ Error checking bot status:', error.message);
  }
}

checkBotStatus();
