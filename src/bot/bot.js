const { Telegraf, Markup } = require('telegraf');
const { Partner } = require('../database/models');
const { generateWebAppButton } = require('./webApp');
const { formatPartnerStats } = require('./utils');
const logger = require('../utils/logger');

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
        ? `👋 Добро пожаловать в систему партнеров аренды транспорта!`
        : `👋 С возвращением, ${first_name || 'партнер'}!`;
      
      const message = `
${welcomeMessage}

Ваша партнерская ссылка:
🔗 \`${partnerLink}\`

${stats}

Используйте кнопку ниже для открытия панели управления:`;
      
      // Создаем кнопки в зависимости от окружения
      const keyboardButtons = [
        [Markup.button.callback('📋 Копировать ссылку', 'copy_link')],
        [Markup.button.callback('🔄 Обновить статистику', 'refresh_stats')]
      ];
      
      // Добавляем веб-панель только если URL валидный (не localhost для телеграм)
      const webAppUrl = process.env.WEBAPP_URL || `${process.env.DOMAIN}/webapp`;
      if (webAppUrl && !webAppUrl.includes('localhost') && webAppUrl.startsWith('https://')) {
        keyboardButtons.push([Markup.button.url('🌐 Открыть веб-панель', webAppUrl)]);
      }
      
      const keyboard = Markup.inlineKeyboard(keyboardButtons);
      
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
        case 'copy_link':
          const link = partner.getPartnerLink();
          await ctx.answerCbQuery('Ссылка скопирована в буфер обмена', { show_alert: true });
          await ctx.reply(`\`${link}\``, { parse_mode: 'Markdown' });
          break;
          
        case 'refresh_stats':
          const stats = await formatPartnerStats(partner);
          const partnerLink = partner.getPartnerLink();
          
          const message = `
📊 Актуальная статистика

Ваша партнерская ссылка:
🔗 \`${partnerLink}\`

${stats}`;
          
          const webAppUrl = process.env.WEBAPP_URL || `${process.env.DOMAIN}/webapp`;
          
          await ctx.editMessageText(message, {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '📋 Копировать ссылку', callback_data: 'copy_link' }],
                [{ text: '🔄 Обновить статистику', callback_data: 'refresh_stats' }],
                [{ text: '🌐 Открыть веб-панель', url: webAppUrl }]
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