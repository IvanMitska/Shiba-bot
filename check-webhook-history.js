require('dotenv').config();
const { Telegraf } = require('telegraf');

async function checkWebhookHistory() {
  try {
    const bot = new Telegraf(process.env.BOT_TOKEN);

    console.log('=== WEBHOOK HISTORY CHECK ===\n');

    // Get current webhook info
    const webhookInfo = await bot.telegram.getWebhookInfo();

    console.log('📡 Current webhook info:');
    console.log(JSON.stringify({
      url: webhookInfo.url,
      has_custom_certificate: webhookInfo.has_custom_certificate,
      pending_update_count: webhookInfo.pending_update_count,
      last_error_date: webhookInfo.last_error_date,
      last_error_message: webhookInfo.last_error_message,
      last_synchronization_error_date: webhookInfo.last_synchronization_error_date,
      max_connections: webhookInfo.max_connections,
      allowed_updates: webhookInfo.allowed_updates,
      ip_address: webhookInfo.ip_address
    }, null, 2));

    console.log('\n=== АНАЛИЗ ===\n');

    if (webhookInfo.last_error_date) {
      const errorDate = new Date(webhookInfo.last_error_date * 1000);
      console.log('❌ ПОСЛЕДНЯЯ ОШИБКА WEBHOOK:');
      console.log('Сообщение:', webhookInfo.last_error_message);
      console.log('Дата:', errorDate.toLocaleString('ru-RU'));
      console.log('Как давно:', Math.floor((Date.now() - errorDate.getTime()) / 1000 / 60), 'минут назад');

      console.log('\n⚠️ ВОЗМОЖНАЯ ПРИЧИНА:');
      console.log('Telegram отключил webhook из-за ошибок на вашем сервере!');
      console.log('Webhook мог быть установлен правильно, но Railway возвращал ошибки.');
    } else {
      console.log('✅ Ошибок webhook не обнаружено');
    }

    if (webhookInfo.pending_update_count > 0) {
      console.log('\n⚠️ Необработанных обновлений:', webhookInfo.pending_update_count);
      console.log('Это означает, что webhook не обрабатывал сообщения');
    }

    console.log('\n=== ПРОВЕРКА ОКРУЖЕНИЯ ===\n');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('RAILWAY_PUBLIC_DOMAIN:', process.env.RAILWAY_PUBLIC_DOMAIN);
    console.log('RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT);

    const expectedWebhook = process.env.RAILWAY_PUBLIC_DOMAIN
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}/webhook`
      : 'https://shibo-tg-backend-production.up.railway.app/webhook';

    console.log('\nОжидаемый webhook:', expectedWebhook);
    console.log('Фактический webhook:', webhookInfo.url || 'НЕ УСТАНОВЛЕН');

    if (webhookInfo.url !== expectedWebhook) {
      console.log('\n❌ WEBHOOK URL НЕ СОВПАДАЕТ!');
      console.log('Это могло быть причиной проблемы.');
    }

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

checkWebhookHistory();
