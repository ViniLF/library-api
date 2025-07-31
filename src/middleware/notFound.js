/**
 * Middleware para lidar com rotas não encontradas
 */
const notFound = (req, res, next) => {
  const error = new Error(`Rota não encontrada: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  error.type = 'NotFoundError';
  
  next(error);
};

module.exports = notFound;