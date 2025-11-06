require('dotenv').config();
const axios = require('axios');
const { Partner, Click, sequelize } = require('./src/database/models');

async function testLiveTracking() {
  console.log('\n=== ТЕСТИРОВАНИЕ ЗАПИСИ КЛИКОВ В RAILWAY БД ===\n');

  try {
    // Тестируем для каждого партнера
    const partners = await Partner.findAll({
      order: [['id', 'ASC']]
    });

    console.log('Тестируем клики для всех партнеров:\n');

    for (const partner of partners) {
      console.log(`\nТестируем партнера: ${partner.username} (${partner.uniqueCode})`);
      console.log('До теста:');
      console.log(`  Кликов в БД: ${partner.totalClicks}`);

      // Получаем количество кликов до теста
      const clicksBefore = await Click.count({
        where: { partnerId: partner.id }
      });

      // Симулируем клик
      const url = `http://localhost:3000/r/${partner.uniqueCode}`;

      try {
        const response = await axios.get(url, {
          headers: {
            'User-Agent': `Test-Bot-${Date.now()}`,
            'Accept': 'text/html'
          }
        });

        if (response.status === 200) {
          console.log(`  ✅ Страница загружена для ${partner.uniqueCode}`);

          // Ждем записи в БД
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Проверяем количество кликов после
          const clicksAfter = await Click.count({
            where: { partnerId: partner.id }
          });

          // Обновляем данные партнера
          await partner.reload();

          console.log('После теста:');
          console.log(`  Кликов в таблице clicks: ${clicksAfter} (было ${clicksBefore})`);
          console.log(`  Кликов в записи партнера: ${partner.totalClicks}`);

          if (clicksAfter > clicksBefore) {
            console.log(`  ✅ Клик записан успешно!`);

            // Получаем последний клик
            const lastClick = await Click.findOne({
              where: { partnerId: partner.id },
              order: [['clickedAt', 'DESC']]
            });

            if (lastClick) {
              console.log(`  📝 Детали клика #${lastClick.id}:`);
              console.log(`     - Время: ${lastClick.clickedAt}`);
              console.log(`     - User-Agent: ${lastClick.userAgent.substring(0, 30)}...`);
            }
          } else {
            console.log(`  ⚠️ Клик не записан`);
          }
        }
      } catch (error) {
        console.log(`  ❌ Ошибка при тесте: ${error.message}`);
      }
    }

    // Проверяем общую статистику
    console.log('\n=== ФИНАЛЬНАЯ СТАТИСТИКА ===\n');

    const totalClicks = await Click.count();
    const [stats] = await sequelize.query(`
      SELECT
        COUNT(*) as total,
        COUNT(DISTINCT partner_id) as partners_with_clicks,
        COUNT(DISTINCT ip_hash) as unique_visitors,
        MAX(clicked_at) as last_click
      FROM clicks
    `);

    console.log('Общая статистика БД:');
    console.log(`  Всего кликов: ${stats[0].total}`);
    console.log(`  Партнеров с кликами: ${stats[0].partners_with_clicks}`);
    console.log(`  Уникальных посетителей: ${stats[0].unique_visitors}`);
    console.log(`  Последний клик: ${stats[0].last_click}`);

    // Тестируем API веб-приложения
    console.log('\n=== ТЕСТИРОВАНИЕ WEB APP API ===\n');

    for (const partner of partners) {
      try {
        const apiUrl = `http://localhost:3000/api/webapp/partner/${partner.telegramId}`;
        const response = await axios.get(apiUrl, {
          headers: { 'X-Telegram-Init-Data': 'test' }
        });

        if (response.status === 200) {
          console.log(`${partner.username}:`);
          console.log(`  API статистика:`, response.data.statistics);
        }
      } catch (error) {
        if (error.response?.status === 401) {
          console.log(`${partner.username}: API требует авторизацию (это нормально)`);
        } else {
          console.log(`${partner.username}: Ошибка API - ${error.message}`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Ошибка теста:', error);
  } finally {
    await sequelize.close();
  }
}

testLiveTracking();