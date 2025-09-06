# 🚀 Инструкция по запуску бота SHIBA CARS

## ⚠️ Проблема с запуском

Бот не может подключиться через long polling. Это может быть связано с:
1. Сетевыми ограничениями
2. Файрволом или VPN
3. Проблемами с прокси

## ✅ Решения

### Вариант 1: Использовать webhook (рекомендуется для production)

1. Вам нужен публичный HTTPS URL (можно использовать ngrok для теста)
2. Установите ngrok: `brew install ngrok` или скачайте с https://ngrok.com
3. Запустите ngrok: `ngrok http 3000`
4. Скопируйте HTTPS URL из ngrok
5. Обновите `.env`: `WEBHOOK_URL=https://your-ngrok-url.ngrok.io/webhook`
6. Запустите полное приложение: `npm start`

### Вариант 2: Использовать VPN или прокси

Если Telegram API заблокирован в вашей сети, используйте VPN.

### Вариант 3: Запустить на сервере

Разверните бота на VPS или облачном сервере (DigitalOcean, AWS, Heroku).

## 📱 Информация о боте

- **Username:** @SHIBA_CARS_PARTNERS_BOT
- **Имя:** SHIBA-CARS
- **ID:** 8326608021
- **Токен:** Сохранен в `.env`

## 🔧 Тестирование бота через API

Вы можете отправлять команды боту напрямую через API:

```bash
# Проверить статус бота
curl "https://api.telegram.org/bot8326608021:AAHT1G8YOVAq_RfWiq2m6NGnbRyAx9fhKDU/getMe"

# Получить обновления
curl "https://api.telegram.org/bot8326608021:AAHT1G8YOVAq_RfWiq2m6NGnbRyAx9fhKDU/getUpdates"

# Отправить сообщение (замените CHAT_ID на ваш ID)
curl -X POST "https://api.telegram.org/bot8326608021:AAHT1G8YOVAq_RfWiq2m6NGnbRyAx9fhKDU/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{"chat_id": "YOUR_CHAT_ID", "text": "Тест"}'
```

## 🎯 Что делать дальше

1. **Откройте Telegram** и найдите бота: @SHIBA_CARS_PARTNERS_BOT
2. **Отправьте /start** боту
3. **Получите партнерскую ссылку**
4. **Web App пока недоступен** (нужно развернуть React приложение)

## 💻 Локальная разработка

Для локальной разработки без бота:

1. Запустите только веб-сервер:
```bash
# Создайте файл test-server.js
node test-server.js
```

2. Откройте http://localhost:3000/r/TEST123 для проверки лендинга

## 📦 Docker запуск

Если polling не работает, используйте Docker с webhook:

```bash
docker-compose up -d
```

## 🆘 Поддержка

Если проблема сохраняется:
1. Проверьте логи: `tail -f logs/combined.log`
2. Проверьте сетевое подключение к api.telegram.org
3. Попробуйте использовать другую сеть или VPN
4. Разверните бота на внешнем сервере