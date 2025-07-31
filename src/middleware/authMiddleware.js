const jwtConfig = require('../config/jwt');
const authService = require('../services/authService');

class AuthMiddleware {

  /**
   * Verifica se o usuário está autenticado
   */
  async authenticate(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        const error = new Error('Token de acesso não fornecido');
        error.statusCode = 401;
        error.type = 'AuthenticationError';
        return next(error);
      }

      const parts = authHeader.split(' ');
      if (parts.length !== 2 || parts[0] !== 'Bearer') {
        const error = new Error('Formato do token inválido. Use: Bearer <token>');
        error.statusCode = 401;
        error.type = 'AuthenticationError';
        return next(error);
      }

      const token = parts[1];
      const decoded = jwtConfig.verifyAccessToken(token);
      const user = await authService.getUserById(decoded.id);

      req.user = user;
      next();

    } catch (error) {
      if (error.message.includes('token') || error.message.includes('jwt')) {
        const authError = new Error('Token inválido ou expirado');
        authError.statusCode = 401;
        authError.type = 'AuthenticationError';
        return next(authError);
      }
      
      next(error);
    }
  }

  /**
   * Verifica se o usuário tem permissão (role)
   */
  authorize(...allowedRoles) {
    return (req, res, next) => {
      try {
        if (!req.user) {
          const error = new Error('Usuário não autenticado');
          error.statusCode = 401;
          error.type = 'AuthenticationError';
          return next(error);
        }

        const userRole = req.user.role;
        
        if (!allowedRoles.includes(userRole)) {
          const error = new Error('Acesso negado. Permissões insuficientes');
          error.statusCode = 403;
          error.type = 'AuthorizationError';
          return next(error);
        }

        next();

      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Autenticação opcional - não falha se token não existir
   */
  async optionalAuth(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        return next();
      }

      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        const token = parts[1];
        
        try {
          const decoded = jwtConfig.verifyAccessToken(token);
          const user = await authService.getUserById(decoded.id);
          req.user = user;
        } catch (error) {
          // Token inválido é ignorado na auth opcional
        }
      }
      
      next();

    } catch (error) {
      next(error);
    }
  }

  /**
   * Verifica se usuário pode acessar seus próprios dados
   */
  checkResourceOwnership(paramName = 'userId') {
    return (req, res, next) => {
      try {
        const loggedUserId = req.user.id;
        const resourceUserId = req.params[paramName];

        // Admin pode acessar qualquer recurso
        if (req.user.role === 'ADMIN') {
          return next();
        }

        if (loggedUserId !== resourceUserId) {
          const error = new Error('Acesso negado. Você só pode acessar seus próprios dados');
          error.statusCode = 403;
          error.type = 'AuthorizationError';
          return next(error);
        }

        next();

      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Combina autenticação + autorização
   */
  requireAuth(...allowedRoles) {
    if (allowedRoles.length === 0) {
      return this.authenticate;
    }
    
    return [
      this.authenticate,
      this.authorize(...allowedRoles)
    ];
  }
}

const authMiddleware = new AuthMiddleware();

module.exports = {
  authenticate: authMiddleware.authenticate.bind(authMiddleware),
  authorize: authMiddleware.authorize.bind(authMiddleware),
  optionalAuth: authMiddleware.optionalAuth.bind(authMiddleware),
  checkResourceOwnership: authMiddleware.checkResourceOwnership.bind(authMiddleware),
  requireAuth: authMiddleware.requireAuth.bind(authMiddleware)
};