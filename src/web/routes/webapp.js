const express = require('express');
const crypto = require('crypto');
const { Partner, Click } = require('../../database/models');
const { Op, Sequelize } = require('sequelize');
const router = express.Router();

// Middleware для проверки Telegram Web App данных
const validateTelegramWebAppData = (req, res, next) => {
  const initData = req.headers['x-telegram-init-data'];
  
  if (!initData && process.env.NODE_ENV === 'development') {
    // В режиме разработки пропускаем проверку
    next();
    return;
  }
  
  if (!initData) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Парсим данные
  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');
  urlParams.delete('hash');
  
  // Сортируем параметры
  const dataCheckString = Array.from(urlParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  // Проверяем подпись
  const secret = crypto
    .createHmac('sha256', 'WebAppData')
    .update(process.env.BOT_TOKEN || '')
    .digest();
  
  const signature = crypto
    .createHmac('sha256', secret)
    .update(dataCheckString)
    .digest('hex');
  
  if (signature !== hash && process.env.NODE_ENV !== 'development') {
    return res.status(401).json({ error: 'Invalid data' });
  }
  
  // Парсим user данные
  try {
    const userData = JSON.parse(urlParams.get('user'));
    req.telegramUser = userData;
    next();
  } catch (error) {
    return res.status(400).json({ error: 'Invalid user data' });
  }
};

// Получение данных партнера
router.get('/partner/:telegramId', validateTelegramWebAppData, async (req, res) => {
  try {
    const { telegramId } = req.params;
    
    const partner = await Partner.findOne({
      where: { telegramId },
      include: [{
        model: Click,
        as: 'clicks',
        limit: 10,
        order: [['createdAt', 'DESC']]
      }]
    });
    
    if (!partner) {
      return res.status(404).json({ error: 'Partner not found' });
    }
    
    // Получаем статистику
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayClicks = await Click.count({
      where: {
        partnerId: partner.id,
        createdAt: { [Op.gte]: today }
      }
    });
    
    const totalClicks = await Click.count({
      where: { partnerId: partner.id }
    });
    
    const whatsappClicks = await Click.count({
      where: {
        partnerId: partner.id,
        source: 'whatsapp'
      }
    });
    
    const telegramClicks = await Click.count({
      where: {
        partnerId: partner.id,
        source: 'telegram'
      }
    });
    
    const conversionRate = totalClicks > 0 ? 
      ((partner.conversions || 0) / totalClicks * 100).toFixed(1) : 0;
    
    const partnerData = {
      partnerId: partner.id,
      partnerLink: partner.getPartnerLink(),
      registrationDate: partner.createdAt,
      statistics: {
        todayClicks,
        totalClicks,
        whatsappClicks,
        telegramClicks,
        conversionRate,
        earnings: partner.earnings || 0
      },
      clicks: partner.clicks
    };
    
    res.json(partnerData);
  } catch (error) {
    console.error('Error fetching partner data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получение истории кликов
router.get('/partner/:telegramId/clicks', validateTelegramWebAppData, async (req, res) => {
  try {
    const { telegramId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    const partner = await Partner.findOne({
      where: { telegramId }
    });
    
    if (!partner) {
      return res.status(404).json({ error: 'Partner not found' });
    }
    
    const clicks = await Click.findAll({
      where: { partnerId: partner.id },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json(clicks);
  } catch (error) {
    console.error('Error fetching clicks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получение статистики за период
router.get('/partner/:telegramId/statistics', validateTelegramWebAppData, async (req, res) => {
  try {
    const { telegramId } = req.params;
    const { period = 'week' } = req.query;
    
    const partner = await Partner.findOne({
      where: { telegramId }
    });
    
    if (!partner) {
      return res.status(404).json({ error: 'Partner not found' });
    }
    
    let startDate = new Date();
    switch (period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }
    
    const clicks = await Click.findAll({
      where: {
        partnerId: partner.id,
        createdAt: { [Op.gte]: startDate }
      },
      attributes: [
        [Sequelize.fn('DATE', Sequelize.col('createdAt')), 'date'],
        [Sequelize.fn('COUNT', '*'), 'count'],
        'source'
      ],
      group: ['date', 'source'],
      order: [['date', 'ASC']]
    });
    
    res.json({
      period,
      startDate,
      data: clicks
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Обновление профиля партнера
router.put('/partner/:telegramId', validateTelegramWebAppData, async (req, res) => {
  try {
    const { telegramId } = req.params;
    const updates = req.body;
    
    const partner = await Partner.findOne({
      where: { telegramId }
    });
    
    if (!partner) {
      return res.status(404).json({ error: 'Partner not found' });
    }
    
    // Обновляем только разрешенные поля
    const allowedFields = ['notificationsEnabled', 'language'];
    const filteredUpdates = {};
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    }
    
    await partner.update(filteredUpdates);
    
    res.json({ success: true, partner });
  } catch (error) {
    console.error('Error updating partner:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;