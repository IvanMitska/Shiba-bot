# Настройка домена shiba-cars-phuket.com в Namecheap для Railway

## Шаг 1: Получите данные от Railway

1. Откройте https://railway.app/dashboard
2. Выберите проект `shibo-tg`
3. Перейдите в **Settings** → **Networking**
4. В разделе **Public Networking** нажмите **Add Domain**
5. Введите `shiba-cars-phuket.com`
6. Railway покажет вам CNAME значение (что-то вроде `shibo-tg.up.railway.app`)

## Шаг 2: Настройка DNS в Namecheap

1. Войдите в [Namecheap](https://www.namecheap.com)
2. Перейдите в **Domain List**
3. Найдите `shiba-cars-phuket.com` и нажмите **Manage**
4. Выберите **Advanced DNS**

### Удалите стандартные записи:
- Удалите все существующие записи типа A, CNAME (кроме email если используете)

### Добавьте новые записи:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| CNAME | @ | shibo-tg.up.railway.app | Automatic |
| CNAME | www | shibo-tg.up.railway.app | Automatic |

**Важно:** Используйте точное значение, которое показал Railway!

## Шаг 3: Установка переменных окружения в Railway

1. В Railway откройте проект
2. Перейдите в **Variables**
3. Добавьте следующие переменные:

```
LANDING_DOMAIN=https://shiba-cars-phuket.com
JWT_SECRET=shiba_phuket_secret_2024_change_this_random_string_xyz123
```

## Шаг 4: Проверка

### DNS проверка (подождите 5-30 минут):
```bash
nslookup shiba-cars-phuket.com
# Должен показать CNAME на Railway
```

### Проверка работы сайта:
1. Откройте https://shiba-cars-phuket.com/health
   - Должен показать JSON со статусом "ok"

2. Проверьте партнерскую ссылку:
   - https://shiba-cars-phuket.com/r/TEST123
   - Должна открыться страница лендинга

## Шаг 5: SSL сертификат

Railway автоматически выпустит SSL сертификат через Let's Encrypt после подключения домена.

## Возможные проблемы:

### "Domain not verified" в Railway:
- Подождите 10-30 минут для распространения DNS
- Проверьте правильность CNAME записей

### Сайт не открывается:
1. Проверьте DNS: `dig shiba-cars-phuket.com`
2. Убедитесь что в Railway домен показывает статус "Active"
3. Проверьте логи в Railway

### Ошибка SSL:
- Подождите до 1 часа после подключения домена
- Railway автоматически выпустит сертификат

## После успешной настройки:

Партнерские ссылки будут выглядеть так:
```
https://shiba-cars-phuket.com/r/ABC12345
```

Где ABC12345 - уникальный код партнера.

## Поддержка

- Railway Dashboard: https://railway.app/dashboard
- Namecheap Support: https://www.namecheap.com/support/
- Проверка DNS: https://dnschecker.org/