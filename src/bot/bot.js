const { Telegraf, Markup } = require('telegraf');
const { Partner, Click } = require('../database/models');
const { generateWebAppButton } = require('./webApp');
const { formatPartnerStats } = require('./utils');
const logger = require('../utils/logger');
const trackingService = require('../services/tracking');

class PartnerBot {
  constructor(token) {
    this.bot = new Telegraf(token);
    this.setupHandlers();
  }
  
  setupHandlers() {
    this.bot.command('start', this.handleStart.bind(this));
    this.bot.on('callback_query', this.handleCallbackQuery.bind(this));
    
    this.bot.catch((err, ctx) => {
      logger.error('Bot error:', err);
      ctx.reply('Произошла ошибка. Пожалуйста, попробуйте позже.');
    });
  }
  
  async handleStart(ctx) {
    try {
      const telegramId = ctx.from.id;
      const { username, first_name, last_name, language_code } = ctx.from;

      // Extract start parameter (referral code)
      const startParam = ctx.message?.text?.split(' ')[1];
      let referralCode = null;

      if (startParam && startParam.startsWith('ref_')) {
        referralCode = startParam.replace('ref_', '');
        logger.info(`User ${telegramId} came from referral: ${referralCode}`);
      }

      // If this is a referral, track it
      if (referralCode) {
        await this.trackReferral(referralCode, ctx.from);
      }

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
        // Обновляем только если данные действительно изменились
        const updates = {};
        if (partner.username !== username) updates.username = username;
        if (partner.firstName !== first_name) updates.firstName = first_name;
        if (partner.lastName !== last_name) updates.lastName = last_name;

        // Обновляем только при наличии изменений
        if (Object.keys(updates).length > 0) {
          await partner.update(updates);
        }
      }
      
      // If came from referral, show contact info
      if (referralCode) {
        const referralPartner = await Partner.findOne({
          where: { uniqueCode: referralCode }
        });

        if (referralPartner) {
          const whatsappNumber = process.env.WHATSAPP_NUMBER || '66959657805';
          const telegramChannel = process.env.TELEGRAM_COMPANY_BOT || 'ShibaCars_Phuket';

          const referralMessage = `🎉 Спасибо, что перешли по партнерской ссылке!

🚗 **Shiba Cars Phuket** - премиальная аренда автомобилей

📱 Свяжитесь с нами удобным способом:`;

          await ctx.replyWithMarkdown(referralMessage,
            Markup.inlineKeyboard([
              [{ text: '💬 WhatsApp', url: `https://wa.me/${whatsappNumber}` }],
              [{ text: '✈️ Telegram', url: `https://t.me/${telegramChannel}` }]
            ])
          );

          // Continue with regular partner welcome below
        }
      }

      const welcomeMessage = created
        ? `👋 Добро пожаловать в систему партнеров аренды транспорта!`
        : `👋 С возвращением, ${first_name || 'партнер'}!`;

      const message = welcomeMessage;

      // Создаем кнопку с Web App
      // Используем правильный URL для Railway
      const domain = process.env.RAILWAY_PUBLIC_DOMAIN || process.env.DOMAIN || 'localhost:3000';
      const protocol = domain.includes('localhost') ? 'http' : 'https';
      const webAppUrl = process.env.WEBAPP_URL || `${protocol}://${domain}/telegram-webapp`;

      // Логируем URL для отладки
      logger.info(`Web App URL: ${webAppUrl}`);

      const keyboard = Markup.inlineKeyboard([
        [{ text: '📊 Открыть приложение', web_app: { url: webAppUrl } }]
      ]);
      
      await ctx.replyWithMarkdown(message, keyboard);
      
      if (created) {
        logger.info(`New partner registered: ${telegramId} (@${username})`);
      }
    } catch (error) {
      logger.error('Error in handleStart:', error);
      await ctx.reply('Произошла ошибка при регистрации. Пожалуйста, попробуйте позже.');
    }
  }
  
  async handleCallbackQuery(ctx) {
    try {
      const action = ctx.callbackQuery.data;
      const telegramId = ctx.from.id;
      
      const partner = await Partner.findOne({ where: { telegramId } });
      
      if (!partner) {
        return ctx.answerCbQuery('Партнер не найден. Используйте /start для регистрации.');
      }
      
      switch (action) {
        case 'show_link':
          const link = partner.getPartnerLink();
          await ctx.answerCbQuery();
          await ctx.reply(`🔗 Ваша партнерская ссылка:\n\`${link}\`\n\nНажмите на ссылку, чтобы скопировать`, { 
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '📋 Копировать', url: `https://t.me/share/url?url=${encodeURIComponent(link)}` }]
              ]
            }
          });
          break;
          
        case 'copy_link':
          const partnerLink = partner.getPartnerLink();
          await ctx.answerCbQuery('Ссылка готова к копированию', { show_alert: true });
          await ctx.reply(`\`${partnerLink}\``, { parse_mode: 'Markdown' });
          break;
          
        case 'refresh_stats':
          const stats = await formatPartnerStats(partner);
          
          const message = `
📊 Актуальная статистика

Ваша статистика доступна в удобном веб-приложении!

${stats}

Используйте кнопки ниже:`;
          
          const domain = process.env.RAILWAY_PUBLIC_DOMAIN || process.env.DOMAIN || 'localhost:3000';
          const protocol = domain.includes('localhost') ? 'http' : 'https';
          const webAppUrl = process.env.WEBAPP_URL || `${protocol}://${domain}/telegram-webapp`;
          
          await ctx.editMessageText(message, {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '📊 Открыть панель статистики', web_app: { url: webAppUrl } }],
                [{ text: '📋 Показать ссылку', callback_data: 'show_link' }],
                [{ text: '🔄 Обновить', callback_data: 'refresh_stats' }]
              ]
            }
          });
          
          await ctx.answerCbQuery('Статистика обновлена');
          break;
          
        default:
          await ctx.answerCbQuery('Неизвестное действие');
      }
    } catch (error) {
      logger.error('Error in handleCallbackQuery:', error);
      await ctx.answerCbQuery('Произошла ошибка. Попробуйте позже.');
    }
  }
  
  async trackReferral(referralCode, telegramUser) {
    try {
      // Find the partner by referral code
      const partner = await Partner.findOne({
        where: { uniqueCode: referralCode, isActive: true }
      });

      if (!partner) {
        logger.warn(`Invalid referral code: ${referralCode}`);
        return;
      }

      // Create tracking data with Telegram user info
      const trackingData = {
        ip: '0.0.0.0', // Not available from Telegram bot
        userAgent: 'Telegram Bot',
        referer: `telegram://referral/${referralCode}`,
        query: {},
        sessionId: null,
        telegramUser: {
          id: telegramUser.id,
          username: telegramUser.username,
          first_name: telegramUser.first_name,
          last_name: telegramUser.last_name,
          language_code: telegramUser.language_code,
          photo_url: null // Will be fetched if needed
        }
      };

      // Track the click
      await trackingService.trackClick(referralCode, trackingData);

      logger.info(`Tracked referral for partner ${partner.id} from user ${telegramUser.id}`);
    } catch (error) {
      logger.error('Error tracking referral:', error);
    }
  }

  async launch(webhookUrl = null) {
    try {
      if (webhookUrl) {
        await this.bot.telegram.setWebhook(webhookUrl);
        logger.info(`Webhook set to: ${webhookUrl}`);
      } else {
        logger.info('Launching bot with polling...');
        await this.bot.launch();
        logger.info('Bot launched in polling mode');
      }

      process.once('SIGINT', () => this.bot.stop('SIGINT'));
      process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
    } catch (error) {
      logger.error('Failed to launch bot:', error);
      throw error;
    }
  }
  
  getWebhookCallback() {
    return this.bot.webhookCallback('/webhook');
  }
}

module.exports = PartnerBot;