const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

const trackingRoutes = require('./routes/tracking');
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');
const webappRoutes = require('./routes/webapp');

class WebApp {
  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }
  
  setupMiddleware() {
    this.app.use(helmet({
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
    
    this.app.use(compression());
    this.app.use(cors({
      origin: (origin, callback) => {
        // Разрешаем запросы с наших доменов
        const allowedOrigins = [
          process.env.WEBAPP_URL,
          process.env.LANDING_DOMAIN,
          process.env.DOMAIN,
          'https://shiba-cars-phuket.com',
          'https://www.shiba-cars-phuket.com',
          'https://shibo-tg.up.railway.app'
        ].filter(Boolean);

        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(null, true); // В продакшене разрешаем все для партнерских ссылок
        }
      },
      credentials: true
    }));
    
    this.app.use(morgan('combined', {
      stream: {
        write: (message) => logger.info(message.trim())
      },
      skip: (req) => req.url === '/health'
    }));
    
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    const limiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
      message: 'Too many requests from this IP, please try again later.'
    });
    
    this.app.use('/api/', limiter);
    
    this.app.set('view engine', 'ejs');
    this.app.set('views', path.join(__dirname, 'views'));
    
    this.app.use('/public', express.static(path.join(__dirname, 'public')));
    this.app.use('/webapp', express.static(path.join(__dirname, '../../webapp/build')));
    this.app.use('/telegram-webapp', express.static(path.join(__dirname, '../../telegram-webapp/build')));
    this.app.use('/static', express.static(path.join(__dirname, '../../webapp/build/static')));
  }
  
  setupRoutes() {
    // Health check endpoint - MUST be first for Railway
    this.app.get('/health', (req, res) => {
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

    // Database diagnostic endpoint
    this.app.get('/db-status', async (req, res) => {
      const { sequelize } = require('../database/models');

      const status = {
        database_url_set: !!process.env.DATABASE_URL,
        node_env: process.env.NODE_ENV,
        railway_domain: process.env.RAILWAY_PUBLIC_DOMAIN || 'not set',
        landing_domain: process.env.LANDING_DOMAIN || 'not set'
      };

      // Show database host (without password)
      if (process.env.DATABASE_URL) {
        try {
          const url = new URL(process.env.DATABASE_URL);
          status.db_host = url.hostname;
          status.db_port = url.port;
          status.db_name = url.pathname.substring(1);
        } catch (e) {
          status.db_parse_error = e.message;
        }
      }

      try {
        await sequelize.authenticate();
        status.connection = 'success';
        status.database_type = sequelize.options.dialect;

        const [results] = await sequelize.query('SELECT COUNT(*) as count FROM partners');
        status.partners_count = results[0].count;
      } catch (error) {
        status.connection = 'failed';
        status.error = error.message;
        status.error_type = error.name;
      }

      res.json(status);
    });

    // Root endpoint - проверяем домен
    this.app.get('/', (req, res) => {
      // Если это запрос с домена лендинга, показываем главную страницу
      const host = req.get('host');
      if (host && (host.includes('shiba-cars-phuket.com') ||
                   host === process.env.LANDING_DOMAIN?.replace('https://', '').replace('http://', ''))) {
        // Показываем страницу лендинга или редирект
        res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>SHIBA CARS - Partner Program</title>
            <meta charset="utf-8">
            <style>
              body {
                background: #000;
                color: #FF8C00;
                font-family: Arial;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
              }
              .container {
                text-align: center;
                padding: 40px;
              }
              h1 { font-size: 48px; margin-bottom: 20px; }
              p { font-size: 20px; color: #fff; }
              a { color: #FF8C00; text-decoration: none; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>SHIBA CARS PHUKET</h1>
              <p>Premium Car Rental Service</p>
              <p>Partner Program</p>
              <br>
              <p>Contact: <a href="https://t.me/ShibaCars_Phuket">@ShibaCars_Phuket</a></p>
            </div>
          </body>
          </html>
        `);
      } else {
        // Для основного домена возвращаем JSON
        res.json({
          name: 'Shibo Cars Partner Bot',
          status: 'running',
          endpoints: {
            health: '/health',
            tracking: '/r/:code',
            api: '/api/*',
            webhook: '/webhook'
          }
        });
      }
    });
    
    // Admin login - BEFORE auth middleware
    this.app.post('/api/admin/login', async (req, res) => {
      try {
        const jwt = require('jsonwebtoken');
        const { Admin } = require('../database/models');

        const { secretKey } = req.body;
        const adminSecret = process.env.ADMIN_SECRET || 'shibo-admin-2024';

        if (secretKey !== adminSecret) {
          return res.status(401).json({ error: 'Invalid secret key' });
        }

        let admin = await Admin.findOne({ where: { isActive: true } });

        if (!admin) {
          return res.status(404).json({ error: 'No active admin found' });
        }

        const token = jwt.sign(
          { adminId: admin.id, type: 'admin' },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );

        await admin.updateLastLogin();

        logger.info(`Admin ${admin.id} logged in`);

        res.json({
          success: true,
          token,
          admin: {
            id: admin.id,
            username: admin.username,
            role: admin.role,
            permissions: admin.permissions
          }
        });
      } catch (error) {
        logger.error('Admin login error:', error);
        res.status(500).json({ error: 'Login failed' });
      }
    });

    this.app.use('/', trackingRoutes);
    this.app.use('/api', apiRoutes);
    this.app.use('/api/admin', adminRoutes);
    this.app.use('/api/webapp', webappRoutes);
    
    this.app.get('/webapp/*', (req, res) => {
      res.sendFile(path.join(__dirname, '../../webapp/build/index.html'));
    });
    
    this.app.get('/telegram-webapp/*', (req, res) => {
      res.sendFile(path.join(__dirname, '../../telegram-webapp/build/index.html'));
    });
  }
  
  setupErrorHandling() {
    this.app.use((req, res, next) => {
      res.status(404).json({ error: 'Not found' });
    });
    
    this.app.use((err, req, res, next) => {
      logger.error('Unhandled error:', err);
      
      const status = err.status || 500;
      const message = err.message || 'Internal server error';
      
      res.status(status).json({
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      });
    });
  }
  
  start(port = 3000) {
    this.server = this.app.listen(port, () => {
      logger.info(`Web server started on port ${port}`);
    });
    
    return this.server;
  }
  
  stop() {
    if (this.server) {
      this.server.close(() => {
        logger.info('Web server stopped');
      });
    }
  }
  
  getExpressApp() {
    return this.app;
  }
}

module.exports = WebApp;