#!/bin/bash

echo "🚀 Установка зависимостей для Telegram Web App..."
npm install

echo "🔨 Сборка приложения..."
npm run build

echo "✅ Сборка завершена! Файлы находятся в папке build/"
echo "📱 Web App будет доступен по адресу: /telegram-webapp"