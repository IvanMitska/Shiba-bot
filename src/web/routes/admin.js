const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { Partner, Click, Admin, Settings, sequelize } = require('../../database/models');
const { Op } = require('sequelize');
const logger = require('../../utils/logger');

// Admin login endpoint - MUST be before auth middleware
router.post('/login', async (req, res) => {
  try {
    const { secretKey } = req.body;
    const adminSecret = process.env.ADMIN_SECRET || 'shibo-admin-2024';

    if (secretKey !== adminSecret) {
      return res.status(401).json({ error: 'Invalid secret key' });
    }

    // Find the first active admin (or create one if doesn't exist)
    let admin = await Admin.findOne({ where: { isActive: true } });

    if (!admin) {
      return res.status(404).json({ error: 'No active admin found' });
    }

    const token = jwt.sign(
      { adminId: admin.id, type: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    await admin.updateLastLogin();

    logger.info(`Admin ${admin.id} logged in`);

    res.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        role: admin.role,
        permissions: admin.permissions
      }
    });
  } catch (error) {
    logger.error('Admin login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

const adminAuthMiddleware = async (req, res, next) => {
  try {
    if (req.userType !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const admin = await Admin.findByPk(req.adminId);
    if (!admin || !admin.isActive) {
      return res.status(403).json({ error: 'Admin not found or inactive' });
    }
    
    req.admin = admin;
    await admin.updateLastLogin();
    next();
  } catch (error) {
    logger.error('Admin auth error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
};

router.use(adminAuthMiddleware);

router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalPartners,
      activePartners,
      totalClicks,
      todayClicks
    ] = await Promise.all([
      Partner.count(),
      Partner.count({ where: { isActive: true } }),
      Click.count(),
      Click.count({
        where: {
          clickedAt: {
            [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      })
    ]);
    
    res.json({
      totalPartners,
      activePartners,
      totalClicks,
      todayClicks
    });
  } catch (error) {
    logger.error('Error getting dashboard data:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/partners', async (req, res) => {
  try {
    if (!req.admin.hasPermission('viewPartners')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    const { limit = 50, offset = 0, search = '', status = 'all' } = req.query;
    
    const where = {};
    
    if (search) {
      where[Op.or] = [
        { username: { [Op.iLike]: `%${search}%` } },
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }
    
    const partners = await Partner.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    const total = await Partner.count({ where });
    
    res.json({
      partners,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    logger.error('Error getting partners:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/partners/:id', async (req, res) => {
  try {
    if (!req.admin.hasPermission('viewPartners')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    const partner = await Partner.findByPk(req.params.id, {
      include: [
        {
          model: Click,
          as: 'clicks',
          limit: 10,
          order: [['clickedAt', 'DESC']]
        }
      ]
    });
    
    if (!partner) {
      return res.status(404).json({ error: 'Partner not found' });
    }
    
    res.json(partner);
  } catch (error) {
    logger.error('Error getting partner details:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/partners/:id', async (req, res) => {
  try {
    if (!req.admin.hasPermission('managePartners')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    const { isActive } = req.body;
    const partner = await Partner.findByPk(req.params.id);
    
    if (!partner) {
      return res.status(404).json({ error: 'Partner not found' });
    }
    
    await partner.update({ isActive });
    
    logger.info(`Partner ${partner.id} ${isActive ? 'activated' : 'deactivated'} by admin ${req.admin.id}`);
    
    res.json({ success: true, partner });
  } catch (error) {
    logger.error('Error updating partner:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all clicks from all partners
router.get('/clicks', async (req, res) => {
  try {
    if (!req.admin.hasPermission('viewPartners')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { limit = 100, offset = 0, partnerId, startDate, endDate } = req.query;

    const where = {};

    if (partnerId) {
      where.partnerId = parseInt(partnerId);
    }

    if (startDate && endDate) {
      where.clickedAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const clicks = await Click.findAll({
      where,
      include: [{
        model: Partner,
        as: 'partner',
        attributes: ['id', 'username', 'firstName', 'lastName', 'uniqueCode']
      }],
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
    logger.error('Error getting all clicks:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/analytics', async (req, res) => {
  try {
    if (!req.admin.hasPermission('viewAnalytics')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    const endDate = new Date();

    // Get all clicks for the period
    const clicks = await Click.findAll({
      where: {
        clickedAt: {
          [Op.between]: [startDate, endDate]
        }
      },
      order: [['clickedAt', 'ASC']]
    });

    // Calculate stats in the same format as partner analytics
    const dailyStats = {};
    const hourlyStats = Array(24).fill(0);
    const deviceStats = {};
    const countryStats = {};
    const messengerStats = { whatsapp: 0, telegram: 0 };
    const ipHashes = new Set();

    clicks.forEach(click => {
      // Daily stats
      const day = click.clickedAt.toISOString().split('T')[0];
      dailyStats[day] = (dailyStats[day] || 0) + 1;

      // Hourly stats
      const hour = new Date(click.clickedAt).getHours();
      hourlyStats[hour]++;

      // Device stats
      if (click.deviceType) {
        deviceStats[click.deviceType] = (deviceStats[click.deviceType] || 0) + 1;
      }

      // Country stats
      if (click.country) {
        countryStats[click.country] = (countryStats[click.country] || 0) + 1;
      }

      // Messenger stats
      if (click.redirectType === 'whatsapp') {
        messengerStats.whatsapp++;
      } else if (click.redirectType === 'telegram') {
        messengerStats.telegram++;
      }

      // Unique visitors
      if (click.ipHash) {
        ipHashes.add(click.ipHash);
      }
    });

    const totalClicks = clicks.length;
    const uniqueVisitors = ipHashes.size;
    const conversions = messengerStats.whatsapp + messengerStats.telegram;
    const conversionRate = totalClicks > 0
      ? ((conversions / totalClicks) * 100).toFixed(2)
      : 0;

    // Get ALL partners for admin view
    const topPartners = await Partner.findAll({
      attributes: ['id', 'username', 'firstName', 'lastName', 'uniqueCode', 'totalClicks', 'uniqueVisitors'],
      order: [['totalClicks', 'DESC']]
    });

    res.json({
      dailyStats,
      hourlyStats,
      deviceStats,
      countryStats,
      messengerStats,
      conversionRate,
      totalClicks,
      uniqueVisitors,
      topPartners
    });
  } catch (error) {
    logger.error('Error getting analytics:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/settings', async (req, res) => {
  try {
    if (!req.admin.hasPermission('systemSettings')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    const settings = await Settings.findAll({
      order: [['category', 'ASC'], ['key', 'ASC']]
    });
    
    res.json(settings);
  } catch (error) {
    logger.error('Error getting settings:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/settings/:key', async (req, res) => {
  try {
    if (!req.admin.hasPermission('systemSettings')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    const { key } = req.params;
    const { value, type } = req.body;
    
    const setting = await Settings.setValue(key, value, type, req.admin.id);
    
    logger.info(`Setting ${key} updated by admin ${req.admin.id}`);
    
    res.json({ success: true, setting });
  } catch (error) {
    logger.error('Error updating setting:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;