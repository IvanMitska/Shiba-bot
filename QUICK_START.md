# 🚀 БЫСТРЫЙ СТАРТ - SHIBA CARS Partner Bot

## ✅ Что уже работает

### 1. **Лендинг страница** (РАБОТАЕТ!)
- URL: **http://localhost:3000**
- Тестовые ссылки:
  - http://localhost:3000/r/TEST123
  - http://localhost:3000/r/DEMO456

### 2. **Telegram бот** (создан, но требует настройки)
- Username: **@SHIBA_CARS_PARTNERS_BOT**
- Токен: Сохранен в `.env`

## 🔴 Проблема
Telegram API заблокирован или недоступен для long polling соединения с вашей сети.

## ✅ РЕШЕНИЕ: Используйте ngrok

### Шаг 1: Установите ngrok
```bash
# macOS
brew install ngrok

# Или скачайте с сайта
# https://ngrok.com/download
```

### Шаг 2: Запустите ngrok
```bash
ngrok http 3000
```

### Шаг 3: Скопируйте HTTPS URL
Вы увидите что-то вроде:
```
Forwarding: https://abc123.ngrok.io -> http://localhost:3000
```

### Шаг 4: Обновите webhook-bot.js
Откройте файл `webhook-bot.js` и замените:
```javascript
const WEBHOOK_DOMAIN = 'https://abc123.ngrok.io'; // Ваш ngrok URL
```

### Шаг 5: Запустите бота с webhook
```bash
node webhook-bot.js
```

## 📱 Тестирование

1. Откройте Telegram
2. Найдите бота: **@SHIBA_CARS_PARTNERS_BOT**
3. Отправьте `/start`
4. Получите партнерскую ссылку
5. Перейдите по ссылке
6. Выберите WhatsApp или Telegram

## 🎯 Альтернативные варианты

### Вариант A: Используйте VPN
Если Telegram заблокирован, включите VPN и запустите:
```bash
node start-bot-simple.js
```

### Вариант B: Деплой на Heroku (бесплатно)
1. Создайте аккаунт на Heroku
2. Установите Heroku CLI
3. Выполните:
```bash
heroku create shiba-cars-bot
git init
git add .
git commit -m "Initial commit"
heroku git:remote -a shiba-cars-bot
git push heroku main
```

### Вариант C: Используйте Railway.app
1. Зайдите на https://railway.app
2. Подключите GitHub репозиторий
3. Деплой автоматический

## 📝 Важные файлы

- `test-landing.js` - Простой лендинг сервер (работает!)
- `webhook-bot.js` - Бот с webhook (требует ngrok)
- `start-bot-simple.js` - Простой бот (требует VPN)
- `.env` - Настройки (токен уже там)

## 🔧 Настройка номеров

Откройте `webhook-bot.js` и измените:
```javascript
whatsappNumber: '79001234567', // Ваш WhatsApp
telegramBot: 'SHIBA_CARS_BOT', // Ваш бот компании
```

## ⚡ Быстрый тест (без бота)

Лендинг уже работает! Просто откройте:
**http://localhost:3000**

## 🆘 Если ничего не помогает

1. Проверьте, доступен ли api.telegram.org:
```bash
curl https://api.telegram.org
```

2. Если недоступен - используйте VPN или прокси

3. Или разверните на внешнем сервере

## 📞 Контакты для помощи

Если нужна помощь с настройкой, обратитесь к разработчику.