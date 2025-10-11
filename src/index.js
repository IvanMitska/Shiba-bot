require('dotenv').config();
const express = require('express');
const { syncDatabase } = require('./database/models');
const logger = require('./utils/logger');
const path = require('path');
const fs = require('fs');

// Enable console logging in production for Railway
if (process.env.NODE_ENV === 'production') {
  const winston = require('winston');
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

async function startApplication() {
  try {
    console.log('=== STARTING APPLICATION ===');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Bot token exists:', !!process.env.BOT_TOKEN);
    console.log('Port:', process.env.PORT || 3000);
    console.log('Railway Domain:', process.env.RAILWAY_PUBLIC_DOMAIN || 'Not set');
    console.log('WEBAPP_URL:', process.env.WEBAPP_URL || 'Not set');
    console.log('DOMAIN:', process.env.DOMAIN || 'Not set');
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
    console.log('Database type:', process.env.DATABASE_URL ? 'PostgreSQL' : 'SQLite');
    
    // Initialize database
    // Never force recreate database, only sync
    await syncDatabase(false);
    console.log('✅ Database initialized');
    
    // Create Express app
    const app = express();
    const port = process.env.PORT || 3000;
    
    // Import middleware
    const cors = require('cors');
    const helmet = require('helmet');
    const morgan = require('morgan');
    const compression = require('compression');
    const rateLimit = require('express-rate-limit');
    
    // Setup middleware
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://telegram.org"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'", "data:"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
    }));
    
    app.use(compression());
    
    // Setup CORS
    const allowedOrigins = [
      'https://shiba-cars-partners.netlify.app',
      'https://shiba-cars-phuket.com',
      'https://www.shiba-cars-phuket.com',
      'http://localhost:3000',
      'http://localhost:3001',
      process.env.WEBAPP_URL,
      process.env.DOMAIN,
      process.env.LANDING_DOMAIN,
      process.env.RAILWAY_PUBLIC_DOMAIN
    ].filter(Boolean);
    
    const corsOptions = {
      origin: function (origin, callback) {
        if (!origin) {
          callback(null, true);
          return;
        }
        
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          console.log('CORS blocked origin:', origin);
          callback(null, true); // For now, allow all origins to test
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Telegram-Init-Data']
    };
    
    app.use(cors(corsOptions));
    
    app.use(morgan('combined', {
      stream: {
        write: (message) => logger.info(message.trim())
      },
      skip: (req) => req.url === '/health'
    }));
    
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Setup view engine for landing pages
    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, 'web/views'));
    
    const limiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
      message: 'Too many requests from this IP, please try again later.'
    });
    
    app.use('/api/', limiter);
    
    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        service: 'shibo-cars-bot',
        bot_token_set: !!process.env.BOT_TOKEN,
        webhook_mode: !!process.env.RAILWAY_PUBLIC_DOMAIN,
        domain: process.env.DOMAIN
      });
    });

    // Root endpoint - check domain
    app.get('/', (req, res) => {
      const host = req.get('host');
      console.log('Root request from host:', host);

      if (host && (host.includes('shiba-cars-phuket.com') ||
                   host === process.env.LANDING_DOMAIN?.replace('https://', '').replace('http://', ''))) {
        // Serve the actual landing page for custom domain
        const landingPath = path.join(__dirname, '../landing-static/index.html');
        try {
          let html = fs.readFileSync(landingPath, 'utf-8');
          res.send(html);
        } catch (error) {
          console.error('Error reading landing page:', error);
          res.status(500).send('Landing page not found');
        }
      } else {
        // API info for main domain
        res.json({
          name: 'Shibo Cars Partner Bot',
          status: 'running',
          endpoints: {
            health: '/health',
            tracking: '/r/:code',
            api: '/api/*',
            webapp: '/telegram-webapp',
            webhook: '/webhook'
          }
        });
      }
    });

    // Test endpoints
    app.get('/test-bot', (req, res) => {
      res.json({
        message: 'Bot webhook endpoint is active',
        webhook_url: webhookUrl || 'Not configured'
      });
    });
    
    // Import routes FIRST before bot initialization
    const trackingRoutes = require('./web/routes/tracking');
    const apiRoutes = require('./web/routes/api');
    const adminRoutes = require('./web/routes/admin');
    const webappRoutes = require('./web/routes/webapp');

    // Serve static files for telegram-webapp (with subdirectories)
    app.use('/telegram-webapp', express.static(path.join(__dirname, '../telegram-webapp/build')));

    // Serve landing static files (logo.png and other assets)
    // ВАЖНО: Это должно быть ПЕРЕД trackingRoutes для правильной обработки
    app.use('/logo.png', (req, res) => {
      res.sendFile(path.join(__dirname, '../landing-static/logo.png'));
    });

    // Также добавляем обработку для /r/logo.png из-за относительных путей
    app.use('/r/logo.png', (req, res) => {
      res.sendFile(path.join(__dirname, '../landing-static/logo.png'));
    });

    // ВАЖНО: Роуты после статики
    app.use('/', trackingRoutes);
    app.use('/api', apiRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/webapp', webappRoutes);

    // Handle React Router for telegram-webapp
    app.get('/telegram-webapp/*', (req, res) => {
      res.sendFile(path.join(__dirname, '../telegram-webapp/build/index.html'));
    });

    // Initialize bot BEFORE starting server so webhook route is registered
    let bot = null;
    let webhookUrl = null;

    // Initialize Telegram bot with Web App support BEFORE 404 handler
    if (process.env.BOT_TOKEN) {
      console.log('Initializing Telegram bot with Web App support...');

      try {
        // Use the new PartnerBot class with Web App button
        const PartnerBot = require('./bot/bot');
        const botInstance = new PartnerBot(process.env.BOT_TOKEN);
        bot = botInstance.bot;

        // Setup webhook or polling
        if (process.env.NODE_ENV === 'production') {
          // Production mode - use webhook
          const domain = process.env.RAILWAY_PUBLIC_DOMAIN ||
                        process.env.APP_URL ||
                        'shibo-tg-backend-production.up.railway.app';

          webhookUrl = `https://${domain.replace('https://', '').replace('http://', '')}/webhook`;

          console.log('Setting up webhook:', webhookUrl);

          // Register webhook endpoint BEFORE 404 handler!
          app.post('/webhook', async (req, res) => {
            console.log('Webhook received from IP:', req.ip);
            console.log('Webhook body:', JSON.stringify(req.body).substring(0, 200));

            try {
              await bot.handleUpdate(req.body);
              res.sendStatus(200);
            } catch (error) {
              console.error('Error processing webhook:', error);
              res.sendStatus(500);
            }
          });

          console.log('✅ Webhook endpoint registered at /webhook');

          // Delete old webhook and set new one
          await bot.telegram.deleteWebhook();
          await bot.telegram.setWebhook(webhookUrl);

          const webhookInfo = await bot.telegram.getWebhookInfo();
          console.log('Webhook info:', webhookInfo);
          console.log('✅ Bot webhook configured');
        } else {
          // Development mode - use polling
          console.log('Starting bot in polling mode...');
          await bot.launch();
          console.log('✅ Bot started in polling mode');
        }
        
        const botInfo = await bot.telegram.getMe();
        console.log(`✅ Bot connected: @${botInfo.username}`);
        
      } catch (error) {
        console.error('Failed to initialize bot:', error);
        console.error('Bot will not be available, but web server will continue');
      }
    } else {
      console.log('⚠️ BOT_TOKEN not provided, running without bot');
    }
    
    // Heartbeat logging
    setInterval(() => {
      logger.info('Application heartbeat');
    }, 30000);
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down gracefully...');
      
      if (bot) {
        await bot.stop('SIGINT');
        console.log('✅ Bot stopped');
      }
      
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });
    
    process.on('SIGTERM', async () => {
      console.log('\n🛑 Shutting down gracefully...');
      
      if (bot) {
        await bot.stop('SIGTERM');
        console.log('✅ Bot stopped');
      }
      
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error('Fatal error during startup:', error);
    process.exit(1);
  }
}

// Start the application
startApplication().catch(error => {
  console.error('Failed to start application:', error);
  process.exit(1);
});