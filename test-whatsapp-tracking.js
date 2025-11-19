const axios = require('axios');

async function testWhatsAppTracking() {
  console.log('\n=== ТЕСТИРОВАНИЕ WHATSAPP ТРЕКИНГА ===\n');

  const partnerCode = 'a9T8-OYH';
  const baseUrl = 'http://localhost:3000';

  try {
    // 1. Сначала симулируем визит на лендинг
    console.log('1. Симулируем переход по партнерской ссылке...');
    const landingUrl = `${baseUrl}/r/${partnerCode}`;

    const landingResponse = await axios.get(landingUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        'Accept': 'text/html',
        'Referer': 'https://google.com'
      }
    });

    console.log(`   ✅ Лендинг загружен (статус: ${landingResponse.status})`);

    // Проверим, что трекинг скрипт есть в ответе
    if (landingResponse.data.includes('partnerData')) {
      console.log('   ✅ Трекинг скрипт найден');
    }

    // Извлечем clickId из ответа (если есть)
    const clickIdMatch = landingResponse.data.match(/clickId:\s*'(\d+)'/);
    const clickId = clickIdMatch ? clickIdMatch[1] : null;
    console.log(`   📝 Click ID: ${clickId || 'не найден'}`);

    // Подождем немного
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 2. Теперь симулируем клик на WhatsApp
    console.log('\n2. Симулируем клик на WhatsApp кнопку...');

    const redirectUrl = `${baseUrl}/api/redirect`;
    console.log(`   URL: ${redirectUrl}`);

    const whatsappData = {
      partnerCode: partnerCode,
      clickId: clickId,
      type: 'whatsapp'
    };

    console.log('   Отправляемые данные:', whatsappData);

    try {
      const whatsappResponse = await axios.post(redirectUrl, whatsappData, {
        headers: {
          'Content-Type': 'application/json',
          'Referer': `${baseUrl}/r/${partnerCode}`
        }
      });

      console.log(`   ✅ WhatsApp редирект записан (статус: ${whatsappResponse.status})`);
      console.log('   Ответ:', whatsappResponse.data);
    } catch (error) {
      console.log(`   ❌ Ошибка записи WhatsApp клика: ${error.message}`);
      if (error.response) {
        console.log('   Статус:', error.response.status);
        console.log('   Данные:', error.response.data);
      }
    }

    // 3. Проверим статистику
    console.log('\n3. Проверяем статистику в БД...');

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

      const landingClicks = await Click.count({
        where: {
          partnerId: partner.id,
          redirectType: 'landing'
        }
      });

      console.log(`   Партнер: ${partner.username}`);
      console.log(`   Всего кликов: ${totalClicks}`);
      console.log(`   Landing кликов: ${landingClicks}`);
      console.log(`   WhatsApp кликов: ${whatsappClicks}`);
      console.log(`   WhatsApp в записи партнера: ${partner.whatsappClicks}`);

      // Получим последние клики
      const recentClicks = await Click.findAll({
        where: { partnerId: partner.id },
        order: [['clickedAt', 'DESC']],
        limit: 3,
        attributes: ['id', 'redirectType', 'clickedAt']
      });

      console.log('\n   Последние клики:');
      recentClicks.forEach(click => {
        console.log(`     #${click.id}: ${click.redirectType} - ${click.clickedAt}`);
      });
    }

    await sequelize.close();

  } catch (error) {
    console.error('\n❌ Ошибка теста:', error.message);
  }
}

testWhatsAppTracking();