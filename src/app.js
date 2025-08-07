const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');
const { requestLogger, auditLogger } = require('./middleware/loggerMiddleware');
const { generalLimiter, authLimiter, createLimiter, searchLimiter } = require('./middleware/rateLimiter');
const { swaggerUi, specs } = require('./config/swagger');
const logger = require('./config/logger');

class App {
  constructor() {
    this.app = express();
    this.setupMiddlewares();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddlewares() {
    // Trust proxy para rate limiting correto
    this.app.set('trust proxy', 1);

    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true
    }));

    // Rate limiting global
    this.app.use(generalLimiter);

    // Request logger
    this.app.use(requestLogger);

    // Morgan apenas em development para console
    if (process.env.NODE_ENV === 'development') {
      this.app.use(morgan('dev'));
    }

    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version || '1.0.0'
      });
    });
  }

  setupRoutes() {
    const apiPrefix = process.env.API_PREFIX || '/api';
    const apiVersion = process.env.API_VERSION || 'v1';
    const baseRoute = `${apiPrefix}/${apiVersion}`;

    // Swagger Documentation
    this.app.use(`${baseRoute}/docs`, swaggerUi.serve, swaggerUi.setup(specs, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Library API Documentation',
      swaggerOptions: {
        persistAuthorization: true
      }
    }));

    this.app.get(baseRoute, (req, res) => {
      res.json({
        message: 'Welcome to Library API',
        version: apiVersion,
        documentation: `${req.protocol}://${req.get('host')}${baseRoute}/docs`,
        endpoints: {
          auth: `${baseRoute}/auth`,
          users: `${baseRoute}/users`,
          books: `${baseRoute}/books`,
          authors: `${baseRoute}/authors`,
          categories: `${baseRoute}/categories`,
          loans: `${baseRoute}/loans`,
          reservations: `${baseRoute}/reservations`
        }
      });
    });

    // API routes com rate limiters específicos
    const authRoutes = require('./routes/auth');
    const bookRoutes = require('./routes/books');
    const categoryRoutes = require('./routes/categories');
    const authorRoutes = require('./routes/authors');
    
    // Aplicar rate limiters específicos
    this.app.use(`${baseRoute}/auth`, authLimiter, authRoutes);
    this.app.use(`${baseRoute}/books`, bookRoutes);
    this.app.use(`${baseRoute}/categories`, categoryRoutes);
    this.app.use(`${baseRoute}/authors`, authorRoutes);
    
    logger.info('API_STARTUP', {
      message: 'API routes configured successfully',
      baseRoute,
      docsUrl: `${baseRoute}/docs`
    });
  }

  setupErrorHandling() {
    this.app.use(notFound);
    this.app.use(errorHandler);
  }

  getApp() {
    return this.app;
  }
}

module.exports = new App().getApp();