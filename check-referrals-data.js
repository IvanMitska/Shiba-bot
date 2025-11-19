require('dotenv').config();
const { sequelize, Partner, Click } = require('./src/database/models');
const { Op } = require('sequelize');

async function checkReferralsData() {
  try {
    console.log('\n=== ПРОВЕРКА ДАННЫХ РЕФЕРАЛОВ ===\n');

    // 1. Найдем партнера Ivan
    const partner = await Partner.findOne({
      where: {
        [Op.or]: [
          { username: 'IVMO' },
          { firstName: 'Ivan' },
          { uniqueCode: 'a9T8-OYH' }
        ]
      }
    });

    if (!partner) {
      console.log('❌ Партнер не найден');
      return;
    }

    console.log('✅ Найден партнер:');
    console.log(`   ID: ${partner.id}`);
    console.log(`   Username: ${partner.username}`);
    console.log(`   Код: ${partner.uniqueCode}`);
    console.log(`   Telegram ID: ${partner.telegramId}`);

    // 2. Проверим все клики партнера
    const allClicks = await Click.findAll({
      where: { partnerId: partner.id },
      order: [['clickedAt', 'DESC']],
      limit: 10
    });

    console.log(`\n📊 Всего кликов у партнера: ${allClicks.length}`);

    // 3. Проверим клики с telegramUserId
    const clicksWithTelegram = await Click.findAll({
      where: {
        partnerId: partner.id,
        telegramUserId: { [Op.not]: null }
      }
    });

    console.log(`\n📱 Кликов с Telegram User ID: ${clicksWithTelegram.length}`);

    // 4. Покажем структуру нескольких кликов
    if (allClicks.length > 0) {
      console.log('\n🔍 Пример структуры кликов:');
      allClicks.slice(0, 3).forEach((click, index) => {
        console.log(`\nКлик ${index + 1}:`);
        console.log(`   ID: ${click.id}`);
        console.log(`   Redirect Type: ${click.redirectType || 'null'}`);
        console.log(`   Telegram User ID: ${click.telegramUserId || 'null'}`);
        console.log(`   Telegram Username: ${click.telegramUsername || 'null'}`);
        console.log(`   IP Hash: ${click.ipHash}`);
        console.log(`   Device: ${click.deviceType}`);
        console.log(`   Дата: ${click.clickedAt}`);
      });
    }

    // 5. Проверим, какие поля есть в таблице clicks
    const clicksTableInfo = await sequelize.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'clicks'",
      { type: sequelize.QueryTypes.SELECT }
    ).catch(() => null);

    if (clicksTableInfo) {
      console.log('\n📋 Структура таблицы clicks:');
      const relevantColumns = clicksTableInfo.filter(col =>
        col.column_name.includes('telegram') ||
        col.column_name.includes('user')
      );
      relevantColumns.forEach(col => {
        console.log(`   ${col.column_name}: ${col.data_type}`);
      });
    }

    // 6. Диагностика проблемы
    console.log('\n🔧 ДИАГНОСТИКА:');
    if (clicksWithTelegram.length === 0) {
      console.log('❌ Проблема: Нет кликов с telegramUserId');
      console.log('   Это означает, что рефералы не записываются через Telegram');
      console.log('   Метод getPartnerReferrals фильтрует по telegramUserId != null');
      console.log('\n📌 РЕШЕНИЕ:');
      console.log('   1. Нужно изменить логику фильтрации в getPartnerReferrals');
      console.log('   2. Или убедиться, что telegramUserId записывается при переходах');
    } else {
      console.log('✅ Есть клики с Telegram данными');
    }

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

checkReferralsData();