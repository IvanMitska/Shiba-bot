require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Простой обработчик команды /start для теста
bot.command('start', async (ctx) => {
  try {
    const userId = ctx.from.id;
    const username = ctx.from.username || 'Партнер';
    const firstName = ctx.from.first_name || '';
    
    // Генерируем случайный код для партнерской ссылки
    const partnerCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    const partnerLink = `http://localhost:3000/r/${partnerCode}`;
    
    const message = `
👋 Добро пожаловать, ${firstName}!

Ваша партнерская ссылка:
🔗 \`${partnerLink}\`

📊 Статистика:
├ Сегодня переходов: 0
├ WhatsApp: 0 | Telegram: 0
└ Всего переходов: 0

Используйте кнопку ниже для открытия панели управления:`;
    
    // Создаем кнопку для Web App
    const webAppUrl = `http://localhost:3000/webapp?userId=${userId}`;
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.webApp('📊 Открыть панель', webAppUrl)],
      [Markup.button.callback('📋 Копировать ссылку', 'copy_link')],
      [Markup.button.callback('🔄 Обновить статистику', 'refresh_stats')]
    ]);
    
    await ctx.replyWithMarkdown(message, keyboard);
    
    console.log(`New user: ${userId} (@${username})`);
  } catch (error) {
    console.error('Error in /start:', error);
    await ctx.reply('Произошла ошибка. Попробуйте позже.');
  }
});

bot.on('callback_query', async (ctx) => {
  const action = ctx.callbackQuery.data;
  
  switch (action) {
    case 'copy_link':
      await ctx.answerCbQuery('Скопируйте ссылку из сообщения выше');
      break;
    case 'refresh_stats':
      await ctx.answerCbQuery('Статистика обновлена');
      break;
    default:
      await ctx.answerCbQuery();
  }
});

bot.launch().then(() => {
  console.log('✅ Бот запущен успешно!');
  console.log('Откройте Telegram и найдите вашего бота');
  console.log('Отправьте команду /start');
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));