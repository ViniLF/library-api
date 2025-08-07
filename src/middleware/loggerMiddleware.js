const logger = require('../config/logger');

const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  req.correlationId = generateCorrelationId();
  
  const originalJson = res.json;
  res.json = function(data) {
    const responseTime = Date.now() - startTime;
    
    // Log da resposta
    logger.http(req, res, responseTime);
    
    if (res.statusCode >= 400 && data.error) {
      logger.error('API_ERROR', {
        correlationId: req.correlationId,
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        errorType: data.error.type,
        errorMessage: data.error.message,
        userId: req.user?.id,
        ip: req.ip
      });
    }
    
    return originalJson.call(this, data);
  };
  
  logger.info('REQUEST_START', {
    correlationId: req.correlationId,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.id
  });
  
  next();
};

const auditLogger = (action, resource) => {
  return (req, res, next) => {
    const originalJson = res.json;
    res.json = function(data) {
      if (res.statusCode < 400 && data.success) {
        logger.audit(action, req.user?.id, resource, {
          correlationId: req.correlationId,
          resourceId: req.params.id,
          data: sanitizeForAudit(req.body),
          ip: req.ip
        });
      }
      return originalJson.call(this, data);
    };
    
    next();
  };
};

function generateCorrelationId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function sanitizeForAudit(data) {
  if (!data || typeof data !== 'object') return data;
  
  const sanitized = { ...data };
  
  delete sanitized.password;
  delete sanitized.refreshToken;
  
  return sanitized;
}

module.exports = {
  requestLogger,
  auditLogger
};