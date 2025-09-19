require('dotenv').config();
const { Partner, Click } = require('./src/database/models');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

async function addTestData() {
  try {
    console.log('Adding test data...');

    // Создаем тестового партнера
    let partner = await Partner.findOne({
      where: { telegramId: 123456789 }
    });

    if (!partner) {
      partner = await Partner.create({
        telegramId: 123456789,
        username: 'test_partner',
        firstName: 'Тест',
        lastName: 'Партнер',
        uniqueCode: 'TEST123',
        isActive: true
      });
      console.log('✅ Test partner created');
    }

    // Создаем тестовые клики за разные дни
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    const testClicks = [
      // Сегодня - 15 кликов
      ...Array(8).fill().map((_, i) => ({
        partnerId: partner.id,
        ipAddress: `192.168.1.${100 + i}`,
        ipHash: crypto.createHash('sha256').update(`192.168.1.${100 + i}`).digest('hex'),
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        deviceType: 'mobile',
        browser: 'Safari',
        os: 'iOS',
        country: 'Thailand',
        region: 'Phuket',
        city: 'Phuket',
        timezone: 'Asia/Bangkok',
        redirectType: 'whatsapp',
        clickedAt: new Date(now.getTime() - i * 2 * 60 * 60 * 1000), // Разное время в течение дня
        sessionId: uuidv4(),
        isUnique: i < 5, // Первые 5 уникальные
        metadata: {}
      })),
      ...Array(7).fill().map((_, i) => ({
        partnerId: partner.id,
        ipAddress: `10.0.0.${50 + i}`,
        ipHash: crypto.createHash('sha256').update(`10.0.0.${50 + i}`).digest('hex'),
        userAgent: 'Mozilla/5.0 (Linux; Android 10)',
        deviceType: 'mobile',
        browser: 'Chrome',
        os: 'Android',
        country: 'Russia',
        region: 'Moscow',
        city: 'Moscow',
        timezone: 'Europe/Moscow',
        redirectType: 'telegram',
        clickedAt: new Date(now.getTime() - i * 1.5 * 60 * 60 * 1000),
        sessionId: uuidv4(),
        isUnique: i < 3, // Первые 3 уникальные
        metadata: {}
      })),

      // Вчера - 10 кликов
      ...Array(6).fill().map((_, i) => ({
        partnerId: partner.id,
        ipAddress: `172.16.0.${20 + i}`,
        ipHash: crypto.createHash('sha256').update(`172.16.0.${20 + i}`).digest('hex'),
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_0 like Mac OS X)',
        deviceType: 'mobile',
        browser: 'Safari',
        os: 'iOS',
        country: 'Thailand',
        region: 'Phuket',
        city: 'Patong',
        timezone: 'Asia/Bangkok',
        redirectType: 'whatsapp',
        clickedAt: new Date(yesterday.getTime() - i * 2 * 60 * 60 * 1000),
        sessionId: uuidv4(),
        isUnique: i < 4,
        metadata: {}
      })),
      ...Array(4).fill().map((_, i) => ({
        partnerId: partner.id,
        ipAddress: `192.168.2.${10 + i}`,
        ipHash: crypto.createHash('sha256').update(`192.168.2.${10 + i}`).digest('hex'),
        userAgent: 'Mozilla/5.0 (Linux; Android 9)',
        deviceType: 'mobile',
        browser: 'Chrome',
        os: 'Android',
        country: 'United States',
        region: 'California',
        city: 'Los Angeles',
        timezone: 'America/Los_Angeles',
        redirectType: 'telegram',
        clickedAt: new Date(yesterday.getTime() - i * 3 * 60 * 60 * 1000),
        sessionId: uuidv4(),
        isUnique: i < 2,
        metadata: {}
      })),

      // Позавчера - 12 кликов
      ...Array(12).fill().map((_, i) => ({
        partnerId: partner.id,
        ipAddress: `203.0.113.${i + 1}`,
        ipHash: crypto.createHash('sha256').update(`203.0.113.${i + 1}`).digest('hex'),
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        deviceType: 'desktop',
        browser: 'Chrome',
        os: 'Windows',
        country: 'Germany',
        region: 'Berlin',
        city: 'Berlin',
        timezone: 'Europe/Berlin',
        redirectType: i % 2 === 0 ? 'whatsapp' : 'telegram',
        clickedAt: new Date(twoDaysAgo.getTime() - i * 1 * 60 * 60 * 1000),
        sessionId: uuidv4(),
        isUnique: i < 8,
        metadata: {}
      }))
    ];

    // Удаляем старые тестовые данные
    await Click.destroy({
      where: { partnerId: partner.id }
    });

    // Добавляем новые данные
    await Click.bulkCreate(testClicks);

    // Обновляем счетчики партнера
    const totalClicks = testClicks.length;
    const uniqueVisitors = testClicks.filter(c => c.isUnique).length;
    const whatsappClicks = testClicks.filter(c => c.redirectType === 'whatsapp').length;
    const telegramClicks = testClicks.filter(c => c.redirectType === 'telegram').length;

    await partner.update({
      totalClicks,
      uniqueVisitors,
      whatsappClicks,
      telegramClicks
    });

    console.log(`✅ Added ${testClicks.length} test clicks`);
    console.log(`📊 Statistics:`);
    console.log(`   - Total clicks: ${totalClicks}`);
    console.log(`   - Unique visitors: ${uniqueVisitors}`);
    console.log(`   - WhatsApp clicks: ${whatsappClicks}`);
    console.log(`   - Telegram clicks: ${telegramClicks}`);
    console.log(`   - Today: ${testClicks.filter(c => c.clickedAt >= new Date(now.getFullYear(), now.getMonth(), now.getDate())).length}`);
    console.log(`   - Yesterday: ${testClicks.filter(c => c.clickedAt >= new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()) && c.clickedAt < new Date(now.getFullYear(), now.getMonth(), now.getDate())).length}`);

  } catch (error) {
    console.error('Error adding test data:', error);
  }

  process.exit(0);
}

addTestData();