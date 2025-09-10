require('dotenv').config();
const express = require('express');
const { Telegraf } = require('telegraf');
const { syncDatabase } = require('./database/models');
const { Partner } = require('./database/models');
const { formatPartnerStats } = require('./bot/utils');
const WebApp = require('./web/app');
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
    
    // Initialize database
    await syncDatabase(process.env.NODE_ENV === 'development');
    console.log('✅ Database initialized');
    
    // Create Express app through WebApp
    const webApp = new WebApp();
    const app = webApp.getExpressApp();
    const port = process.env.PORT || 3000;
    
    // Add test endpoint
    app.get('/test-bot', async (req, res) => {
      try {
        const botInfo = await bot.telegram.getMe();
        res.json({
          status: 'Bot is running',
          bot: botInfo,
          webhook: webhookUrl || 'Not set'
        });
      } catch (error) {
        res.json({
          status: 'Bot error',
          error: error.message
        });
      }
    });
    
    let bot = null;
    let webhookUrl = null;
    
    // Initialize Telegram bot
    if (process.env.BOT_TOKEN) {
      console.log('Initializing Telegram bot...');
      
      try {
        bot = new Telegraf(process.env.BOT_TOKEN);
        
        // Register bot handlers
        bot.command('start', async (ctx) => {
          console.log('Received /start command from:', ctx.from.id);
          
          try {
            const telegramId = ctx.from.id;
            const { username, first_name, last_name } = ctx.from;
            
            let [partner, created] = await Partner.findOrCreate({
              where: { telegramId },
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
            
            await ctx.replyWithMarkdown(message);
            
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
            
            await ctx.replyWithMarkdown(message);
          } catch (error) {
            console.error('Error in /stats handler:', error);
            await ctx.reply('Произошла ошибка при получении статистики.');
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
          const domain = process.env.APP_URL || 
                        process.env.RAILWAY_PUBLIC_DOMAIN || 
                        'shibo-tg-backend-production.up.railway.app';
          
          webhookUrl = `https://${domain.replace('https://', '').replace('http://', '')}/webhook`;
          
          console.log('Setting up webhook:', webhookUrl);
          
          // Register webhook endpoint
          app.post('/webhook', (req, res) => {
            console.log('Webhook received:', req.body?.message?.text || 'no text');
            return bot.webhookCallback('/webhook')(req, res);
          });
          
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
        
      } catch (error) {
        console.error('❌ Failed to start bot:', error);
        // Continue running server even if bot fails
      }
    } else {
      console.log('⚠️ BOT_TOKEN not provided, running without bot');
    }
    
    // Start server
    const server = webApp.start(port);
    console.log(`✅ Server running on port ${port}`);
    console.log(`🌐 Check health: http://localhost:${port}/health`);
    console.log(`🤖 Check bot: http://localhost:${port}/test-bot`);
    
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
      webApp.stop();
      process.exit(0);
    });
    
    process.once('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      if (bot) bot.stop('SIGTERM');
      webApp.stop();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Failed to start application:', error);
    process.exit(1);
  }
}

startApplication();