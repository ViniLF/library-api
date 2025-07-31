const express = require('express');
const authController = require('../controllers/authController');
const { validateRegister, validateLogin, validateRefreshToken } = require('../validators/authValidators');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Registrar novo usuário
 * @access  Public
 */
router.post('/register', validateRegister, authController.register);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Fazer login
 * @access  Public
 */
router.post('/login', validateLogin, authController.login);

/**
 * @route   POST /api/v1/auth/refresh-token
 * @desc    Renovar access token
 * @access  Public
 */
router.post('/refresh-token', validateRefreshToken, authController.refreshToken);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Obter perfil do usuário logado
 * @access  Private
 */
router.get('/me', authenticate, authController.getProfile);

/**
 * @route   GET /api/v1/auth/verify-token
 * @desc    Verificar se token é válido
 * @access  Private
 */
router.get('/verify-token', authenticate, authController.verifyToken);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Fazer logout
 * @access  Private
 */
router.post('/logout', authenticate, authController.logout);

module.exports = router;