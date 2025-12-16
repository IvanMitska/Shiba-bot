require('dotenv').config();
const { sequelize, Partner, Click } = require('./src/database/models');

async function createTestClick() {
  try {
    console.log('\n=== СОЗДАНИЕ ТЕСТОВОГО КЛИКА ===\n');

    // Найдем партнера
    const partner = await Partner.findOne({
      where: { uniqueCode: 'a9T8-OYH' }
    });

    if (!partner) {
      console.log('❌ Партнер не найден');
      return;
    }

    console.log(`✅ Найден партнер: ${partner.username} (ID: ${partner.id})`);

    // Создаем тестовый клик
    const testClick = await Click.create({
      partnerId: partner.id,
      ipAddress: '192.168.1.1',
      ipHash: 'test-hash-' + Date.now(),
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      deviceType: 'mobile',
      browser: 'Safari',
      os: 'iOS',
      country: 'Russia',
      city: 'Moscow',
      redirectType: 'whatsapp',
      clickedAt: new Date(),
      sessionId: 'test-session-' + Date.now(),
      isUnique: true,
      // Telegram данные пока оставляем пустыми
      telegramUserId: null,
      telegramUsername: null
    });

    console.log('\n✅ Тестовый клик создан:');
    console.log(`   ID: ${testClick.id}`);
    console.log(`   Device: ${testClick.deviceType}`);
    console.log(`   Type: ${testClick.redirectType}`);
    console.log(`   Date: ${testClick.clickedAt}`);

    // Обновляем статистику партнера
    await partner.increment('totalClicks');
    await partner.increment('whatsappClicks');

    console.log('\n📊 Статистика партнера обновлена');

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await sequelize.close();
  }
}

createTestClick();