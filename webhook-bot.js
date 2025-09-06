require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const express = require('express');
const path = require('path');

// ВАЖНО: Замените на ваш ngrok URL
const WEBHOOK_DOMAIN = 'https://YOUR-NGROK-URL.ngrok.io';
const BOT_TOKEN = process.env.BOT_TOKEN || '8326608021:AAHT1G8YOVAq_RfWiq2m6NGnbRyAx9fhKDU';
const PORT = process.env.PORT || 3000;

console.log('🚀 Запускаем бота с webhook...');

const app = express();
const bot = new Telegraf(BOT_TOKEN);

// Хранилище партнеров
const partners = new Map();

// Настройка Express
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/web/views'));

// === BOT HANDLERS ===

bot.start(async (ctx) => {
  try {
    const userId = ctx.from.id;
    const username = ctx.from.username || '';
    const firstName = ctx.from.first_name || 'Партнер';
    
    let partner = partners.get(userId);
    if (!partner) {
      const partnerCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      partner = {
        id: userId,
        username,
        firstName,
        code: partnerCode,
        totalClicks: 0,
        whatsappClicks: 0,
        telegramClicks: 0
      };
      partners.set(userId, partner);
      console.log(`✅ Новый партнер: ${userId} (@${username})`);
    }
    
    const partnerLink = `${WEBHOOK_DOMAIN}/r/${partner.code}`;
    
    const message = `
👋 Добро пожаловать, ${firstName}!

🚗 SHIBA CARS - Аренда премиальных автомобилей

Ваша партнерская ссылка:
🔗 \`${partnerLink}\`

📊 Статистика:
├ Всего переходов: ${partner.totalClicks}
├ WhatsApp: ${partner.whatsappClicks}
└ Telegram: ${partner.telegramClicks}`;
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.url('📊 Открыть лендинг', partnerLink)],
      [
        Markup.button.callback('📋 Копировать', 'copy'),
        Markup.button.callback('🔄 Обновить', 'refresh')
      ]
    ]);
    
    await ctx.replyWithMarkdown(message, keyboard);
    
  } catch (error) {
    console.error('Ошибка:', error);
    await ctx.reply('Произошла ошибка');
  }
});

bot.on('callback_query', async (ctx) => {
  const action = ctx.callbackQuery.data;
  const userId = ctx.from.id;
  const partner = partners.get(userId);
  
  if (!partner) {
    await ctx.answerCbQuery('Используйте /start');
    return;
  }
  
  if (action === 'copy') {
    await ctx.answerCbQuery('Скопируйте ссылку ниже');
    await ctx.reply(`\`${WEBHOOK_DOMAIN}/r/${partner.code}\``, { parse_mode: 'Markdown' });
  } else if (action === 'refresh') {
    await ctx.answerCbQuery('Обновлено ✅');
    await ctx.reply(`📊 Статистика:
├ Всего: ${partner.totalClicks}
├ WhatsApp: ${partner.whatsappClicks}
└ Telegram: ${partner.telegramClicks}`);
  }
});

// === WEB ROUTES ===

// Webhook endpoint
app.use(bot.webhookCallback('/webhook'));

// Главная страница
app.get('/', (req, res) => {
  res.send(`
    <h1>SHIBA CARS Partner System</h1>
    <p>Бот: @SHIBA_CARS_PARTNERS_BOT</p>
    <p>Статус: ✅ Работает через webhook</p>
  `);
});

// Партнерская ссылка
app.get('/r/:code', (req, res) => {
  const { code } = req.params;
  
  // Находим партнера по коду
  let partner = null;
  for (const [id, p] of partners) {
    if (p.code === code) {
      partner = p;
      partner.totalClicks++;
      break;
    }
  }
  
  console.log(`📱 Переход по ссылке: ${code} (${partner ? 'найден' : 'не найден'})`);
  
  res.render('landing', {
    title: 'SHIBA CARS - Аренда премиальных авто',
    subtitle: 'Свяжитесь с нами удобным способом',
    clickId: Date.now(),
    partnerCode: code,
    whatsappNumber: '79001234567', // Замените на ваш номер
    telegramBot: 'SHIBA_CARS_BOT', // Замените на вашего бота
    whatsappMessage: 'Здравствуйте! Интересует аренда авто.',
    telegramMessage: 'start'
  });
});

// API для отслеживания
app.post('/api/redirect', express.json(), (req, res) => {
  const { clickId, type } = req.body;
  
  // Обновляем статистику
  for (const [id, partner] of partners) {
    // В реальности нужно связать clickId с партнером
    if (type === 'whatsapp') {
      partner.whatsappClicks++;
    } else if (type === 'telegram') {
      partner.telegramClicks++;
    }
    break;
  }
  
  console.log(`🔄 Редирект на ${type}`);
  res.json({ success: true });
});

app.post('/api/track-view', (req, res) => {
  console.log('👁 Просмотр страницы');
  res.json({ success: true });
});

// === ЗАПУСК ===

async function launch() {
  try {
    // Устанавливаем webhook
    await bot.telegram.setWebhook(`${WEBHOOK_DOMAIN}/webhook`);
    
    // Запускаем сервер
    app.listen(PORT, () => {
      console.log(`✅ Сервер запущен на порту ${PORT}`);
      console.log(`🔗 Webhook URL: ${WEBHOOK_DOMAIN}/webhook`);
      console.log(`📱 Бот: @SHIBA_CARS_PARTNERS_BOT`);
      console.log(`🌐 Откройте: ${WEBHOOK_DOMAIN}`);
    });
    
  } catch (error) {
    console.error('Ошибка запуска:', error);
  }
}

launch();