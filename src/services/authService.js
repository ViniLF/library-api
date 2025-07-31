const bcrypt = require('bcryptjs');
const database = require('../config/database');
const jwtConfig = require('../config/jwt');

class AuthService {
  constructor() {
    this.prisma = database.getClient();
  }

  async register(userData) {
    const { name, email, password, role = 'USER' } = userData;

    const existingUser = await this.prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      const error = new Error('Usuário já existe com este email');
      error.statusCode = 409;
      error.type = 'ConflictError';
      throw error;
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    try {
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
      if (error.code === 'P2002') {
        const conflictError = new Error('Email já está em uso');
        conflictError.statusCode = 409;
        conflictError.type = 'ConflictError';
        throw conflictError;
      }
      throw error;
    }
  }

  async login(credentials) {
    const { email, password } = credentials;

    const user = await this.prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      const error = new Error('Credenciais inválidas');
      error.statusCode = 401;
      error.type = 'AuthenticationError';
      throw error;
    }

    if (!user.isActive) {
      const error = new Error('Conta desativada. Entre em contato com o administrador');
      error.statusCode = 401;
      error.type = 'AuthenticationError';
      throw error;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      const error = new Error('Credenciais inválidas');
      error.statusCode = 401;
      error.type = 'AuthenticationError';
      throw error;
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    const tokens = jwtConfig.generateTokenPair(tokenPayload);
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      tokens
    };
  }

  async refreshToken(refreshToken) {
    try {
      const decoded = jwtConfig.verifyRefreshToken(refreshToken);

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true
        }
      });

      if (!user || !user.isActive) {
        const error = new Error('Usuário não encontrado ou inativo');
        error.statusCode = 401;
        error.type = 'AuthenticationError';
        throw error;
      }

      const tokenPayload = {
        id: user.id,
        email: user.email,
        role: user.role
      };

      const tokens = jwtConfig.generateTokenPair(tokenPayload);
      return { tokens };

    } catch (error) {
      if (error.message.includes('token')) {
        const authError = new Error('Refresh token inválido ou expirado');
        authError.statusCode = 401;
        authError.type = 'AuthenticationError';
        throw authError;
      }
      throw error;
    }
  }

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

  async emailExists(email) {
    const user = await this.prisma.user.findUnique({
      where: { email }
    });
    return !!user;
  }
}

module.exports = new AuthService();