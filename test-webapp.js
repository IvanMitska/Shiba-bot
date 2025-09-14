require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware для CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, X-Telegram-Init-Data');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});

// Статические файлы для Web App
app.use('/telegram-webapp', express.static(path.join(__dirname, 'telegram-webapp/build')));

// API endpoints для Web App
app.get('/api/webapp/partner/:telegramId', (req, res) => {
  const { telegramId } = req.params;
  
  // Моковые данные для тестирования
  res.json({
    partnerId: telegramId,
    partnerLink: `https://shiba-cars-partners.netlify.app/r/TEST${telegramId}`,
    registrationDate: new Date().toISOString(),
    statistics: {
      todayClicks: Math.floor(Math.random() * 20),
      totalClicks: Math.floor(Math.random() * 200),
      whatsappClicks: Math.floor(Math.random() * 100),
      telegramClicks: Math.floor(Math.random() * 100),
      conversionRate: (Math.random() * 20).toFixed(1),
      earnings: Math.floor(Math.random() * 5000)
    },
    clicks: []
  });
});

// Fallback для React Router
app.get('/telegram-webapp/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'telegram-webapp/build/index.html'));
});

// Простая HTML страница для тестирования
app.get('/test', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Test Telegram Web App</title>
      <script src="https://telegram.org/js/telegram-web-app.js"></script>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
        }
        .container {
          background: #f5f5f5;
          padding: 20px;
          border-radius: 10px;
        }
        button {
          background: #0088cc;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 16px;
        }
        button:hover {
          background: #0077bb;
        }
        iframe {
          width: 100%;
          height: 600px;
          border: 1px solid #ddd;
          border-radius: 10px;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Тестирование Telegram Web App</h1>
        <p>Нажмите кнопку ниже, чтобы открыть Web App в iframe:</p>
        <button onclick="openWebApp()">Открыть Web App</button>
        <div id="webapp-container"></div>
      </div>
      
      <script>
        function openWebApp() {
          const container = document.getElementById('webapp-container');
          container.innerHTML = '<iframe src="/telegram-webapp/" frameborder="0"></iframe>';
        }
      </script>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`
🚀 Тестовый сервер для Web App запущен!
   
📱 Откройте в браузере:
   http://localhost:${PORT}/test
   
🔧 API endpoint:
   http://localhost:${PORT}/api/webapp/partner/:telegramId
   
📊 Web App:
   http://localhost:${PORT}/telegram-webapp/
  `);
});