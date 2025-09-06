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
    const sessionId = req.session?.id || null;
    
    const trackingData = {
      ip,
      userAgent,
      referer,
      query: req.query,
      sessionId
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
    const { clickId, type } = req.body;
    
    if (!clickId || !type) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required parameters' 
      });
    }
    
    const success = await trackingService.trackRedirect(clickId, type);
    
    res.json({ success });
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
    const { clickId } = req.body;
    logger.info(`Landing page viewed for click: ${clickId}`);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error tracking view:', error);
    res.status(500).json({ success: false });
  }
});

module.exports = router;