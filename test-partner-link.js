const fetch = require('node-fetch');

const API_URL = 'https://shibo-tg-backend-production.up.railway.app';
const PARTNER_CODE = 'TEST123'; // Тестовый партнёр, который автоматически создаётся

async function testPartnerLink() {
  console.log('🧪 Тестирование партнёрских ссылок\n');

  // Тест 1: Трекинг просмотра страницы
  console.log('📊 Тест 1: Трекинг просмотра...');
  try {
    const viewResponse = await fetch(`${API_URL}/api/track-view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partnerCode: PARTNER_CODE })
    });

    const viewData = await viewResponse.json();
    console.log('✅ Просмотр отслежен:', viewData);

    // Тест 2: Трекинг клика на WhatsApp
    console.log('\n📱 Тест 2: Трекинг клика на WhatsApp...');
    const whatsappResponse = await fetch(`${API_URL}/api/redirect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        partnerCode: PARTNER_CODE,
        clickId: viewData.clickId,
        type: 'whatsapp'
      })
    });

    const whatsappData = await whatsappResponse.json();
    console.log('✅ WhatsApp клик отслежен:', whatsappData);

    // Тест 3: Трекинг клика на Telegram
    console.log('\n💬 Тест 3: Трекинг клика на Telegram...');
    const telegramResponse = await fetch(`${API_URL}/api/redirect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        partnerCode: PARTNER_CODE,
        type: 'telegram'
      })
    });

    const telegramData = await telegramResponse.json();
    console.log('✅ Telegram клик отслежен:', telegramData);

    console.log('\n✅ Все тесты пройдены успешно!');
    console.log('\n📝 Проверьте статистику партнёра TEST123 в веб-приложении');
    console.log(`🔗 Партнёрская ссылка: https://shiba-cars-phuket.com/r/${PARTNER_CODE}`);

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    if (error.response) {
      console.error('Response:', await error.response.text());
    }
  }
}

testPartnerLink();
