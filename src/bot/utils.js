const { Click } = require('../database/models');
const { Op } = require('sequelize');
const { startOfDay, endOfDay } = require('date-fns');

const formatPartnerStats = async (partner) => {
  const today = new Date();
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);
  
  const todayClicks = await Click.count({
    where: {
      partnerId: partner.id,
      clickedAt: {
        [Op.between]: [todayStart, todayEnd]
      }
    }
  });
  
  const todayWhatsApp = await Click.count({
    where: {
      partnerId: partner.id,
      redirectType: 'whatsapp',
      clickedAt: {
        [Op.between]: [todayStart, todayEnd]
      }
    }
  });
  
  const todayTelegram = await Click.count({
    where: {
      partnerId: partner.id,
      redirectType: 'telegram',
      clickedAt: {
        [Op.between]: [todayStart, todayEnd]
      }
    }
  });
  
  return `📊 Статистика:
├ Сегодня переходов: ${todayClicks}
├ WhatsApp: ${todayWhatsApp} | Telegram: ${todayTelegram}
└ Всего переходов: ${partner.totalClicks}`;
};

const formatNumber = (num) => {
  return new Intl.NumberFormat('ru-RU').format(num);
};

const getUniqueVisitorHash = (ipAddress, userAgent) => {
  const crypto = require('crypto');
  return crypto
    .createHash('sha256')
    .update(`${ipAddress}:${userAgent}`)
    .digest('hex');
};

const parseUserAgent = (userAgentString) => {
  // Simplified UA parser - in production use ua-parser-js package
  const result = {
    browser: 'Unknown',
    browserVersion: '',
    os: 'Unknown',
    osVersion: '',
    device: 'desktop',
    deviceVendor: '',
    deviceModel: ''
  };
  
  if (!userAgentString) return result;
  
  // Detect browser
  if (userAgentString.includes('Chrome')) {
    result.browser = 'Chrome';
  } else if (userAgentString.includes('Firefox')) {
    result.browser = 'Firefox';
  } else if (userAgentString.includes('Safari')) {
    result.browser = 'Safari';
  } else if (userAgentString.includes('Edge')) {
    result.browser = 'Edge';
  }
  
  // Detect OS
  if (userAgentString.includes('Windows')) {
    result.os = 'Windows';
  } else if (userAgentString.includes('Mac')) {
    result.os = 'macOS';
  } else if (userAgentString.includes('Linux')) {
    result.os = 'Linux';
  } else if (userAgentString.includes('Android')) {
    result.os = 'Android';
  } else if (userAgentString.includes('iOS') || userAgentString.includes('iPhone')) {
    result.os = 'iOS';
  }
  
  // Detect device type
  if (userAgentString.includes('Mobile')) {
    result.device = 'mobile';
  } else if (userAgentString.includes('Tablet')) {
    result.device = 'tablet';
  }
  
  return result;
};

const getClientIP = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.connection.remoteAddress || req.socket.remoteAddress || req.ip;
};

const extractUTMParams = (query) => {
  const utmParams = {};
  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  
  utmKeys.forEach(key => {
    if (query[key]) {
      const camelKey = key.replace('utm_', 'utm').replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      utmParams[camelKey] = query[key];
    }
  });
  
  return utmParams;
};

module.exports = {
  formatPartnerStats,
  formatNumber,
  getUniqueVisitorHash,
  parseUserAgent,
  getClientIP,
  extractUTMParams
};