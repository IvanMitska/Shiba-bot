require('dotenv').config();
const PartnerBot = require('./bot/bot');
const WebApp = require('./web/app');
const { syncDatabase } = require('./database/models');
const logger = require('./utils/logger');

// Enable console logging in production for Railway
if (process.env.NODE_ENV === 'production') {
  const winston = require('winston');
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

async function startApplication() {
  try {
    console.log('Starting application...');
    logger.info('Starting application...');
    
    // Initialize database
    await syncDatabase(process.env.NODE_ENV === 'development');
    console.log('Database initialized');
    logger.info('Database initialized');
    
    // Start web server
    const webApp = new WebApp();
    const port = process.env.PORT || 3000;
    
    // Start Telegram bot only if token is provided
    if (process.env.BOT_TOKEN) {
      console.log('Initializing Telegram bot...');
      logger.info('Initializing Telegram bot...');
      
      try {
        const bot = new PartnerBot(process.env.BOT_TOKEN);
        
        // In production on Railway, use webhook
        if (process.env.NODE_ENV === 'production' && process.env.RAILWAY_PUBLIC_DOMAIN) {
          const webhookUrl = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}/webhook`;
          console.log(`Setting up webhook mode: ${webhookUrl}`);
          logger.info(`Setting up webhook mode: ${webhookUrl}`);
          const app = webApp.getExpressApp();
          // Register webhook BEFORE starting server
          app.post('/webhook', bot.getWebhookCallback());
          
          // Now start the server
          const server = webApp.start(port);
          console.log(`Web server started on port ${port} with webhook at /webhook`);
          
          // Set webhook URL in Telegram
          await bot.launch(webhookUrl);
        } else if (process.env.WEBHOOK_URL) {
          // Custom webhook URL
          console.log('Setting up custom webhook mode...');
          logger.info('Setting up webhook mode...');
          const app = webApp.getExpressApp();
          app.post('/webhook', bot.getWebhookCallback());
          const server = webApp.start(port);
          console.log(`Web server started on port ${port} with webhook`);
          await bot.launch(process.env.WEBHOOK_URL);
        } else {
          // Polling mode for development
          console.log('Starting bot in polling mode...');
          logger.info('Starting bot in polling mode...');
          const server = webApp.start(port);
          console.log(`Web server started on port ${port}`);
          await bot.launch();
        }
        
        console.log('Bot started successfully');
      } catch (botError) {
        console.error('Failed to start bot:', botError);
        logger.error('Failed to start bot:', botError);
        // Continue running even if bot fails
      }
    } else {
      console.log('BOT_TOKEN not provided, running without Telegram bot');
      logger.warn('BOT_TOKEN not provided, running without Telegram bot');
      const server = webApp.start(port);
      console.log(`Web server started on port ${port} without bot`);
    }
    
    console.log('Application started successfully');
    logger.info('Application started successfully');
    
    // Keep the process alive
    if (process.env.NODE_ENV === 'production') {
      setInterval(() => {
        logger.info('Application heartbeat');
      }, 30000); // Log every 30 seconds
    }
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('Shutting down gracefully...');
      logger.info('Shutting down gracefully...');
      webApp.stop();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      console.log('Shutting down gracefully...');
      logger.info('Shutting down gracefully...');
      webApp.stop();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Failed to start application:', error);
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
}

startApplication();