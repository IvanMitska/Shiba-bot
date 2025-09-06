require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');

const BOT_TOKEN = process.env.BOT_TOKEN || '8326608021:AAHT1G8YOVAq_RfWiq2m6NGnbRyAx9fhKDU';

console.log('🚀 Запускаем бота SHIBA-CARS (упрощенная версия)...');

const bot = new Telegraf(BOT_TOKEN);

// Временное хранилище партнеров (в памяти)
const partners = new Map();

// Команда /start
bot.start(async (ctx) => {
  try {
    const userId = ctx.from.id;
    const username = ctx.from.username || '';
    const firstName = ctx.from.first_name || 'Партнер';
    
    console.log(`✅ Новый пользователь: ${userId} (@${username})`);
    
    // Создаем или получаем партнера
    let partner = partners.get(userId);
    if (!partner) {
      const partnerCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      partner = {
        id: userId,
        username,
        firstName,
        code: partnerCode,
        totalClicks: 0,
        createdAt: new Date()
      };
      partners.set(userId, partner);
    }
    
    const partnerLink = `http://localhost:3000/r/${partner.code}`;
    
    const message = `
👋 Добро пожаловать в систему партнеров SHIBA CARS, ${firstName}!

🚗 Мы предлагаем аренду премиальных автомобилей

Ваша партнерская ссылка:
🔗 \`${partnerLink}\`

📊 Ваша статистика:
└ Всего переходов: ${partner.totalClicks}

💡 Скопируйте ссылку и поделитесь с клиентами!`;
    
    // Создаем клавиатуру
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.url('📊 Открыть лендинг', partnerLink)],
      [
        Markup.button.callback('📋 Копировать', 'copy_link'),
        Markup.button.callback('🔄 Обновить', 'refresh')
      ]
    ]);
    
    await ctx.replyWithMarkdown(message, keyboard);
    
  } catch (error) {
    console.error('❌ Ошибка в /start:', error);
    await ctx.reply('Произошла ошибка. Попробуйте позже.');
  }
});

// Обработка кнопок
bot.on('callback_query', async (ctx) => {
  try {
    const action = ctx.callbackQuery.data;
    const userId = ctx.from.id;
    const partner = partners.get(userId);
    
    if (!partner) {
      await ctx.answerCbQuery('Используйте /start');
      return;
    }
    
    switch (action) {
      case 'copy_link':
        const link = `http://localhost:3000/r/${partner.code}`;
        await ctx.answerCbQuery('Скопируйте ссылку из сообщения ниже', { show_alert: true });
        await ctx.reply(`\`${link}\``, { parse_mode: 'Markdown' });
        break;
        
      case 'refresh':
        await ctx.answerCbQuery('Статистика обновлена ✅');
        await ctx.reply(`📊 Всего переходов: ${partner.totalClicks}`);
        break;
        
      default:
        await ctx.answerCbQuery();
    }
  } catch (error) {
    console.error('❌ Ошибка:', error);
    await ctx.answerCbQuery('Ошибка', { show_alert: true });
  }
});

// Обработка текста
bot.on('text', (ctx) => {
  ctx.reply('Используйте команду /start для начала работы');
});

// Запуск с таймаутом
const startBot = async () => {
  try {
    // Устанавливаем таймаут для запуска
    const timeout = setTimeout(() => {
      console.error('⏱ Таймаут подключения. Возможные причины:');
      console.error('1. Telegram API заблокирован в вашей сети');
      console.error('2. Нужен VPN или прокси');
      console.error('3. Попробуйте ngrok + webhook');
      console.error('\n📱 Но вы можете открыть лендинг: http://localhost:3000');
      process.exit(1);
    }, 10000); // 10 секунд таймаут

    await bot.launch({
      dropPendingUpdates: true,
      allowedUpdates: ['message', 'callback_query']
    });
    
    clearTimeout(timeout);
    console.log('✅ Бот успешно запущен!');
    console.log('📱 Откройте Telegram: @SHIBA_CARS_PARTNERS_BOT');
    console.log('💬 Отправьте команду /start');
    console.log('🌐 Лендинг доступен: http://localhost:3000');
    
  } catch (error) {
    console.error('❌ Ошибка запуска:', error.message);
    console.error('\n💡 Альтернативы:');
    console.error('1. Используйте VPN');
    console.error('2. Настройте webhook через ngrok');
    console.error('3. Откройте лендинг: http://localhost:3000');
    process.exit(1);
  }
};

// Запускаем
startBot();

// Graceful stop
process.once('SIGINT', () => {
  console.log('Останавливаем бота...');
  bot.stop('SIGINT');
});
process.once('SIGTERM', () => {
  console.log('Останавливаем бота...');
  bot.stop('SIGTERM');
});