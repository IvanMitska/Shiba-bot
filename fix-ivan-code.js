require('dotenv').config();
const { Partner, Click, sequelize } = require('./src/database/models');

async function fixIvanCode() {
  console.log('\n=== ИСПРАВЛЕНИЕ КОДА ПАРТНЕРА IVAN ===\n');

  try {
    // 1. Найдем аккаунт Ivan
    const ivan = await Partner.findOne({
      where: { telegramId: '1734337242' }
    });

    if (!ivan) {
      console.log('❌ Партнер Ivan не найден');
      return;
    }

    console.log('Текущая информация:');
    console.log(`  ID: ${ivan.id}`);
    console.log(`  Telegram ID: ${ivan.telegramId}`);
    console.log(`  Username: ${ivan.username}`);
    console.log(`  Текущий код: ${ivan.uniqueCode}`);
    console.log(`  Ссылка: ${ivan.getPartnerLink()}`);

    // 2. Проверим, существует ли код a9T8-OYH
    const existingPartner = await Partner.findOne({
      where: { uniqueCode: 'a9T8-OYH' }
    });

    if (existingPartner) {
      console.log(`\n⚠️ Код a9T8-OYH уже существует у партнера:`);
      console.log(`  Username: ${existingPartner.username}`);
      console.log(`  Telegram ID: ${existingPartner.telegramId}`);

      // Если это тоже Ivan, просто удалим дубликат
      if (existingPartner.telegramId === ivan.telegramId) {
        console.log('\n✅ Это дубликат того же аккаунта');
      } else {
        console.log('\n❌ Это другой партнер! Не можем использовать этот код.');
        return;
      }
    }

    // 3. Обновим код на a9T8-OYH
    const newCode = 'a9T8-OYH';
    console.log(`\nОбновляем код на: ${newCode}`);

    await ivan.update({ uniqueCode: newCode });
    console.log('✅ Код обновлен!');

    // Проверим
    await ivan.reload();
    console.log('\nНовая информация:');
    console.log(`  Новый код: ${ivan.uniqueCode}`);
    console.log(`  Новая ссылка: ${ivan.getPartnerLink()}`);

    // 4. Проверим статистику
    const clicks = await Click.count({
      where: { partnerId: ivan.id }
    });

    const whatsappClicks = await Click.count({
      where: {
        partnerId: ivan.id,
        redirectType: 'whatsapp'
      }
    });

    console.log('\nСтатистика:');
    console.log(`  Всего кликов: ${clicks}`);
    console.log(`  WhatsApp кликов: ${whatsappClicks}`);

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await sequelize.close();
  }
}

fixIvanCode();