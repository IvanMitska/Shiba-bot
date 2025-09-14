require('dotenv').config();
const express = require('express');
const { Telegraf } = require('telegraf');
const { syncDatabase } = require('./database/models');
const { Partner } = require('./database/models');
const { formatPartnerStats } = require('./bot/utils');
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
    
    // Create Express app directly
    const app = express();
    const port = process.env.PORT || 3000;
    
    // Import middleware from WebApp
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
    
    // Configure CORS to allow Netlify landing
    const corsOptions = {
      origin: function(origin, callback) {
        const allowedOrigins = [
          'https://shiba-cars-partners.netlify.app',
          'http://localhost:3000',
          'http://localhost:3001', 
          'http://localhost:3002',
          'http://localhost:4000'
        ];
        
        // Allow requests with no origin (e.g., mobile apps)
        if (!origin) return callback(null, true);
        
        // Allow any origin in development
        if (process.env.NODE_ENV === 'development') {
          return callback(null, true);
        }
        
        // Check if origin is allowed
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          console.log('CORS blocked origin:', origin);
          callback(null, true); // For now, allow all origins to test
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
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
        service: 'shibo-cars-bot'
      });
    });
    
    // Root endpoint
    app.get('/', (req, res) => {
      res.json({
        name: 'Shibo Cars Partner Bot',
        status: 'running',
        endpoints: {
          health: '/health',
          tracking: '/r/:code',
          api: '/api/*',
          webhook: '/webhook',
          'test-bot': '/test-bot'
        }
      });
    });
    
    let bot = null;
    let webhookUrl = null;
    
    // Initialize Telegram bot
    if (process.env.BOT_TOKEN) {
      console.log('Initializing Telegram bot...');
      
      try {
        // Use the new PartnerBot class with Web App support
        const PartnerBot = require('./bot/bot');
        const botInstance = new PartnerBot(process.env.BOT_TOKEN);
        bot = botInstance.bot;
        
        // Setup webhook or polling
              defaults: {
                telegramId,
                username,
                firstName: first_name,
                lastName: last_name
              }
            });
            
            if (!created && !partner.isActive) {
              return ctx.reply('Ваш аккаунт партнера временно заблокирован. Обратитесь к администратору.');
            }
            
            if (!created) {
              await partner.update({
                username,
                firstName: first_name,
                lastName: last_name
              });
            }
            
            const partnerLink = partner.getPartnerLink();
            const stats = await formatPartnerStats(partner);
            
            const welcomeMessage = created
              ? `👋 Добро пожаловать в систему партнеров Shiba Cars!`
              : `👋 С возвращением, ${first_name || 'партнер'}!`;
            
            const message = `
${welcomeMessage}

🚗 Ваша партнерская ссылка для отслеживания клиентов:
🔗 \`${partnerLink}\`

${stats}

💡 Поделитесь этой ссылкой с потенциальными клиентами. 
Когда они перейдут по ней и свяжутся с нами, вы увидите это в статистике.

Используйте команды:
/start - Показать эту информацию
/stats - Обновить статистику`;
            
            // Добавляем инлайн кнопки
            const { Markup } = require('telegraf');
            const keyboard = Markup.inlineKeyboard([
              [Markup.button.callback('📋 Копировать ссылку', 'copy_link')],
              [Markup.button.callback('📊 Обновить статистику', 'refresh_stats')],
              [Markup.button.url('🌐 Открыть лендинг', partnerLink)]
            ]);
            
            await ctx.replyWithMarkdown(message, keyboard);
            
            console.log(`Partner ${created ? 'registered' : 'returned'}: ${telegramId}`);
          } catch (error) {
            console.error('Error in /start handler:', error);
            await ctx.reply('Произошла ошибка. Пожалуйста, попробуйте позже.');
          }
        });
        
        bot.command('stats', async (ctx) => {
          console.log('Received /stats command from:', ctx.from.id);
          
          try {
            const partner = await Partner.findOne({ 
              where: { telegramId: ctx.from.id } 
            });
            
            if (!partner) {
              return ctx.reply('Сначала зарегистрируйтесь с помощью команды /start');
            }
            
            const stats = await formatPartnerStats(partner);
            const partnerLink = partner.getPartnerLink();
            
            const message = `
📊 Ваша актуальная статистика:

🔗 Партнерская ссылка:
\`${partnerLink}\`

${stats}

Обновлено: ${new Date().toLocaleString('ru-RU')}`;
            
            const { Markup } = require('telegraf');
            const keyboard = Markup.inlineKeyboard([
              [Markup.button.callback('📋 Копировать ссылку', 'copy_link')],
              [Markup.button.callback('🔄 Обновить', 'refresh_stats')],
              [Markup.button.url('🌐 Открыть лендинг', partnerLink)]
            ]);
            
            await ctx.replyWithMarkdown(message, keyboard);
          } catch (error) {
            console.error('Error in /stats handler:', error);
            await ctx.reply('Произошла ошибка при получении статистики.');
          }
        });
        
        // Обработчики для инлайн кнопок
        bot.action('copy_link', async (ctx) => {
          console.log('Copy link action from:', ctx.from.id);
          
          try {
            const partner = await Partner.findOne({ 
              where: { telegramId: ctx.from.id } 
            });
            
            if (!partner) {
              return ctx.answerCbQuery('Ошибка: партнер не найден');
            }
            
            const partnerLink = partner.getPartnerLink();
            
            // Отвечаем на callback query
            await ctx.answerCbQuery('📋 Ссылка скопирована! Нажмите на нее чтобы скопировать:', { show_alert: true });
            
            // Отправляем ссылку отдельным сообщением для удобного копирования
            await ctx.reply(`\`${partnerLink}\``, { parse_mode: 'Markdown' });
          } catch (error) {
            console.error('Error in copy_link action:', error);
            await ctx.answerCbQuery('Произошла ошибка');
          }
        });
        
        bot.action('refresh_stats', async (ctx) => {
          console.log('Refresh stats action from:', ctx.from.id);
          
          try {
            const partner = await Partner.findOne({ 
              where: { telegramId: ctx.from.id } 
            });
            
            if (!partner) {
              return ctx.answerCbQuery('Ошибка: партнер не найден');
            }
            
            const stats = await formatPartnerStats(partner);
            const partnerLink = partner.getPartnerLink();
            
            const message = `
📊 Ваша актуальная статистика:

🔗 Партнерская ссылка:
\`${partnerLink}\`

${stats}

Обновлено: ${new Date().toLocaleString('ru-RU')}`;
            
            const { Markup } = require('telegraf');
            const keyboard = Markup.inlineKeyboard([
              [Markup.button.callback('📋 Копировать ссылку', 'copy_link')],
              [Markup.button.callback('🔄 Обновить', 'refresh_stats')],
              [Markup.button.url('🌐 Открыть лендинг', partnerLink)]
            ]);
            
            // Обновляем сообщение
            await ctx.editMessageText(message, {
              parse_mode: 'Markdown',
              ...keyboard
            });
            
            await ctx.answerCbQuery('✅ Статистика обновлена');
          } catch (error) {
            console.error('Error in refresh_stats action:', error);
            await ctx.answerCbQuery('Произошла ошибка при обновлении');
          }
        });
        
        // Error handler
        bot.catch((err, ctx) => {
          console.error('Bot error:', err);
          ctx.reply('Произошла ошибка. Пожалуйста, попробуйте позже.');
        });
        
        // Setup webhook or polling
        if (process.env.NODE_ENV === 'production') {
          // Production mode - use webhook
          const domain = process.env.RAILWAY_PUBLIC_DOMAIN || 
                        process.env.APP_URL || 
                        'shibo-tg-backend-production.up.railway.app';
          
          webhookUrl = `https://${domain.replace('https://', '').replace('http://', '')}/webhook`;
          
          console.log('Setting up webhook:', webhookUrl);
          
          // CRITICAL: Register webhook endpoint BEFORE starting server
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
        
        // Get bot info
        const botInfo = await bot.telegram.getMe();
        console.log('✅ Bot connected:', `@${botInfo.username}`);
        
        // Add test endpoint AFTER bot is initialized
        app.get('/test-bot', async (req, res) => {
          try {
            const botInfo = await bot.telegram.getMe();
            const webhookInfo = await bot.telegram.getWebhookInfo();
            res.json({
              status: 'Bot is running',
              bot: botInfo,
              webhook: webhookInfo
            });
          } catch (error) {
            res.json({
              status: 'Bot error',
              error: error.message
            });
          }
        });
        
      } catch (error) {
        console.error('❌ Failed to start bot:', error);
        // Continue running server even if bot fails
      }
    } else {
      console.log('⚠️ BOT_TOKEN not provided, running without bot');
    }
    
    // Import routes
    const trackingRoutes = require('./web/routes/tracking');
    const apiRoutes = require('./web/routes/api');
    const adminRoutes = require('./web/routes/admin');
    const webappRoutes = require('./web/routes/webapp');
    
    // Serve static files for telegram-webapp
    const path = require('path');
    app.use('/telegram-webapp', express.static(path.join(__dirname, '../telegram-webapp/build')));
    
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
      console.error('Unhandled error:', err);
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
    
    // Keep process alive
    if (process.env.NODE_ENV === 'production') {
      setInterval(() => {
        logger.info('Application heartbeat');
      }, 30000);
    }
    
    // Graceful shutdown
    process.once('SIGINT', () => {
      console.log('SIGINT received, shutting down gracefully');
      if (bot) bot.stop('SIGINT');
      server.close();
      process.exit(0);
    });
    
    process.once('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      if (bot) bot.stop('SIGTERM');
      server.close();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Failed to start application:', error);
    process.exit(1);
  }
}

startApplication();