# Настройка базы данных

## Проблема с датой регистрации

**ИСПРАВЛЕНО**: Проблема была в том, что бот каждый раз при вызове `/start` обновлял пользователя, что приводило к изменению поля `updated_at`. Теперь обновление происходит только при реальных изменениях данных.

## Переход на PostgreSQL (Railway)

### 1. Текущее состояние
- Локально используется SQLite (`database.sqlite`)
- На Railway должен использоваться PostgreSQL
- Переменная `DATABASE_URL` определяет тип базы данных

### 2. Настройка PostgreSQL на Railway

#### Шаг 1: Добавить PostgreSQL сервис
1. Войти в Railway dashboard
2. Открыть проект `shibo-tg-backend`
3. Нажать "Add Service" → "Database" → "PostgreSQL"
4. Дождаться создания базы данных

#### Шаг 2: Получить строку подключения
1. Открыть PostgreSQL сервис
2. Перейти в "Variables"
3. Скопировать значение `DATABASE_URL`

#### Шаг 3: Настроить переменные окружения
В Railway dashboard для основного сервиса:
```
DATABASE_URL=postgresql://user:password@host:port/database
```

### 3. Миграция данных

Для переноса данных из SQLite в PostgreSQL:

```bash
# 1. Убедиться что локально есть данные в SQLite
ls -la database.sqlite

# 2. Обновить POSTGRES_URL в скрипте миграции
nano scripts/migrate-to-postgres.js

# 3. Запустить миграцию
node scripts/migrate-to-postgres.js
```

### 4. Проверка работы

#### Локально (с SQLite):
```bash
# DATABASE_URL закомментирован в .env
npm start
```

#### На Railway (с PostgreSQL):
```bash
# DATABASE_URL установлен в переменных окружения
# Автоматически при деплое
```

### 5. Структура базы данных

#### Таблица `partners`:
- `id` - автоинкремент ID
- `telegram_id` - ID пользователя в Telegram
- `username` - имя пользователя в Telegram
- `first_name` - имя
- `last_name` - фамилия
- `unique_code` - уникальный код партнера
- `is_active` - активен ли партнер
- `total_clicks` - общее количество кликов
- `unique_visitors` - уникальные посетители
- `whatsapp_clicks` - клики по WhatsApp
- `telegram_clicks` - клики по Telegram
- `last_activity_at` - последняя активность
- `metadata` - дополнительные данные (JSON)
- `created_at` - дата создания (**НЕ ДОЛЖНА МЕНЯТЬСЯ**)
- `updated_at` - дата последнего обновления

#### Таблица `clicks`:
- `id` - автоинкремент ID
- `partner_id` - ID партнера
- `ip_hash` - хеш IP адреса
- `user_agent` - браузер пользователя
- `referer` - источник перехода
- `country` - страна
- `city` - город
- `redirect_type` - тип перехода (whatsapp/telegram)
- `clicked_at` - время клика
- `utm_source`, `utm_medium`, `utm_campaign` - UTM метки
- `metadata` - дополнительные данные (JSON)
- `created_at`, `updated_at` - служебные поля

### 6. Исправления в коде

**Исправлено в `src/bot/bot.js:42-53`:**
```javascript
if (!created) {
  // Обновляем только если данные действительно изменились
  const updates = {};
  if (partner.username !== username) updates.username = username;
  if (partner.firstName !== first_name) updates.firstName = first_name;
  if (partner.lastName !== last_name) updates.lastName = last_name;

  // Обновляем только при наличии изменений
  if (Object.keys(updates).length > 0) {
    await partner.update(updates);
  }
}
```

Теперь `created_at` и `updated_at` будут корректными!