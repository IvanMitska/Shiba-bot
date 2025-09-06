const express = require('express');
const router = express.Router();
const { Partner, Click, Admin, Settings, sequelize } = require('../../database/models');
const { Op } = require('sequelize');
const logger = require('../../utils/logger');

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

router.get('/analytics', async (req, res) => {
  try {
    if (!req.admin.hasPermission('viewAnalytics')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    const { days = 30 } = req.query;
    const startDate = new Date(new Date().setDate(new Date().getDate() - days));
    
    const [
      topPartners,
      clicksByDay,
      messengerStats,
      deviceStats
    ] = await Promise.all([
      Partner.findAll({
        attributes: ['id', 'username', 'firstName', 'totalClicks', 'uniqueVisitors'],
        order: [['totalClicks', 'DESC']],
        limit: 10
      }),
      
      Click.findAll({
        attributes: [
          [sequelize.fn('DATE', sequelize.col('clicked_at')), 'date'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where: {
          clickedAt: { [Op.gte]: startDate }
        },
        group: [sequelize.fn('DATE', sequelize.col('clicked_at'))],
        order: [[sequelize.fn('DATE', sequelize.col('clicked_at')), 'ASC']]
      }),
      
      Click.findAll({
        attributes: [
          'redirect_type',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where: {
          redirectType: { [Op.ne]: null }
        },
        group: ['redirect_type']
      }),
      
      Click.findAll({
        attributes: [
          'device_type',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where: {
          deviceType: { [Op.ne]: null }
        },
        group: ['device_type']
      })
    ]);
    
    res.json({
      topPartners,
      clicksByDay,
      messengerStats,
      deviceStats
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