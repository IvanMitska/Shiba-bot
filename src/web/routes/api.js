const express = require('express');
const router = express.Router();
const { Partner, Click, Settings } = require('../../database/models');
const { verifyWebAppToken } = require('../../bot/webApp');
const trackingService = require('../../services/tracking');
const { Op } = require('sequelize');
const { startOfDay, endOfDay, subDays, format } = require('date-fns');
const logger = require('../../utils/logger');
const crypto = require('crypto');

// Функция для проверки Telegram initData
const verifyTelegramWebAppData = (initData) => {
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');

    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    const secret = crypto
      .createHmac('sha256', 'WebAppData')
      .update(process.env.BOT_TOKEN)
      .digest();

    const calculatedHash = crypto
      .createHmac('sha256', secret)
      .update(dataCheckString)
      .digest('hex');

    if (calculatedHash === hash) {
      const user = JSON.parse(urlParams.get('user') || '{}');
      return user;
    }

    return null;
  } catch (error) {
    logger.error('Telegram data verification error:', error);
    return null;
  }
};

const authMiddleware = async (req, res, next) => {
  try {
    // Сначала пробуем JWT токен
    const token = req.headers.authorization?.split(' ')[1] || req.query.token;

    if (token && token.startsWith('ey')) { // JWT токены начинаются с 'ey'
      const decoded = verifyWebAppToken(token);

      if (decoded) {
        if (decoded.type === 'partner') {
          const partner = await Partner.findByPk(decoded.partnerId);
          if (!partner || !partner.isActive) {
            return res.status(403).json({ error: 'Partner not found or inactive' });
          }
          req.partner = partner;
          req.userType = 'partner';
          return next();
        } else if (decoded.type === 'admin') {
          req.adminId = decoded.adminId;
          req.userType = 'admin';
          return next();
        }
      }
    }

    // Если это не JWT, пробуем как Telegram initData
    if (token) {
      const telegramUser = verifyTelegramWebAppData(token);

      if (telegramUser && telegramUser.id) {
        // Находим или создаем партнера
        let partner = await Partner.findOne({
          where: { telegramId: telegramUser.id }
        });

        if (!partner) {
          // Создаем нового партнера
          partner = await Partner.create({
            telegramId: telegramUser.id,
            username: telegramUser.username,
            firstName: telegramUser.first_name,
            lastName: telegramUser.last_name
          });
        }

        if (!partner.isActive) {
          return res.status(403).json({ error: 'Partner account is inactive' });
        }

        req.partner = partner;
        req.userType = 'partner';
        return next();
      }
    }

    return res.status(401).json({ error: 'Invalid or missing authentication' });
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
};

router.use(authMiddleware);

router.get('/partner/info', async (req, res) => {
  try {
    if (req.userType !== 'partner') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const partner = req.partner;
    const partnerLink = partner.getPartnerLink();
    
    res.json({
      id: partner.id,
      uniqueCode: partner.uniqueCode,
      username: partner.username,
      firstName: partner.firstName,
      lastName: partner.lastName,
      partnerLink,
      totalClicks: partner.totalClicks,
      uniqueVisitors: partner.uniqueVisitors,
      whatsappClicks: partner.whatsappClicks,
      telegramClicks: partner.telegramClicks,
      createdAt: partner.createdAt
    });
  } catch (error) {
    logger.error('Error getting partner info:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/partner/stats', async (req, res) => {
  try {
    if (req.userType !== 'partner') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { period = 'week' } = req.query;
    const partnerId = req.partner.id;

    // Если запрашивают статистику за сегодня
    if (period === 'today') {
      const todayStart = startOfDay(new Date());
      const todayEnd = endOfDay(new Date());
      const yesterdayStart = startOfDay(subDays(new Date(), 1));
      const yesterdayEnd = endOfDay(subDays(new Date(), 1));

      const [todayClicks, yesterdayClicks] = await Promise.all([
        Click.count({
          where: {
            partnerId,
            clickedAt: { [Op.between]: [todayStart, todayEnd] }
          }
        }),
        Click.count({
          where: {
            partnerId,
            clickedAt: { [Op.between]: [yesterdayStart, yesterdayEnd] }
          }
        })
      ]);

      const [
        todayWhatsappClicks,
        todayTelegramClicks,
        yesterdayWhatsappClicks,
        yesterdayTelegramClicks
      ] = await Promise.all([
        Click.count({
          where: {
            partnerId,
            clickedAt: { [Op.between]: [todayStart, todayEnd] },
            redirectType: 'whatsapp'
          }
        }),
        Click.count({
          where: {
            partnerId,
            clickedAt: { [Op.between]: [todayStart, todayEnd] },
            redirectType: 'telegram'
          }
        }),
        Click.count({
          where: {
            partnerId,
            clickedAt: { [Op.between]: [yesterdayStart, yesterdayEnd] },
            redirectType: 'whatsapp'
          }
        }),
        Click.count({
          where: {
            partnerId,
            clickedAt: { [Op.between]: [yesterdayStart, yesterdayEnd] },
            redirectType: 'telegram'
          }
        })
      ]);

      // Уникальные посетители
      const todayUniqueVisitors = await Click.count({
        where: {
          partnerId,
          clickedAt: { [Op.between]: [todayStart, todayEnd] },
          isUnique: true
        }
      });

      const yesterdayUniqueVisitors = await Click.count({
        where: {
          partnerId,
          clickedAt: { [Op.between]: [yesterdayStart, yesterdayEnd] },
          isUnique: true
        }
      });

      // Вычисляем изменения в процентах
      const calculateChange = (today, yesterday) => {
        if (yesterday === 0) return today > 0 ? 100 : 0;
        return Math.round(((today - yesterday) / yesterday) * 100);
      };

      const changeStats = {
        totalClicksChange: calculateChange(todayClicks, yesterdayClicks),
        uniqueVisitorsChange: calculateChange(todayUniqueVisitors, yesterdayUniqueVisitors),
        whatsappClicksChange: calculateChange(todayWhatsappClicks, yesterdayWhatsappClicks),
        telegramClicksChange: calculateChange(todayTelegramClicks, yesterdayTelegramClicks)
      };

      return res.json({
        data: {
          totalClicks: todayClicks,
          uniqueVisitors: todayUniqueVisitors,
          whatsappClicks: todayWhatsappClicks,
          telegramClicks: todayTelegramClicks,
          changeStats,
          recentClicks: []
        }
      });
    }

    const stats = await trackingService.getPartnerStats(partnerId, period);

    res.json(stats);
  } catch (error) {
    logger.error('Error getting partner stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/partner/clicks', async (req, res) => {
  try {
    if (req.userType !== 'partner') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const { limit = 50, offset = 0, startDate, endDate } = req.query;
    const partnerId = req.partner.id;
    
    const where = { partnerId };
    
    if (startDate && endDate) {
      where.clickedAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    const clicks = await Click.findAll({
      where,
      order: [['clickedAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    const total = await Click.count({ where });
    
    res.json({
      clicks,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    logger.error('Error getting partner clicks:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/partner/analytics', async (req, res) => {
  try {
    if (req.userType !== 'partner') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const { days = 7 } = req.query;
    const partnerId = req.partner.id;
    
    const startDate = subDays(new Date(), days);
    const endDate = new Date();
    
    const clicks = await Click.findAll({
      where: {
        partnerId,
        clickedAt: {
          [Op.between]: [startDate, endDate]
        }
      },
      order: [['clickedAt', 'ASC']]
    });
    
    const dailyStats = {};
    const hourlyStats = Array(24).fill(0);
    const deviceStats = {};
    const countryStats = {};
    const messengerStats = { whatsapp: 0, telegram: 0 };
    
    clicks.forEach(click => {
      const day = format(new Date(click.clickedAt), 'yyyy-MM-dd');
      const hour = new Date(click.clickedAt).getHours();
      
      dailyStats[day] = (dailyStats[day] || 0) + 1;
      hourlyStats[hour]++;
      
      if (click.deviceType) {
        deviceStats[click.deviceType] = (deviceStats[click.deviceType] || 0) + 1;
      }
      
      if (click.country) {
        countryStats[click.country] = (countryStats[click.country] || 0) + 1;
      }
      
      if (click.redirectType === 'whatsapp') {
        messengerStats.whatsapp++;
      } else if (click.redirectType === 'telegram') {
        messengerStats.telegram++;
      }
    });
    
    const conversionRate = clicks.length > 0
      ? ((messengerStats.whatsapp + messengerStats.telegram) / clicks.length * 100).toFixed(2)
      : 0;
    
    res.json({
      dailyStats,
      hourlyStats,
      deviceStats,
      countryStats,
      messengerStats,
      conversionRate,
      totalClicks: clicks.length,
      uniqueVisitors: new Set(clicks.map(c => c.ipHash)).size
    });
  } catch (error) {
    logger.error('Error getting analytics:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/settings/public', async (req, res) => {
  try {
    const settings = await Settings.getPublicSettings();
    res.json(settings);
  } catch (error) {
    logger.error('Error getting public settings:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;