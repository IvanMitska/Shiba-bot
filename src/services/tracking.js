const { Partner, Click } = require('../database/models');
const { Op } = require('sequelize');
const geoip = require('geoip-lite');
const { parseUserAgent, getUniqueVisitorHash, extractUTMParams } = require('../bot/utils');
const logger = require('../utils/logger');

class TrackingService {
  async trackClick(partnerCode, requestData) {
    try {
      let partner = await Partner.findOne({
        where: { uniqueCode: partnerCode, isActive: true }
      });

      // Auto-create TEST123 partner for testing
      if (!partner && partnerCode === 'TEST123') {
        try {
          partner = await Partner.create({
            telegramId: 123456789,
            username: 'test_partner',
            firstName: 'Test',
            lastName: 'Partner',
            uniqueCode: 'TEST123',
            isActive: true,
            totalClicks: 0,
            uniqueVisitors: 0,
            whatsappClicks: 0,
            telegramClicks: 0
          });
          logger.info('Auto-created TEST123 partner for testing');
        } catch (createError) {
          // If TEST123 already exists but is inactive, activate it
          partner = await Partner.findOne({
            where: { uniqueCode: 'TEST123' }
          });
          if (partner) {
            await partner.update({ isActive: true });
            logger.info('Activated existing TEST123 partner');
          }
        }
      }

      if (!partner) {
        logger.warn(`Invalid partner code: ${partnerCode}`);
        return null;
      }
      
      const { ip, userAgent, referer, query, telegramUser } = requestData;
      const geo = geoip.lookup(ip) || {};
      const uaData = parseUserAgent(userAgent);
      const utmParams = extractUTMParams(query);
      const ipHash = getUniqueVisitorHash(ip, userAgent);

      const existingClick = await Click.findOne({
        where: {
          partnerId: partner.id,
          ipHash
        },
        order: [['clickedAt', 'DESC']]
      });

      const isUnique = !existingClick ||
        (new Date() - new Date(existingClick.clickedAt)) > 24 * 60 * 60 * 1000;

      const clickData = {
        partnerId: partner.id,
        ipAddress: this.anonymizeIP(ip),
        ipHash,
        userAgent,
        deviceType: uaData.device,
        browser: uaData.browser,
        os: uaData.os,
        referer,
        country: geo.country || null,
        region: geo.region || null,
        city: geo.city || null,
        timezone: geo.timezone || null,
        isUnique,
        redirectType: 'landing',
        sessionId: requestData.sessionId || null,
        ...utmParams,
        // Add Telegram user data if available
        telegramUserId: telegramUser?.id || null,
        telegramUsername: telegramUser?.username || null,
        telegramFirstName: telegramUser?.first_name || null,
        telegramLastName: telegramUser?.last_name || null,
        telegramPhotoUrl: telegramUser?.photo_url || null,
        telegramLanguageCode: telegramUser?.language_code || null,
        metadata: {
          browserVersion: uaData.browserVersion,
          osVersion: uaData.osVersion,
          deviceVendor: uaData.deviceVendor,
          deviceModel: uaData.deviceModel,
          ll: geo.ll || null
        }
      };
      
      const click = await Click.create(clickData);
      
      await partner.increment('totalClicks');
      if (isUnique) {
        await partner.increment('uniqueVisitors');
      }
      await partner.update({ lastActivityAt: new Date() });
      
      logger.info(`Click tracked for partner ${partner.id}: ${click.id}`);
      
      return { partner, click };
    } catch (error) {
      logger.error('Error tracking click:', error);
      throw error;
    }
  }
  
  async trackRedirect(clickId, redirectType) {
    try {
      const click = await Click.findByPk(clickId, {
        include: ['partner']
      });
      
      if (!click) {
        logger.warn(`Click not found: ${clickId}`);
        return false;
      }
      
      await click.update({ redirectType });
      
      const partner = click.partner;
      if (redirectType === 'whatsapp') {
        await partner.increment('whatsappClicks');
      } else if (redirectType === 'telegram') {
        await partner.increment('telegramClicks');
      }
      
      logger.info(`Redirect tracked: ${clickId} -> ${redirectType}`);
      
      return true;
    } catch (error) {
      logger.error('Error tracking redirect:', error);
      throw error;
    }
  }
  
  anonymizeIP(ip) {
    const parts = ip.split('.');
    if (parts.length === 4) {
      parts[3] = '0';
      return parts.join('.');
    }
    return ip;
  }
  
  async getPartnerStats(partnerId, period = 'all') {
    try {
      const where = { partnerId };
      
      if (period !== 'all') {
        const now = new Date();
        let startDate;
        
        switch (period) {
          case 'today':
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
          case 'week':
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
          case 'month':
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
          default:
            startDate = null;
        }
        
        if (startDate) {
          where.clickedAt = { [Op.gte]: startDate };
        }
      }
      
      const clicks = await Click.findAll({
        where,
        order: [['clickedAt', 'DESC']]
      });
      
      const stats = {
        totalClicks: clicks.length,
        uniqueVisitors: new Set(clicks.map(c => c.ipHash)).size,
        whatsappClicks: clicks.filter(c => c.redirectType === 'whatsapp').length,
        telegramClicks: clicks.filter(c => c.redirectType === 'telegram').length,
        landingViews: clicks.filter(c => c.redirectType === 'landing').length,
        devices: this.aggregateByField(clicks, 'deviceType'),
        browsers: this.aggregateByField(clicks, 'browser'),
        countries: this.aggregateByField(clicks, 'country'),
        utmSources: this.aggregateByField(clicks, 'utmSource'),
        recentClicks: clicks.slice(0, 10)
      };
      
      return stats;
    } catch (error) {
      logger.error('Error getting partner stats:', error);
      throw error;
    }
  }
  
  aggregateByField(clicks, field) {
    const result = {};
    clicks.forEach(click => {
      const value = click[field] || 'Unknown';
      result[value] = (result[value] || 0) + 1;
    });
    return Object.entries(result)
      .sort((a, b) => b[1] - a[1])
      .map(([key, value]) => ({ [field]: key, count: value }));
  }

  async getPartnerReferrals(partnerId, options = {}) {
    try {
      const { limit = 50, offset = 0, period = 'all' } = options;

      const where = {
        partnerId
        // Убрал фильтр по telegramUserId - показываем ВСЕ клики
      };

      if (period !== 'all') {
        const now = new Date();
        let startDate;

        switch (period) {
          case 'today':
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
          case 'week':
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
          case 'month':
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
          default:
            startDate = null;
        }

        if (startDate) {
          where.clickedAt = { [Op.gte]: startDate };
        }
      }

      const clicks = await Click.findAll({
        where,
        order: [['clickedAt', 'DESC']],
        limit,
        offset
      });

      const total = await Click.count({ where });

      // Format referrals data
      const referrals = clicks.map(click => ({
        id: click.id,
        userId: click.telegramUserId,
        username: click.telegramUsername,
        firstName: click.telegramFirstName,
        lastName: click.telegramLastName,
        photoUrl: click.telegramPhotoUrl,
        languageCode: click.telegramLanguageCode,
        clickedAt: click.clickedAt,
        redirectType: click.redirectType,
        country: click.country,
        city: click.city,
        deviceType: click.deviceType,
        browser: click.browser,
        os: click.os
      }));

      return {
        referrals,
        total,
        hasMore: offset + limit < total
      };
    } catch (error) {
      logger.error('Error getting partner referrals:', error);
      throw error;
    }
  }
}

module.exports = new TrackingService();