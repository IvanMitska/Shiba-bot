require('dotenv').config();
const { Partner, Click, sequelize } = require('./src/database/models');

async function analyzeRailwayDatabase() {
  console.log('\n=== АНАЛИЗ БАЗЫ ДАННЫХ RAILWAY ===\n');

  // Показать к какой БД подключаемся
  console.log('DATABASE_URL:', process.env.DATABASE_URL ?
    process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':***@') : 'Not set');

  try {
    // 1. Проверка подключения
    const [dbInfo] = await sequelize.query("SELECT current_database(), version()");
    console.log('\n✅ Подключено к базе:', dbInfo[0].current_database);
    console.log('PostgreSQL версия:', dbInfo[0].version.split(',')[0]);

    // 2. Проверка всех партнеров и их ссылок
    console.log('\n=== ВСЕ ПАРТНЕРЫ И ИХ ССЫЛКИ ===\n');

    const partners = await Partner.findAll({
      order: [['id', 'ASC']]
    });

    console.log(`Всего партнеров в БД: ${partners.length}\n`);

    partners.forEach((partner, index) => {
      console.log(`${index + 1}. Партнер #${partner.id}:`);
      console.log(`   Telegram ID: ${partner.telegramId}`);
      console.log(`   Username: ${partner.username || 'не указан'}`);
      console.log(`   Имя: ${partner.firstName || ''} ${partner.lastName || ''}`);
      console.log(`   Код: ${partner.uniqueCode}`);
      console.log(`   Ссылка: ${partner.getPartnerLink()}`);
      console.log(`   Активен: ${partner.isActive ? 'ДА' : 'НЕТ'}`);
      console.log(`   Клики (в записи партнера): ${partner.totalClicks}`);
      console.log(`   WhatsApp клики: ${partner.whatsappClicks}`);
      console.log(`   Telegram клики: ${partner.telegramClicks}`);
      console.log(`   Создан: ${partner.createdAt}`);
      console.log(`   Обновлен: ${partner.updatedAt}`);
      console.log('');
    });

    // 3. Проверка кликов для каждого партнера
    console.log('=== ПРОВЕРКА КЛИКОВ ===\n');

    for (const partner of partners) {
      const actualClicks = await Click.count({
        where: { partnerId: partner.id }
      });

      const landingClicks = await Click.count({
        where: { partnerId: partner.id, redirectType: 'landing' }
      });

      const whatsappClicks = await Click.count({
        where: { partnerId: partner.id, redirectType: 'whatsapp' }
      });

      const telegramClicks = await Click.count({
        where: { partnerId: partner.id, redirectType: 'telegram' }
      });

      console.log(`Партнер ${partner.username || partner.telegramId} (код: ${partner.uniqueCode}):`);
      console.log(`  Кликов в таблице clicks: ${actualClicks}`);
      console.log(`  - Landing: ${landingClicks}`);
      console.log(`  - WhatsApp: ${whatsappClicks}`);
      console.log(`  - Telegram: ${telegramClicks}`);
      console.log(`  Кликов в записи партнера: ${partner.totalClicks}`);

      if (actualClicks !== partner.totalClicks) {
        console.log(`  ⚠️ ВНИМАНИЕ: Несоответствие! В clicks: ${actualClicks}, в partner: ${partner.totalClicks}`);
      } else {
        console.log(`  ✅ Счетчики синхронизированы`);
      }
      console.log('');
    }

    // 4. Проверка структуры таблицы clicks
    console.log('=== СТРУКТУРА ТАБЛИЦЫ CLICKS ===\n');

    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'clicks'
      ORDER BY ordinal_position;
    `);

    console.log('Колонки в таблице clicks:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // 5. Проверка последних кликов
    console.log('\n=== ПОСЛЕДНИЕ 10 КЛИКОВ ===\n');

    const recentClicks = await Click.findAll({
      order: [['clickedAt', 'DESC']],
      limit: 10,
      include: [{
        model: Partner,
        as: 'partner',
        attributes: ['username', 'uniqueCode']
      }]
    });

    if (recentClicks.length > 0) {
      recentClicks.forEach((click, index) => {
        console.log(`${index + 1}. Клик #${click.id}:`);
        console.log(`   Время: ${click.clickedAt}`);
        console.log(`   Партнер: ${click.partner?.username || 'N/A'} (${click.partner?.uniqueCode || 'N/A'})`);
        console.log(`   Тип: ${click.redirectType}`);
        console.log(`   Браузер: ${click.browser}`);
        console.log(`   Страна: ${click.country || 'не определено'}`);
        console.log(`   Город: ${click.city || 'не определено'}`);
        console.log('');
      });
    } else {
      console.log('Кликов пока нет');
    }

    // 6. Проверка целостности данных
    console.log('=== ПРОВЕРКА ЦЕЛОСТНОСТИ ДАННЫХ ===\n');

    // Проверка уникальности кодов
    const [duplicateCodes] = await sequelize.query(`
      SELECT unique_code, COUNT(*) as count
      FROM partners
      GROUP BY unique_code
      HAVING COUNT(*) > 1
    `);

    if (duplicateCodes.length > 0) {
      console.log('❌ НАЙДЕНЫ ДУБЛИКАТЫ КОДОВ:');
      duplicateCodes.forEach(dup => {
        console.log(`  Код ${dup.unique_code}: ${dup.count} раз`);
      });
    } else {
      console.log('✅ Все коды партнеров уникальны');
    }

    // Проверка орфанов (клики без партнера)
    const [orphanClicks] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM clicks c
      LEFT JOIN partners p ON c.partner_id = p.id
      WHERE p.id IS NULL
    `);

    if (orphanClicks[0].count > 0) {
      console.log(`❌ Найдено ${orphanClicks[0].count} кликов без партнера`);
    } else {
      console.log('✅ Все клики связаны с партнерами');
    }

    // 7. Статистика базы данных
    console.log('\n=== ОБЩАЯ СТАТИСТИКА ===\n');

    const totalPartners = await Partner.count();
    const activePartners = await Partner.count({ where: { isActive: true } });
    const totalClicks = await Click.count();
    const uniqueVisitors = await Click.count({
      distinct: true,
      col: 'ipHash'
    });

    console.log(`Всего партнеров: ${totalPartners}`);
    console.log(`Активных партнеров: ${activePartners}`);
    console.log(`Всего кликов: ${totalClicks}`);
    console.log(`Уникальных посетителей: ${uniqueVisitors}`);

    // Распределение кликов по типам
    const [clickTypes] = await sequelize.query(`
      SELECT redirect_type, COUNT(*) as count
      FROM clicks
      GROUP BY redirect_type
      ORDER BY count DESC
    `);

    console.log('\nРаспределение кликов по типам:');
    clickTypes.forEach(type => {
      console.log(`  ${type.redirect_type || 'не указан'}: ${type.count}`);
    });

  } catch (error) {
    console.error('❌ Ошибка при анализе БД:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

analyzeRailwayDatabase();