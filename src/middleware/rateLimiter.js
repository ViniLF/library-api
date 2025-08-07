const rateLimit = require('express-rate-limit');
const logger = require('../config/logger');

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    error: {
      type: 'RateLimitError',
      message: 'Muitas requisições. Tente novamente em alguns minutos.',
      retryAfter: '15 minutes'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('RATE_LIMIT_EXCEEDED', {
      type: 'general',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
      userId: req.user?.id
    });
    
    res.status(429).json({
      success: false,
      error: {
        type: 'RateLimitError',
        message: 'Muitas requisições. Tente novamente em alguns minutos.',
        retryAfter: '15 minutes'
      }
    });
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: {
      type: 'AuthRateLimitError',
      message: 'Muitas tentativas de autenticação. Tente novamente em 15 minutos.',
      retryAfter: '15 minutes'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('AUTH_RATE_LIMIT_EXCEEDED', {
      type: 'auth',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
      email: req.body?.email
    });
    
    res.status(429).json({
      success: false,
      error: {
        type: 'AuthRateLimitError',
        message: 'Muitas tentativas de autenticação. Tente novamente em 15 minutos.',
        retryAfter: '15 minutes'
      }
    });
  }
});

const createLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: {
      type: 'CreateRateLimitError',
      message: 'Muitas criações de recursos. Tente novamente em 10 minutos.',
      retryAfter: '10 minutes'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('CREATE_RATE_LIMIT_EXCEEDED', {
      type: 'create',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
      userId: req.user?.id
    });
    
    res.status(429).json({
      success: false,
      error: {
        type: 'CreateRateLimitError',
        message: 'Muitas criações de recursos. Tente novamente em 10 minutos.',
        retryAfter: '10 minutes'
      }
    });
  }
});

const searchLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 50,
  message: {
    success: false,
    error: {
      type: 'SearchRateLimitError',
      message: 'Muitas buscas realizadas. Tente novamente em alguns minutos.',
      retryAfter: '5 minutes'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return req.user?.role === 'ADMIN';
  }
});

module.exports = {
  generalLimiter,
  authLimiter,
  createLimiter,
  searchLimiter
};