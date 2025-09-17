require('dotenv').config();
const express = require('express');
const { syncDatabase } = require('./database/models');
const logger = require('./utils/logger');
const path = require('path');

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
    
    // Initialize database
    await syncDatabase(process.env.NODE_ENV === 'development');
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
        // Landing page for custom domain
        res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>SHIBA CARS PHUKET - Partner Program</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body {
                background: #000;
                color: #FF8C00;
                font-family: Arial, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                margin: 0;
                padding: 20px;
              }
              .container {
                text-align: center;
                max-width: 600px;
              }
              h1 {
                font-size: clamp(32px, 8vw, 48px);
                margin-bottom: 20px;
                text-shadow: 0 0 20px rgba(255, 140, 0, 0.5);
              }
              p {
                font-size: clamp(16px, 3vw, 20px);
                color: #fff;
                margin: 10px 0;
              }
              a {
                color: #FF8C00;
                text-decoration: none;
                border-bottom: 2px solid transparent;
                transition: border-color 0.3s;
              }
              a:hover {
                border-bottom-color: #FF8C00;
              }
              .logo {
                font-size: 60px;
                margin-bottom: 20px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="logo">🏎️</div>
              <h1>SHIBA CARS PHUKET</h1>
              <p>Premium Car Rental Service</p>
              <p>Partner Program</p>
              <br>
              <p>WhatsApp: <a href="https://wa.me/66959657805">+66 95 965 7805</a></p>
              <p>Telegram: <a href="https://t.me/ShibaCars_Phuket">@ShibaCars_Phuket</a></p>
            </div>
          </body>
          </html>
        `);
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
    
    let bot = null;
    let webhookUrl = null;
    
    // Initialize Telegram bot with Web App support
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
          
          // Register webhook endpoint
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
    
    // Import routes
    const trackingRoutes = require('./web/routes/tracking');
    const apiRoutes = require('./web/routes/api');
    const adminRoutes = require('./web/routes/admin');
    const webappRoutes = require('./web/routes/webapp');
    
    // Serve static files for telegram-webapp (with subdirectories)
    app.use('/telegram-webapp', express.static(path.join(__dirname, '../telegram-webapp/build')));

    // Serve static files for landing page
    app.use('/assets', express.static(path.join(__dirname, '../netlify-landing')));
    
    app.use('/', trackingRoutes);
    app.use('/api', apiRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/webapp', webappRoutes);
    
    // Handle React Router for telegram-webapp
    app.get('/telegram-webapp/*', (req, res) => {
      res.sendFile(path.join(__dirname, '../telegram-webapp/build/index.html'));
    });
    
    // 404 handler
    app.use((req, res, next) => {
      console.log('404 Not found:', req.method, req.url);
      res.status(404).json({ error: 'Not found' });
    });
    
    // Error handler
    app.use((err, req, res, next) => {
      logger.error('Unhandled error:', err);
      
      const status = err.status || 500;
      const message = err.message || 'Internal server error';
      
      res.status(status).json({
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      });
    });
    
    // Start server
    const server = app.listen(port, () => {
      console.log(`✅ Server running on port ${port}`);
      console.log(`🌐 Check health: http://localhost:${port}/health`);
      console.log(`🤖 Check bot: http://localhost:${port}/test-bot`);
      logger.info(`Web server started on port ${port}`);
    });
    
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