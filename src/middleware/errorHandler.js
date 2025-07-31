/**
 * Middleware global para tratamento de erros
 * Centraliza o tratamento de todos os erros da aplicação
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log do erro para debugging
  if (process.env.NODE_ENV === 'development') {
    console.error('Error Details:', {
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      body: req.body,
      params: req.params,
      query: req.query
    });
  } else {
    console.error('Error:', err.message);
  }

  // Erro de validação do Joi
  if (err.isJoi) {
    const message = err.details.map(detail => detail.message).join(', ');
    return res.status(400).json({
      success: false,
      error: {
        type: 'ValidationError',
        message: 'Dados inválidos fornecidos',
        details: message
      }
    });
  }

  // Erro do Prisma - Registro duplicado
  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'campo';
    return res.status(409).json({
      success: false,
      error: {
        type: 'ConflictError',
        message: `Já existe um registro com este ${field}`,
        field: field
      }
    });
  }

  // Erro do Prisma - Registro não encontrado
  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      error: {
        type: 'NotFoundError',
        message: 'Registro não encontrado'
      }
    });
  }

  // Erro do Prisma - Violação de constraint
  if (err.code === 'P2003') {
    return res.status(400).json({
      success: false,
      error: {
        type: 'ConstraintError',
        message: 'Operação violaria uma restrição do banco de dados'
      }
    });
  }

  // Erro de JWT inválido
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        type: 'AuthenticationError',
        message: 'Token de acesso inválido'
      }
    });
  }

  // Erro de JWT expirado
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        type: 'AuthenticationError',
        message: 'Token de acesso expirado'
      }
    });
  }

  // Erro de sintaxe JSON
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: {
        type: 'SyntaxError',
        message: 'JSON inválido no corpo da requisição'
      }
    });
  }

  // Erros customizados da aplicação
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        type: err.type || 'ApplicationError',
        message: err.message
      }
    });
  }

  // Erro interno do servidor (fallback)
  res.status(500).json({
    success: false,
    error: {
      type: 'InternalServerError',
      message: process.env.NODE_ENV === 'development' 
        ? err.message 
        : 'Erro interno do servidor'
    }
  });
};

module.exports = errorHandler;