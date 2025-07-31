const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Importar middlewares customizados
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

// Importar rotas (criaremos depois)
// const authRoutes = require('./routes/auth');
// const userRoutes = require('./routes/users');
// const bookRoutes = require('./routes/books');

/**
 * Configuração da aplicação Express
 */
class App {
  constructor() {
    this.app = express();
    this.setupMiddlewares();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Configura middlewares globais
   */
  setupMiddlewares() {
    // Segurança
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

    // CORS
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true
    }));

    // Logging
    if (process.env.NODE_ENV === 'development') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined'));
    }

    // Parsing
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

  /**
   * Configura as rotas da aplicação
   */
  setupRoutes() {
    const apiPrefix = process.env.API_PREFIX || '/api';
    const apiVersion = process.env.API_VERSION || 'v1';
    const baseRoute = `${apiPrefix}/${apiVersion}`;

    // Rota de boas-vindas
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

    // Configurar rotas da API (implementaremos depois)
    // this.app.use(`${baseRoute}/auth`, authRoutes);
    // this.app.use(`${baseRoute}/users`, userRoutes);
    // this.app.use(`${baseRoute}/books`, bookRoutes);
    
    console.log(`🚀 API routes configured with base: ${baseRoute}`);
  }

  /**
   * Configura tratamento de erros
   */
  setupErrorHandling() {
    // Middleware para rotas não encontradas
    this.app.use(notFound);
    
    // Middleware global de tratamento de erros
    this.app.use(errorHandler);
  }

  /**
   * Retorna a instância do Express
   */
  getApp() {
    return this.app;
  }
}

module.exports = new App().getApp();