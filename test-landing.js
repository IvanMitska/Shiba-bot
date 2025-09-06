const express = require('express');
const path = require('path');

const app = express();

// Настройка EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/web/views'));

// Тестовый роут для лендинга
app.get('/r/:code', (req, res) => {
  const { code } = req.params;
  
  console.log(`📱 Переход по партнерской ссылке: ${code}`);
  
  // Рендерим лендинг страницу
  res.render('landing', {
    title: 'SHIBA CARS - Аренда премиальных авто',
    subtitle: 'Свяжитесь с нами удобным способом',
    clickId: Math.random().toString(36).substring(7),
    partnerCode: code,
    whatsappNumber: '79001234567', // Замените на ваш номер
    telegramBot: 'SHIBA_CARS_BOT', // Замените на вашего бота
    whatsappMessage: 'Здравствуйте! Интересует аренда авто. Пришел от партнера.',
    telegramMessage: 'Здравствуйте! Интересует аренда авто.'
  });
});

// Главная страница
app.get('/', (req, res) => {
  res.send(`
    <h1>SHIBA CARS Partner System</h1>
    <p>Тестовая страница системы партнеров</p>
    <h2>Тестовые ссылки:</h2>
    <ul>
      <li><a href="/r/TEST123">Партнерская ссылка TEST123</a></li>
      <li><a href="/r/DEMO456">Партнерская ссылка DEMO456</a></li>
    </ul>
    <h2>Информация о боте:</h2>
    <ul>
      <li>Username: @SHIBA_CARS_PARTNERS_BOT</li>
      <li>Статус: ⚠️ Требуется webhook или VPN для работы</li>
    </ul>
  `);
});

// API роуты для лендинга
app.post('/api/redirect', (req, res) => {
  console.log('🔄 Редирект:', req.body);
  res.json({ success: true });
});

app.post('/api/track-view', (req, res) => {
  console.log('👁 Просмотр страницы:', req.body);
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Сервер запущен на порту ${PORT}`);
  console.log(`🌐 Откройте: http://localhost:${PORT}`);
  console.log(`📱 Тестовая партнерская ссылка: http://localhost:${PORT}/r/TEST123`);
});