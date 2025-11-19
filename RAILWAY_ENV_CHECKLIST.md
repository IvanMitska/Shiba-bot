# Railway Environment Variables Checklist

## ✅ Переменные для shibo-tg-backend

Скопируйте эти переменные в Railway:
**shibo-tg-backend → Settings → Variables**

```bash
# КРИТИЧЕСКИ ВАЖНО - База данных Postgres-iHNJ
DATABASE_URL=postgresql://postgres:ZxemkhLdljubZNdEprJrCAckOMcfMmCO@gondola.proxy.rlwy.net:13802/railway

# Режим production
NODE_ENV=production

# Токен бота
BOT_TOKEN=8326608021:AAHT1G8YOVAq_RfWiq2m6NGnbRyAx9fhKDU

# JWT секрет (должен совпадать с локальным)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Домен лендинга
LANDING_DOMAIN=https://shiba-cars-phuket.com

# URL webapp
WEBAPP_URL=https://shibo-tg-backend-production.up.railway.app/telegram-webapp

# Контактные данные
WHATSAPP_NUMBER=66959657805
TELEGRAM_COMPANY_BOT=ShibaCars_Phuket
```

## 🔧 Как правильно установить DATABASE_URL

### Если переменная уже существует (reference variable):

1. **Нажмите на три точки** (...) справа от DATABASE_URL
2. **Выберите "Remove"** или "Delete"
3. **Подтвердите удаление**
4. **Нажмите "+ New Variable"**
5. **Name:** `DATABASE_URL`
6. **Value:** `postgresql://postgres:ZxemkhLdljubZNdEprJrCAckOMcfMmCO@gondola.proxy.rlwy.net:13802/railway`
7. **Нажмите "Add"**

### Если переменная имеет иконку базы данных:

1. **Кликните на переменную DATABASE_URL**
2. **Ищите кнопку "Override" или "Edit"**
3. **Вставьте новое значение**
4. **Сохраните**

## ✅ Проверка после установки

### 1. Проверьте uptime (должен перезапуститься):
```bash
curl -s https://shibo-tg-backend-production.up.railway.app/health | grep uptime
```
Uptime должен быть < 2 минут

### 2. Проверьте партнерский трекинг:
```bash
curl https://shibo-tg-backend-production.up.railway.app/r/a9T8-OYH
```
Должен вернуть HTML страницу (НЕ "Произошла ошибка")

### 3. Проверьте запись клика:
- Откройте https://shiba-cars-phuket.com/r/a9T8-OYH
- Нажмите WhatsApp
- Проверьте статистику в Telegram боте

## ❌ Частые ошибки

1. **Внутренний URL не работает** - используйте только gondola.proxy.rlwy.net
2. **Переменная не обновляется** - удалите и создайте заново
3. **Сервис не перезапускается** - Railway должен показать "Deploying..."

## 📊 После успешной настройки

Вы должны увидеть:
- ✅ Партнерские ссылки работают
- ✅ WhatsApp клики записываются
- ✅ Статистика отображается в webapp
- ✅ Telegram бот показывает актуальные данные
