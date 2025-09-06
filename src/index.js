require('dotenv').config();
const PartnerBot = require('./bot/bot');
const WebApp = require('./web/app');
const { syncDatabase } = require('./database/models');
const logger = require('./utils/logger');

async function startApplication() {
  try {
    logger.info('Starting application...');
    
    // Initialize database
    await syncDatabase(process.env.NODE_ENV === 'development');
    logger.info('Database initialized');
    
    // Start web server
    const webApp = new WebApp();
    const port = process.env.PORT || 3000;
    webApp.start(port);
    
    // Start Telegram bot
    logger.info('Initializing Telegram bot...');
    const bot = new PartnerBot(process.env.BOT_TOKEN);
    
    // In production on Railway, use webhook
    if (process.env.NODE_ENV === 'production' && process.env.RAILWAY_PUBLIC_DOMAIN) {
      const webhookUrl = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}/webhook`;
      logger.info(`Setting up webhook mode: ${webhookUrl}`);
      const app = webApp.getExpressApp();
      app.use('/webhook', bot.getWebhookCallback());
      await bot.launch(webhookUrl);
    } else if (process.env.WEBHOOK_URL) {
      // Custom webhook URL
      logger.info('Setting up webhook mode...');
      const app = webApp.getExpressApp();
      app.use('/webhook', bot.getWebhookCallback());
      await bot.launch(process.env.WEBHOOK_URL);
    } else {
      // Polling mode for development
      logger.info('Starting bot in polling mode...');
      await bot.launch();
    }
    
    logger.info('Application started successfully');
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Shutting down gracefully...');
      webApp.stop();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      logger.info('Shutting down gracefully...');
      webApp.stop();
      process.exit(0);
    });
    
  } catch (error) {
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
}

startApplication();