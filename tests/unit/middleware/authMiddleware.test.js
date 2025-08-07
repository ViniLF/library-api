const { authenticate, authorize, optionalAuth } = require('../../../src/middleware/authMiddleware');
const jwtConfig = require('../../../src/config/jwt');
const authService = require('../../../src/services/authService');

jest.mock('../../../src/config/jwt');
jest.mock('../../../src/services/authService');

describe('AuthMiddleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      user: null
    };
    res = {};
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should authenticate valid token', async () => {
      const token = 'valid_token';
      const decoded = { id: 'user_id', email: 'test@email.com' };
      const user = { id: 'user_id', name: 'Test User', role: 'USER' };

      req.headers.authorization = `Bearer ${token}`;
      jwtConfig.verifyAccessToken.mockReturnValue(decoded);
      authService.getUserById.mockResolvedValue(user);

      await authenticate(req, res, next);

      expect(jwtConfig.verifyAccessToken).toHaveBeenCalledWith(token);
      expect(authService.getUserById).toHaveBeenCalledWith(decoded.id);
      expect(req.user).toEqual(user);
      expect(next).toHaveBeenCalledWith();
    });

    it('should reject request without token', async () => {
      await authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Token de acesso não fornecido',
          statusCode: 401,
          type: 'AuthenticationError'
        })
      );
    });

    it('should reject invalid token format', async () => {
      req.headers.authorization = 'InvalidFormat token';

      await authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Formato do token inválido. Use: Bearer <token>',
          statusCode: 401
        })
      );
    });

    it('should reject expired token', async () => {
      req.headers.authorization = 'Bearer expired_token';
      jwtConfig.verifyAccessToken.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Token inválido ou expirado',
          statusCode: 401
        })
      );
    });
  });

  describe('authorize', () => {
    it('should allow access for correct role', () => {
      req.user = { id: 'user_id', role: 'ADMIN' };
      const authMiddleware = authorize('ADMIN', 'LIBRARIAN');

      authMiddleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should deny access for incorrect role', () => {
      req.user = { id: 'user_id', role: 'USER' };
      const authMiddleware = authorize('ADMIN');

      authMiddleware(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Acesso negado. Permissões insuficientes',
          statusCode: 403,
          type: 'AuthorizationError'
        })
      );
    });

    it('should deny access for unauthenticated user', () => {
      req.user = null;
      const authMiddleware = authorize('USER');

      authMiddleware(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Usuário não autenticado',
          statusCode: 401
        })
      );
    });
  });

  describe('optionalAuth', () => {
    it('should set user if valid token provided', async () => {
      const token = 'valid_token';
      const decoded = { id: 'user_id' };
      const user = { id: 'user_id', name: 'Test User' };

      req.headers.authorization = `Bearer ${token}`;
      jwtConfig.verifyAccessToken.mockReturnValue(decoded);
      authService.getUserById.mockResolvedValue(user);

      await optionalAuth(req, res, next);

      expect(req.user).toEqual(user);
      expect(next).toHaveBeenCalledWith();
    });

    it('should continue without user if no token', async () => {
      await optionalAuth(req, res, next);

      expect(req.user).toBeNull();
      expect(next).toHaveBeenCalledWith();
    });

    it('should continue without user if invalid token', async () => {
      req.headers.authorization = 'Bearer invalid_token';
      jwtConfig.verifyAccessToken.mockImplementation(() => {
        throw new Error('invalid token');
      });

      await optionalAuth(req, res, next);

      expect(req.user).toBeNull();
      expect(next).toHaveBeenCalledWith();
    });
  });
});