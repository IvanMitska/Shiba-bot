const { Telegraf, Markup } = require('telegraf');

// Настройки бота
const BOT_TOKEN = '8326608021:AAHT1G8YOVAq_RfWiq2m6NGnbRyAx9fhKDU';
const WEBAPP_URL = 'https://shibo-webapp.vercel.app'; // Временный URL для теста

console.log('🚀 Запускаем бота SHIBA-CARS...');

const bot = new Telegraf(BOT_TOKEN);

// Хранилище партнеров (временное, в памяти)
const partners = new Map();

// Команда /start
bot.start(async (ctx) => {
  try {
    const userId = ctx.from.id;
    const username = ctx.from.username || '';
    const firstName = ctx.from.first_name || 'Партнер';
    const lastName = ctx.from.last_name || '';
    
    console.log(`✅ Новый пользователь: ${userId} (@${username})`);
    
    // Проверяем, есть ли уже партнер
    let partner = partners.get(userId);
    
    if (!partner) {
      // Создаем нового партнера
      const partnerCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      partner = {
        id: userId,
        username,
        firstName,
        lastName,
        code: partnerCode,
        totalClicks: 0,
        whatsappClicks: 0,
        telegramClicks: 0,
        registeredAt: new Date()
      };
      partners.set(userId, partner);
      console.log(`📝 Зарегистрирован новый партнер: ${partnerCode}`);
    }
    
    const partnerLink = `https://t.me/${ctx.botInfo.username}?start=${partner.code}`;
    
    const message = `
👋 Добро пожаловать в систему партнеров SHIBA CARS, ${firstName}!

🚗 Мы предлагаем аренду премиальных автомобилей

Ваша партнерская ссылка:
🔗 \`${partnerLink}\`

📊 Ваша статистика:
├ Всего переходов: ${partner.totalClicks}
├ WhatsApp: ${partner.whatsappClicks}
└ Telegram: ${partner.telegramClicks}

Используйте кнопки ниже для управления:`;
    
    // Создаем клавиатуру с Web App кнопкой
    const webAppUrl = `${WEBAPP_URL}?userId=${userId}&code=${partner.code}`;
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.webApp('📊 Открыть панель статистики', webAppUrl)],
      [
        Markup.button.callback('📋 Копировать', 'copy_link'),
        Markup.button.callback('🔄 Обновить', 'refresh_stats')
      ],
      [Markup.button.callback('📖 Как это работает?', 'how_it_works')]
    ]);
    
    await ctx.replyWithMarkdown(message, keyboard);
    
  } catch (error) {
    console.error('❌ Ошибка в /start:', error);
    await ctx.reply('Произошла ошибка. Попробуйте позже.');
  }
});

// Обработка callback кнопок
bot.on('callback_query', async (ctx) => {
  try {
    const action = ctx.callbackQuery.data;
    const userId = ctx.from.id;
    const partner = partners.get(userId);
    
    if (!partner) {
      await ctx.answerCbQuery('Сначала используйте /start');
      return;
    }
    
    switch (action) {
      case 'copy_link':
        const link = `https://t.me/${ctx.botInfo.username}?start=${partner.code}`;
        await ctx.answerCbQuery('Ссылка скопирована! 📋', { show_alert: true });
        await ctx.reply(`\`${link}\``, { parse_mode: 'Markdown' });
        break;
        
      case 'refresh_stats':
        await ctx.answerCbQuery('Статистика обновлена ✅');
        
        const updatedMessage = `
📊 Актуальная статистика:

├ Всего переходов: ${partner.totalClicks}
├ WhatsApp: ${partner.whatsappClicks}
└ Telegram: ${partner.telegramClicks}

Последнее обновление: ${new Date().toLocaleString('ru-RU')}`;
        
        await ctx.reply(updatedMessage);
        break;
        
      case 'how_it_works':
        await ctx.answerCbQuery();
        const helpMessage = `
📖 *Как это работает:*

1️⃣ Вы получаете уникальную партнерскую ссылку
2️⃣ Делитесь ею с потенциальными клиентами
3️⃣ Клиенты переходят по ссылке
4️⃣ Выбирают способ связи (WhatsApp/Telegram)
5️⃣ Вы видите всю статистику в реальном времени

💰 За каждого клиента, который арендовал авто, вы получаете вознаграждение!

_Есть вопросы? Напишите нам:_ @shiba_support`;
        
        await ctx.replyWithMarkdown(helpMessage);
        break;
        
      default:
        await ctx.answerCbQuery();
    }
  } catch (error) {
    console.error('❌ Ошибка в callback_query:', error);
    await ctx.answerCbQuery('Произошла ошибка', { show_alert: true });
  }
});

// Обработка любых текстовых сообщений
bot.on('text', (ctx) => {
  const text = ctx.message.text;
  console.log(`📝 Сообщение от ${ctx.from.username || ctx.from.id}: ${text}`);
  
  if (!text.startsWith('/')) {
    ctx.reply('Используйте команду /start для начала работы');
  }
});

// Обработка ошибок
bot.catch((err, ctx) => {
  console.error('❌ Глобальная ошибка:', err);
  try {
    ctx.reply('Произошла ошибка. Попробуйте позже.');
  } catch (e) {
    console.error('Не удалось отправить сообщение об ошибке:', e);
  }
});

// Запуск бота с настройками
bot.launch({
  dropPendingUpdates: true, // Игнорируем старые сообщения
  allowedUpdates: ['message', 'callback_query'] // Только нужные типы обновлений
})
.then(() => {
  console.log('✅ Бот успешно запущен!');
  console.log('📱 Username: @SHIBA_CARS_PARTNERS_BOT');
  console.log('💬 Откройте Telegram и отправьте /start');
  console.log('=====================================');
})
.catch((error) => {
  console.error('❌ Критическая ошибка при запуске:', error);
  process.exit(1);
});

// Graceful shutdown
process.once('SIGINT', () => {
  console.log('\n⏹ Останавливаем бота...');
  bot.stop('SIGINT');
  process.exit(0);
});

process.once('SIGTERM', () => {
  console.log('\n⏹ Останавливаем бота...');
  bot.stop('SIGTERM');
  process.exit(0);
});