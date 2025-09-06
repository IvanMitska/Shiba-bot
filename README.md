# Shibo TG - Система отслеживания партнеров для аренды транспорта

## 🚀 Описание

Telegram бот с web-приложением для отслеживания клиентов, которые пришли от партнеров в бизнесе аренды транспорта. Система позволяет партнерам получать уникальные ссылки, отслеживать переходы и анализировать статистику.

## ✨ Основные возможности

### Для партнеров:
- 🔗 Уникальная партнерская ссылка
- 📊 Детальная статистика переходов
- 📈 Аналитика с графиками
- 📱 Отслеживание выбора мессенджера (WhatsApp/Telegram)
- 🌍 География переходов
- 📋 История всех кликов

### Для администраторов:
- 👥 Управление партнерами
- 📊 Общая системная аналитика
- ⚙️ Настройки системы
- 🔐 Контроль доступа

## 🛠 Технологии

- **Backend:** Node.js, Express, Telegraf
- **Frontend:** React, Tailwind CSS, Chart.js
- **Database:** PostgreSQL, Sequelize ORM
- **Cache:** Redis
- **Deploy:** Docker, Docker Compose

## 📦 Установка

### Требования
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker и Docker Compose (опционально)

### Локальная установка

1. Клонируйте репозиторий:
```bash
git clone https://github.com/yourusername/shibo-tg.git
cd shibo-tg
```

2. Установите зависимости:
```bash
npm install
cd webapp && npm install
cd ..
```

3. Создайте файл `.env` на основе `.env.example`:
```bash
cp .env.example .env
```

4. Настройте переменные окружения в `.env`:
```env
BOT_TOKEN=your_bot_token_from_botfather
WHATSAPP_NUMBER=79001234567
TELEGRAM_COMPANY_BOT=your_company_bot
DATABASE_URL=postgresql://user:password@localhost:5432/shibo_tg
DOMAIN=https://yourdomain.com
JWT_SECRET=your_secret_key
```

5. Создайте базу данных PostgreSQL:
```bash
createdb shibo_tg
```

6. Соберите React приложение:
```bash
cd webapp && npm run build
cd ..
```

7. Запустите приложение:
```bash
npm start
```

### Установка через Docker

1. Клонируйте репозиторий и настройте `.env` файл

2. Запустите через Docker Compose:
```bash
docker-compose up -d
```

3. Проверьте логи:
```bash
docker-compose logs -f app
```

## 🚀 Деплой на продакшн

### Настройка сервера

1. Установите Docker и Docker Compose на сервер

2. Настройте Nginx для проксирования:
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

3. Настройте SSL через Let's Encrypt:
```bash
certbot --nginx -d yourdomain.com
```

4. Настройте webhook для Telegram бота:
```bash
curl -F "url=https://yourdomain.com/webhook" \
     https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook
```

## 📱 Использование

### Для партнеров

1. Найдите бота в Telegram: `@your_bot_username`
2. Отправьте команду `/start`
3. Получите уникальную партнерскую ссылку
4. Нажмите "Открыть панель" для доступа к статистике
5. Делитесь ссылкой с потенциальными клиентами

### Для клиентов

1. Переходят по партнерской ссылке
2. Выбирают удобный мессенджер (WhatsApp или Telegram)
3. Связываются с компанией для аренды транспорта

## 🔧 API Endpoints

### Публичные
- `GET /r/:code` - Переход по партнерской ссылке
- `POST /api/redirect` - Отслеживание выбора мессенджера

### Для партнеров (требуется токен)
- `GET /api/partner/info` - Информация о партнере
- `GET /api/partner/stats` - Статистика переходов
- `GET /api/partner/clicks` - История кликов
- `GET /api/partner/analytics` - Аналитика с графиками

### Для администраторов
- `GET /api/admin/dashboard` - Общая статистика
- `GET /api/admin/partners` - Список партнеров
- `PATCH /api/admin/partners/:id` - Управление партнером
- `GET /api/admin/analytics` - Системная аналитика

## 📊 Структура базы данных

### Partners
- Хранит информацию о партнерах
- Уникальный код для ссылки
- Счетчики переходов

### Clicks
- Детальная информация о каждом переходе
- IP, User-Agent, геолокация
- UTM метки
- Выбранный мессенджер

### Admins
- Администраторы системы
- Роли и права доступа

### Settings
- Системные настройки
- Тексты сообщений
- Конфигурация

## 🐛 Отладка

### Просмотр логов
```bash
# Docker
docker-compose logs -f app

# Локально
tail -f logs/combined.log
```

### Проверка базы данных
```bash
docker-compose exec postgres psql -U postgres -d shibo_tg
```

### Сброс базы данных
```bash
# Остановите приложение
# Измените в src/index.js: syncDatabase(true)
# Запустите и остановите
# Верните обратно: syncDatabase(false)
```

## 📝 Лицензия

MIT

## 👥 Поддержка

Telegram: @yourusername
Email: your@email.com

## 🤝 Вклад в проект

Приветствуются pull requests. Для больших изменений сначала откройте issue для обсуждения.

## 🔄 Обновления

### v1.0.0 (2024)
- Базовый функционал
- Telegram бот
- Web-приложение для партнеров
- Система отслеживания
- Админ панель