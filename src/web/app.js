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
      origin: process.env.WEBAPP_URL || true,
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
    this.app.use('/static', express.static(path.join(__dirname, '../../webapp/build/static')));
  }
  
  setupRoutes() {
    // Health check endpoint - MUST be first for Railway
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        service: 'shibo-cars-bot'
      });
    });
    
    // Root endpoint
    this.app.get('/', (req, res) => {
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
    });
    
    this.app.use('/', trackingRoutes);
    this.app.use('/api', apiRoutes);
    this.app.use('/api/admin', adminRoutes);
    
    this.app.get('/webapp/*', (req, res) => {
      res.sendFile(path.join(__dirname, '../../webapp/build/index.html'));
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