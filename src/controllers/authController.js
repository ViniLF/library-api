const authService = require('../services/authService');

class AuthController {
  
  async register(req, res, next) {
    try {
      const userData = req.body;
      const user = await authService.register(userData);

      res.status(201).json({
        success: true,
        message: 'Usuário registrado com sucesso',
        data: { user }
      });

    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const credentials = req.body;
      const result = await authService.login(credentials);

      res.status(200).json({
        success: true,
        message: 'Login realizado com sucesso',
        data: {
          user: result.user,
          tokens: result.tokens
        }
      });

    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshToken(refreshToken);

      res.status(200).json({
        success: true,
        message: 'Token renovado com sucesso',
        data: { tokens: result.tokens }
      });

    } catch (error) {
      next(error);
    }
  }

  async getProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const user = await authService.getUserById(userId);

      res.status(200).json({
        success: true,
        message: 'Perfil obtido com sucesso',
        data: { user }
      });

    } catch (error) {
      next(error);
    }
  }

  async verifyToken(req, res, next) {
    try {
      res.status(200).json({
        success: true,
        message: 'Token válido',
        data: {
          user: req.user,
          tokenValid: true
        }
      });

    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      res.status(200).json({
        success: true,
        message: 'Logout realizado com sucesso',
        data: {
          message: 'Remova os tokens do lado cliente para completar o logout'
        }
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();