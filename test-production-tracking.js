const axios = require('axios');

async function testProductionTracking() {
  console.log('\n=== ТЕСТИРОВАНИЕ PRODUCTION ТРЕКИНГА ===\n');
  console.log('Лендинг: https://shiba-cars-phuket.com');
  console.log('Бэкенд: https://shibo-tg-backend-production.up.railway.app');

  const partnerCode = 'a9T8-OYH';

  try {
    // 1. Проверим доступность Railway API
    console.log('\n1. Проверка Railway API...');
    try {
      const healthResponse = await axios.get('https://shibo-tg-backend-production.up.railway.app/health');
      console.log('   ✅ Railway API доступен:', healthResponse.data);
    } catch (error) {
      console.log('   ❌ Railway API недоступен:', error.message);
    }

    // 2. Проверим партнерскую ссылку на Netlify
    console.log('\n2. Проверка лендинга на Netlify...');
    const landingUrl = `https://shiba-cars-phuket.com/r/${partnerCode}`;
    console.log(`   URL: ${landingUrl}`);

    try {
      const landingResponse = await axios.get(landingUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        maxRedirects: 0,
        validateStatus: (status) => status < 500
      });

      console.log(`   Статус: ${landingResponse.status}`);

      if (landingResponse.status === 200) {
        console.log('   ✅ Лендинг загружен');

        // Проверим, есть ли трекинг скрипт
        if (landingResponse.data.includes('trackRedirect')) {
          console.log('   ✅ Трекинг скрипт найден');

          // Проверим URL для API запросов
          const apiUrlMatch = landingResponse.data.match(/fetch\(['"]([^'"]+\/api\/redirect)['"]/);
          if (apiUrlMatch) {
            console.log(`   📝 API URL в скрипте: ${apiUrlMatch[1]}`);
          } else {
            console.log('   ⚠️ API URL не найден в скрипте');
          }
        } else {
          console.log('   ❌ Трекинг скрипт НЕ найден!');
        }
      } else if (landingResponse.status === 404) {
        console.log('   ❌ Страница не найдена (404)');
        console.log('   ℹ️ Netlify возвращает статическую страницу вместо трекинга');
      }
    } catch (error) {
      console.log('   ❌ Ошибка при загрузке лендинга:', error.message);
    }

    // 3. Проверим, может ли Netlify отправлять данные на Railway
    console.log('\n3. Тест отправки данных с Netlify на Railway...');

    const railwayApiUrl = 'https://shibo-tg-backend-production.up.railway.app/api/redirect';
    console.log(`   URL: ${railwayApiUrl}`);

    try {
      const testData = {
        partnerCode: partnerCode,
        type: 'whatsapp'
      };

      const response = await axios.post(railwayApiUrl, testData, {
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://shiba-cars-phuket.com',
          'Referer': `https://shiba-cars-phuket.com/r/${partnerCode}`
        }
      });

      console.log(`   ✅ Запрос успешен (статус: ${response.status})`);
      console.log('   Ответ:', response.data);
    } catch (error) {
      console.log(`   ❌ Ошибка отправки: ${error.message}`);
      if (error.response) {
        console.log('   Статус:', error.response.status);
        console.log('   Данные:', error.response.data);

        if (error.response.status === 403 || error.response.status === 401) {
          console.log('\n   ⚠️ CORS проблема! Railway блокирует запросы с Netlify');
        }
      }
    }

    // 4. Проверим статистику в Railway БД
    console.log('\n4. Проверка статистики в Railway БД...');

    require('dotenv').config();
    const { Partner, Click, sequelize } = require('./src/database/models');

    const partner = await Partner.findOne({
      where: { uniqueCode: partnerCode }
    });

    if (partner) {
      const totalClicks = await Click.count({
        where: { partnerId: partner.id }
      });

      const whatsappClicks = await Click.count({
        where: {
          partnerId: partner.id,
          redirectType: 'whatsapp'
        }
      });

      console.log(`   Партнер: ${partner.username}`);
      console.log(`   Всего кликов в БД: ${totalClicks}`);
      console.log(`   WhatsApp кликов в БД: ${whatsappClicks}`);
    }

    await sequelize.close();

    // 5. Диагностика
    console.log('\n=== ДИАГНОСТИКА ===\n');
    console.log('Возможные проблемы:');
    console.log('1. Netlify возвращает статическую HTML страницу вместо обработки на Railway');
    console.log('2. CORS блокирует запросы с Netlify на Railway');
    console.log('3. Трекинг скрипт не может найти правильный API URL');
    console.log('4. Railway webhook не работает правильно');

    console.log('\n📌 РЕШЕНИЕ:');
    console.log('Нужно чтобы ссылки /r/:code обрабатывались на Railway, а не на Netlify!');
    console.log('Варианты:');
    console.log('1. Настроить редирект с Netlify на Railway для /r/* путей');
    console.log('2. Использовать Railway домен напрямую для партнерских ссылок');

  } catch (error) {
    console.error('\n❌ Общая ошибка:', error.message);
  }
}

testProductionTracking();