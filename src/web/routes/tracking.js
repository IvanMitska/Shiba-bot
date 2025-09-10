const express = require('express');
const router = express.Router();
const trackingService = require('../../services/tracking');
const { Settings } = require('../../database/models');
const { getClientIP } = require('../../bot/utils');
const logger = require('../../utils/logger');

router.get('/r/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const ip = getClientIP(req);
    const userAgent = req.headers['user-agent'] || '';
    const referer = req.headers['referer'] || '';
    
    const trackingData = {
      ip,
      userAgent,
      referer,
      query: req.query,
      sessionId: null // We don't use sessions anymore
    };
    
    const result = await trackingService.trackClick(code, trackingData);
    
    if (!result) {
      return res.status(404).send('Ссылка не найдена');
    }
    
    const { partner, click } = result;
    
    const [
      title,
      subtitle,
      whatsappMessage,
      telegramMessage
    ] = await Promise.all([
      Settings.getValue('landing_title', 'Аренда транспорта'),
      Settings.getValue('landing_subtitle', 'Свяжитесь с нами удобным способом'),
      Settings.getValue('whatsapp_message', 'Здравствуйте! Интересует аренда транспорта.'),
      Settings.getValue('telegram_message', 'Здравствуйте! Интересует аренда транспорта.')
    ]);
    
    res.render('landing', {
      title,
      subtitle,
      clickId: click.id,
      partnerCode: code,
      whatsappNumber: process.env.WHATSAPP_NUMBER,
      telegramBot: process.env.TELEGRAM_COMPANY_BOT,
      whatsappMessage,
      telegramMessage
    });
  } catch (error) {
    logger.error('Error in tracking route:', error);
    res.status(500).send('Произошла ошибка');
  }
});

router.post('/api/redirect', async (req, res) => {
  try {
    const { partnerCode, clickId, type } = req.body;
    
    // Support both old (clickId) and new (partnerCode) methods
    if (!type || (!clickId && !partnerCode)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required parameters' 
      });
    }
    
    // If we have partnerCode but no clickId, create a new click
    if (partnerCode && !clickId) {
      const ip = getClientIP(req);
      const userAgent = req.headers['user-agent'] || '';
      const referer = req.headers['referer'] || '';
      
      const trackingData = {
        ip,
        userAgent,
        referer,
        query: req.query,
        sessionId: null
      };
      
      const result = await trackingService.trackClick(partnerCode, trackingData);
      
      if (!result) {
        return res.status(404).json({ 
          success: false, 
          error: 'Partner not found' 
        });
      }
      
      // Now track the redirect
      const success = await trackingService.trackRedirect(result.click.id, type);
      
      logger.info(`Tracked ${type} click for partner code: ${partnerCode}`);
      res.json({ success });
    } else {
      // Old method with clickId
      const success = await trackingService.trackRedirect(clickId, type);
      res.json({ success });
    }
  } catch (error) {
    logger.error('Error tracking redirect:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

router.post('/api/track-view', async (req, res) => {
  try {
    const { partnerCode, clickId } = req.body;
    
    if (partnerCode) {
      const ip = getClientIP(req);
      const userAgent = req.headers['user-agent'] || '';
      const referer = req.headers['referer'] || '';
      
      const trackingData = {
        ip,
        userAgent,
        referer,
        query: req.query,
        sessionId: null
      };
      
      const result = await trackingService.trackClick(partnerCode, trackingData);
      
      if (result) {
        logger.info(`Landing page viewed for partner: ${partnerCode}, click: ${result.click.id}`);
        res.json({ success: true, clickId: result.click.id });
      } else {
        res.status(404).json({ success: false, error: 'Partner not found' });
      }
    } else if (clickId) {
      logger.info(`Landing page viewed for click: ${clickId}`);
      res.json({ success: true });
    } else {
      res.status(400).json({ success: false, error: 'Missing parameters' });
    }
  } catch (error) {
    logger.error('Error tracking view:', error);
    res.status(500).json({ success: false });
  }
});

module.exports = router;