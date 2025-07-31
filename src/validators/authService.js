const bcrypt = require('bcryptjs');
const database = require('../config/database');
const jwtConfig = require('../config/jwt');

/**
 * Serviço de autenticação
 * Contém toda a lógica de negócio relacionada à autenticação
 */
class AuthService {
  constructor() {
    this.prisma = database.getClient();
  }

  /**
   * Registra um novo usuário
   * @param {Object} userData - Dados do usuário (name, email, password, role)
   * @returns {Object} Usuário criado sem a senha
   */
  async register(userData) {
    const { name, email, password, role = 'USER' } = userData;

    // Verificar se usuário já existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      const error = new Error('Usuário já existe com este email');
      error.statusCode = 409;
      error.type = 'ConflictError';
      throw error;
    }

    // Hash da senha
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    try {
      // Criar usuário
      const user = await this.prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true
        }
      });

      return user;
    } catch (error) {
      // Se for erro de constraint (email único), tratar especificamente
      if (error.code === 'P2002') {
        const conflictError = new Error('Email já está em uso');
        conflictError.statusCode = 409;
        conflictError.type = 'ConflictError';
        throw conflictError;
      }
      throw error;
    }
  }

  /**
   * Autentica um usuário (login)
   * @param {Object} credentials - Email e senha
   * @returns {Object} Tokens de acesso e dados do usuário
   */
  async login(credentials) {
    const { email, password } = credentials;

    // Buscar usuário por email
    const user = await this.prisma.user.findUnique({
      where: { email }
    });

    // Verificar se usuário existe
    if (!user) {
      const error = new Error('Credenciais inválidas');
      error.statusCode = 401;
      error.type = 'AuthenticationError';
      throw error;
    }

    // Verificar se usuário está ativo
    if (!user.isActive) {
      const error = new Error('Conta desativada. Entre em contato com o administrador');
      error.statusCode = 401;
      error.type = 'AuthenticationError';
      throw error;
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      const error = new Error('Credenciais inválidas');
      error.statusCode = 401;
      error.type = 'AuthenticationError';
      throw error;
    }

    // Gerar tokens
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    const tokens = jwtConfig.generateTokenPair(tokenPayload);

    // Retornar dados do usuário (sem senha) e tokens
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      tokens
    };
  }

  /**
   * Renova o access token usando refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Object} Novos tokens
   */
  async refreshToken(refreshToken) {
    try {
      // Verificar refresh token
      const decoded = jwtConfig.verifyRefreshToken(refreshToken);

      // Buscar usuário
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true
        }
      });

      // Verificar se usuário ainda existe e está ativo
      if (!user || !user.isActive) {
        const error = new Error('Usuário não encontrado ou inativo');
        error.statusCode = 401;
        error.type = 'AuthenticationError';
        throw error;
      }

      // Gerar novos tokens
      const tokenPayload = {
        id: user.id,
        email: user.email,
        role: user.role
      };

      const tokens = jwtConfig.generateTokenPair(tokenPayload);

      return { tokens };

    } catch (error) {
      // Se erro for de JWT, criar erro customizado
      if (error.message.includes('token')) {
        const authError = new Error('Refresh token inválido ou expirado');
        authError.statusCode = 401;
        authError.type = 'AuthenticationError';
        throw authError;
      }
      throw error;
    }
  }

  /**
   * Busca usuário por ID (para middleware de autenticação)
   * @param {string} userId - ID do usuário
   * @returns {Object} Dados do usuário sem senha
   */
  async getUserById(userId) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      const error = new Error('Usuário não encontrado');
      error.statusCode = 404;
      error.type = 'NotFoundError';
      throw error;
    }

    if (!user.isActive) {
      const error = new Error('Conta desativada');
      error.statusCode = 401;
      error.type = 'AuthenticationError';
      throw error;
    }

    return user;
  }

  /**
   * Verifica se email já está em uso
   * @param {string} email - Email para verificar
   * @returns {boolean} True se email existe
   */
  async emailExists(email) {
    const user = await this.prisma.user.findUnique({
      where: { email }
    });
    return !!user;
  }
}

module.exports = new AuthService();