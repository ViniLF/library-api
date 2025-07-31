const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

class App {
  constructor() {
    this.app = express();
    this.setupMiddlewares();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddlewares() {
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

    if (process.env.NODE_ENV === 'development') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined'));
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

    // API routes
    const authRoutes = require('./routes/auth');
    const bookRoutes = require('./routes/books');
    const categoryRoutes = require('./routes/categories');
    const authorRoutes = require('./routes/authors');
    
    this.app.use(`${baseRoute}/auth`, authRoutes);
    this.app.use(`${baseRoute}/books`, bookRoutes);
    this.app.use(`${baseRoute}/categories`, categoryRoutes);
    this.app.use(`${baseRoute}/authors`, authorRoutes);
    
    console.log(`🚀 API routes configured with base: ${baseRoute}`);
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