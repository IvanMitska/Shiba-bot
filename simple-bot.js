const { Telegraf } = require('telegraf');

// Токен бота
const BOT_TOKEN = '8326608021:AAHT1G8YOVAq_RfWiq2m6NGnbRyAx9fhKDU';

console.log('Создаем бота...');
const bot = new Telegraf(BOT_TOKEN);

// Обработка команды /start
bot.start((ctx) => {
  console.log('Получена команда /start от:', ctx.from.username || ctx.from.id);
  
  const message = `
👋 Добро пожаловать!

Это тестовое сообщение от бота.
Ваш ID: ${ctx.from.id}
Имя: ${ctx.from.first_name || 'Неизвестно'}
`;
  
  return ctx.reply(message);
});

// Обработка ошибок
bot.catch((err, ctx) => {
  console.error('Ошибка бота:', err);
  ctx.reply('Произошла ошибка!');
});

// Запуск бота
console.log('Запускаем бота...');
bot.launch()
  .then(() => {
    console.log('✅ Бот успешно запущен!');
    console.log('Найдите бота в Telegram и отправьте /start');
  })
  .catch((error) => {
    console.error('❌ Ошибка запуска бота:', error);
    process.exit(1);
  });

// Остановка бота при завершении процесса
process.once('SIGINT', () => {
  console.log('Останавливаем бота...');
  bot.stop('SIGINT');
});
process.once('SIGTERM', () => {
  console.log('Останавливаем бота...');
  bot.stop('SIGTERM');
});