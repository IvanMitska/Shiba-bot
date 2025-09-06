# 🚀 Руководство по развертыванию Shibo Cars Bot

## 📋 Структура проекта

- **Основной бот и API** → Railway
- **Лендинг страница** → Netlify
- **База данных** → Railway PostgreSQL

## 1️⃣ Развертывание бота на Railway

### Шаг 1: Создайте аккаунт на Railway
1. Перейдите на [railway.app](https://railway.app)
2. Войдите через GitHub

### Шаг 2: Создайте новый проект
1. Нажмите "New Project"
2. Выберите "Deploy from GitHub repo"
3. Выберите ваш репозиторий `shibo-tg`

### Шаг 3: Добавьте PostgreSQL
1. В проекте нажмите "+ New"
2. Выберите "Database" → "Add PostgreSQL"
3. Railway автоматически создаст базу данных

### Шаг 4: Настройте переменные окружения
В настройках сервиса добавьте следующие переменные:

```env
# Telegram Bot
BOT_TOKEN=8326608021:AAHT1G8YOVAq_RfWiq2m6NGnbRyAx9fhKDU
BOT_USERNAME=SHIBA_CARS_PARTNERS_BOT

# Company Contact Details  
WHATSAPP_NUMBER=66959657805
TELEGRAM_COMPANY_BOT=ShibaCars_Phuket

# Application Settings
NODE_ENV=production
PORT=3000
DOMAIN=https://your-app-name.up.railway.app
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Database (Railway автоматически добавит DATABASE_URL)
# DATABASE_URL будет добавлен автоматически

# Optional
WEBAPP_URL=https://your-app-name.up.railway.app/webapp
LOG_LEVEL=info
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

### Шаг 5: Запустите деплой
1. Railway автоматически начнет деплой
2. Дождитесь завершения (3-5 минут)
3. Получите URL вашего приложения (например: `https://shibo-cars-bot.up.railway.app`)

## 2️⃣ Развертывание лендинга на Netlify

### Шаг 1: Создайте аккаунт на Netlify
1. Перейдите на [netlify.com](https://netlify.com)
2. Зарегистрируйтесь бесплатно

### Шаг 2: Подготовьте лендинг
1. В папке `netlify-landing` уже есть готовый лендинг
2. Обновите в файле `index.html` строку:
   ```javascript
   const API_URL = 'https://your-railway-app.up.railway.app';
   ```
   Замените на URL вашего Railway приложения

### Шаг 3: Загрузите на Netlify
1. Зайдите в [app.netlify.com](https://app.netlify.com)
2. Перетащите папку `netlify-landing` в область "drag and drop"
3. Netlify автоматически развернет сайт

### Шаг 4: Настройте домен (опционально)
1. В настройках сайта → Domain settings
2. Добавьте свой домен или используйте бесплатный от Netlify
3. Ваш лендинг будет доступен по адресу типа: `https://shibo-cars.netlify.app`

## 3️⃣ Финальная настройка

### Обновите DOMAIN в Railway
1. Вернитесь в Railway
2. В переменных окружения обновите:
   ```env
   DOMAIN=https://shibo-cars.netlify.app
   ```
   
### Проверьте работу системы
1. Откройте Telegram → `@SHIBA_CARS_PARTNERS_BOT`
2. Отправьте `/start`
3. Получите партнерскую ссылку
4. Откройте ссылку - должен открыться лендинг на Netlify
5. Нажмите на WhatsApp или Telegram
6. Проверьте статистику в боте

## 📊 Мониторинг

### Railway
- Логи: Railway Dashboard → Logs
- Метрики: Railway Dashboard → Metrics
- База данных: Railway Dashboard → PostgreSQL → Data

### Netlify
- Аналитика: Netlify Dashboard → Analytics
- Формы: Netlify Dashboard → Forms (если добавите)

## 🔧 Обновление

### Обновление бота (Railway)
```bash
git add .
git commit -m "Update bot"
git push origin main
```
Railway автоматически развернет обновления

### Обновление лендинга (Netlify)
1. Обновите файлы в `netlify-landing`
2. Перетащите папку снова в Netlify
3. Или настройте автодеплой через GitHub

## ⚠️ Важные моменты

1. **Безопасность**: Обязательно смените `JWT_SECRET` на продакшене
2. **SSL**: Railway и Netlify автоматически предоставляют HTTPS
3. **Лимиты**: На бесплатном плане Railway есть ограничения по времени работы
4. **База данных**: Регулярно делайте бэкапы через Railway Dashboard

## 🆘 Поддержка

Если возникли проблемы:
1. Проверьте логи в Railway Dashboard
2. Убедитесь, что все переменные окружения настроены правильно
3. Проверьте, что бот токен активен в @BotFather

## ✅ Чек-лист запуска

- [ ] Railway аккаунт создан
- [ ] Проект создан на Railway
- [ ] PostgreSQL добавлен
- [ ] Переменные окружения настроены
- [ ] Бот развернут и работает
- [ ] Netlify аккаунт создан
- [ ] Лендинг загружен на Netlify
- [ ] API_URL обновлен в лендинге
- [ ] DOMAIN обновлен в Railway
- [ ] Система протестирована

Успешного запуска! 🚀