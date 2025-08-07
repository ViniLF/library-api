const { registerSchema, loginSchema, refreshTokenSchema } = require('../../../src/validators/authValidators');

describe('Auth Validators', () => {
  describe('registerSchema', () => {
    it('should validate valid registration data', () => {
      const validData = {
        name: 'João Pedro',
        email: 'joao@example.com',
        password: 'password123',
        role: 'USER'
      };

      const { error, value } = registerSchema.validate(validData);

      expect(error).toBeUndefined();
      expect(value).toMatchObject(validData);
    });

    it('should set default role to USER', () => {
      const data = {
        name: 'João Pedro',
        email: 'joao@example.com',
        password: 'password123'
      };

      const { error, value } = registerSchema.validate(data);

      expect(error).toBeUndefined();
      expect(value.role).toBe('USER');
    });

    it('should require name', () => {
      const data = {
        email: 'joao@example.com',
        password: 'password123'
      };

      const { error } = registerSchema.validate(data);

      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('Nome é obrigatório');
    });

    it('should validate name length', () => {
      const data = {
        name: 'A',
        email: 'joao@example.com',
        password: 'password123'
      };

      const { error } = registerSchema.validate(data);

      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('Nome deve ter pelo menos 2 caracteres');
    });

    it('should require valid email', () => {
      const data = {
        name: 'João Pedro',
        email: 'invalid-email',
        password: 'password123'
      };

      const { error } = registerSchema.validate(data);

      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('Email deve ter um formato válido');
    });

    it('should require password', () => {
      const data = {
        name: 'João Pedro',
        email: 'joao@example.com'
      };

      const { error } = registerSchema.validate(data);

      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('Senha é obrigatória');
    });

    it('should validate password length', () => {
      const data = {
        name: 'João Pedro',
        email: 'joao@example.com',
        password: '123'
      };

      const { error } = registerSchema.validate(data);

      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('Senha deve ter pelo menos 6 caracteres');
    });

    it('should validate role enum', () => {
      const data = {
        name: 'João Pedro',
        email: 'joao@example.com',
        password: 'password123',
        role: 'INVALID_ROLE'
      };

      const { error } = registerSchema.validate(data);

      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('Role deve ser USER, LIBRARIAN ou ADMIN');
    });

    it('should strip unknown fields', () => {
      const data = {
        name: 'João Pedro',
        email: 'joao@example.com',
        password: 'password123',
        unknownField: 'should be removed'
      };

      const { error, value } = registerSchema.validate(data, { stripUnknown: true });

      expect(error).toBeUndefined();
      expect(value).not.toHaveProperty('unknownField');
    });
  });

  describe('loginSchema', () => {
    it('should validate valid login data', () => {
      const validData = {
        email: 'joao@example.com',
        password: 'password123'
      };

      const { error, value } = loginSchema.validate(validData);

      expect(error).toBeUndefined();
      expect(value).toMatchObject(validData);
    });

    it('should require email', () => {
      const data = {
        password: 'password123'
      };

      const { error } = loginSchema.validate(data);

      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('Email é obrigatório');
    });

    it('should require valid email format', () => {
      const data = {
        email: 'invalid-email',
        password: 'password123'
      };

      const { error } = loginSchema.validate(data);

      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('Email deve ter um formato válido');
    });

    it('should require password', () => {
      const data = {
        email: 'joao@example.com'
      };

      const { error } = loginSchema.validate(data);

      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('Senha é obrigatória');
    });

    it('should accept empty password for validation only', () => {
      // Nota: A validação de senha vazia é tratada no service, não no validator
      const data = {
        email: 'joao@example.com',
        password: ''
      };

      const { error } = loginSchema.validate(data);

      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('Senha é obrigatória');
    });
  });

  describe('refreshTokenSchema', () => {
    it('should validate valid refresh token data', () => {
      const validData = {
        refreshToken: 'valid.refresh.token'
      };

      const { error, value } = refreshTokenSchema.validate(validData);

      expect(error).toBeUndefined();
      expect(value).toMatchObject(validData);
    });

    it('should require refresh token', () => {
      const data = {};

      const { error } = refreshTokenSchema.validate(data);

      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('Refresh token é obrigatório');
    });

    it('should not accept empty refresh token', () => {
      const data = {
        refreshToken: ''
      };

      const { error } = refreshTokenSchema.validate(data);

      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('Refresh token é obrigatório');
    });
  });
});