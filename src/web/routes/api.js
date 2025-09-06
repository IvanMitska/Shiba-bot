const express = require('express');
const router = express.Router();
const { Partner, Click, Settings } = require('../../database/models');
const { verifyWebAppToken } = require('../../bot/webApp');
const trackingService = require('../../services/tracking');
const { Op } = require('sequelize');
const { startOfDay, endOfDay, subDays, format } = require('date-fns');
const logger = require('../../utils/logger');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.query.token;
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = verifyWebAppToken(token);
    
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    if (decoded.type === 'partner') {
      const partner = await Partner.findByPk(decoded.partnerId);
      if (!partner || !partner.isActive) {
        return res.status(403).json({ error: 'Partner not found or inactive' });
      }
      req.partner = partner;
      req.userType = 'partner';
    } else if (decoded.type === 'admin') {
      req.adminId = decoded.adminId;
      req.userType = 'admin';
    }
    
    next();
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