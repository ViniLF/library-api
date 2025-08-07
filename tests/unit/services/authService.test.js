const bcrypt = require('bcryptjs');
const jwtConfig = require('../../../src/config/jwt');

// Mock dependencies
jest.mock('../../../src/config/database');
jest.mock('../../../src/config/jwt');
jest.mock('bcryptjs');

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn()
  }
};

require('../../../src/config/database').getClient = jest.fn(() => mockPrisma);

// Importar o serviço DEPOIS do mock
const authService = require('../../../src/services/authService');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should create user successfully', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@email.com',
        password: 'password123',
        role: 'USER'
      };

      const hashedPassword = 'hashed_password';
      const createdUser = {
        id: 'user_id',
        name: 'Test User',
        email: 'test@email.com',
        role: 'USER',
        isActive: true,
        createdAt: new Date()
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue(hashedPassword);
      mockPrisma.user.create.mockResolvedValue(createdUser);

      const result = await authService.register(userData);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: userData.email }
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 12);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
          role: userData.role
        },
        select: expect.any(Object)
      });
      expect(result).toEqual(createdUser);
    });

    it('should throw error if user already exists', async () => {
      const userData = {
        email: 'existing@email.com',
        password: 'password123'
      };

      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing_user' });

      await expect(authService.register(userData)).rejects.toThrow('Usuário já existe com este email');
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const credentials = {
        email: 'test@email.com',
        password: 'password123'
      };

      const user = {
        id: 'user_id',
        email: 'test@email.com',
        password: 'hashed_password',
        name: 'Test User',
        role: 'USER',
        isActive: true
      };

      const tokens = {
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        expiresIn: '7d'
      };

      mockPrisma.user.findUnique.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(true);
      jwtConfig.generateTokenPair.mockReturnValue(tokens);

      const result = await authService.login(credentials);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: credentials.email }
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(credentials.password, user.password);
      expect(result.user).not.toHaveProperty('password');
      expect(result.tokens).toEqual(tokens);
    });

    it('should throw error for invalid credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.login({
        email: 'invalid@email.com',
        password: 'wrong_password'
      })).rejects.toThrow('Credenciais inválidas');
    });

    it('should throw error for inactive user', async () => {
      const user = {
        id: 'user_id',
        email: 'test@email.com',
        isActive: false
      };

      mockPrisma.user.findUnique.mockResolvedValue(user);

      await expect(authService.login({
        email: 'test@email.com',
        password: 'password123'
      })).rejects.toThrow('Conta desativada. Entre em contato com o administrador');
    });
  });

  describe('getUserById', () => {
    it('should return user successfully', async () => {
      const userId = 'user_id';
      const user = {
        id: userId,
        name: 'Test User',
        email: 'test@email.com',
        role: 'USER',
        isActive: true
      };

      mockPrisma.user.findUnique.mockResolvedValue(user);

      const result = await authService.getUserById(userId);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: expect.any(Object)
      });
      expect(result).toEqual(user);
    });

    it('should throw error if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.getUserById('invalid_id')).rejects.toThrow('Usuário não encontrado');
    });
  });
});