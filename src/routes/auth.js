const express = require('express');
const authController = require('../controllers/authController');
const { validateRegister, validateLogin, validateRefreshToken } = require('../validators/authValidators');
const { authenticate } = require('../middleware/authMiddleware');
const { auditLogger } = require('../middleware/loggerMiddleware');

const router = express.Router();

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Registrar novo usuário
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *       409:
 *         description: Email já cadastrado
 *       429:
 *         description: Muitas tentativas de registro
 */
router.post('/register', 
  validateRegister, 
  auditLogger('USER_REGISTER', 'user'),
  authController.register
);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Fazer login
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *       401:
 *         description: Credenciais inválidas
 *       429:
 *         description: Muitas tentativas de login
 */
router.post('/login', 
  validateLogin, 
  auditLogger('USER_LOGIN', 'auth'),
  authController.login
);

/**
 * @swagger
 * /api/v1/auth/refresh-token:
 *   post:
 *     summary: Renovar access token
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token renovado com sucesso
 *       401:
 *         description: Refresh token inválido
 *       429:
 *         description: Muitas tentativas de renovação
 */
router.post('/refresh-token', 
  validateRefreshToken, 
  auditLogger('TOKEN_REFRESH', 'auth'),
  authController.refreshToken
);

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Obter perfil do usuário logado
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil do usuário
 *       401:
 *         description: Token inválido
 */
router.get('/me', authenticate, authController.getProfile);

/**
 * @swagger
 * /api/v1/auth/verify-token:
 *   get:
 *     summary: Verificar se token é válido
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token válido
 *       401:
 *         description: Token inválido
 */
router.get('/verify-token', authenticate, authController.verifyToken);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Fazer logout
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout realizado com sucesso
 *       401:
 *         description: Token inválido
 */
router.post('/logout', 
  authenticate, 
  auditLogger('USER_LOGOUT', 'auth'),
  authController.logout
);

module.exports = router;