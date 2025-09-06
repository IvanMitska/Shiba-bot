const { Telegraf } = require('telegraf');
const https = require('https');

// Токен бота
const BOT_TOKEN = '8326608021:AAHT1G8YOVAq_RfWiq2m6NGnbRyAx9fhKDU';

console.log('🔧 Проверяем токен бота...');

// Проверяем токен через API
const checkToken = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.telegram.org',
      path: `/bot${BOT_TOKEN}/getMe`,
      method: 'GET'
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (e) {
          reject(e);
        }
      });
    });
    
    req.on('error', reject);
    req.end();
  });
};

// Запускаем проверку
checkToken()
  .then((response) => {
    if (response.ok) {
      console.log('✅ Токен валидный!');
      console.log('📱 Информация о боте:');
      console.log('  - Username:', response.result.username);
      console.log('  - Имя:', response.result.first_name);
      console.log('  - ID:', response.result.id);
      console.log('  - Can join groups:', response.result.can_join_groups);
      console.log('  - Can read messages:', response.result.can_read_all_group_messages);
      console.log('  - Supports inline:', response.result.supports_inline_queries);
      
      console.log('\n🚀 Запускаем бота...\n');
      
      // Создаем и запускаем бота
      const bot = new Telegraf(BOT_TOKEN);
      
      bot.start((ctx) => {
        console.log('📩 Получена команда /start от пользователя:', {
          id: ctx.from.id,
          username: ctx.from.username,
          first_name: ctx.from.first_name
        });
        
        return ctx.reply('Привет! Бот работает! 🎉');
      });
      
      bot.on('text', (ctx) => {
        console.log('📝 Получено сообщение:', ctx.message.text);
        return ctx.reply(`Вы написали: ${ctx.message.text}`);
      });
      
      bot.catch((err, ctx) => {
        console.error('❌ Ошибка в боте:', err);
      });
      
      // Запускаем с polling
      bot.launch({
        dropPendingUpdates: true
      }).then(() => {
        console.log('✅ БОТ УСПЕШНО ЗАПУЩЕН!');
        console.log('📱 Откройте Telegram и найдите бота: @' + response.result.username);
        console.log('💬 Отправьте команду /start');
        console.log('\n📊 Лог сообщений:');
        console.log('=====================================');
      }).catch((error) => {
        console.error('❌ Ошибка при запуске бота:', error);
      });
      
      // Graceful stop
      process.once('SIGINT', () => bot.stop('SIGINT'));
      process.once('SIGTERM', () => bot.stop('SIGTERM'));
      
    } else {
      console.error('❌ Токен невалидный!');
      console.error('Ответ от Telegram:', response);
    }
  })
  .catch((error) => {
    console.error('❌ Ошибка при проверке токена:', error);
  });