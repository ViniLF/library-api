const jwt = require('jsonwebtoken');

/**
 * Configurações e utilitários para JWT
 */
class JWTConfig {
  constructor() {
    this.secret = process.env.JWT_SECRET;
    this.refreshSecret = process.env.JWT_REFRESH_SECRET;
    this.expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    this.refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '30d';
    
    if (!this.secret || !this.refreshSecret) {
      throw new Error('JWT secrets must be defined in environment variables');
    }
  }

  /**
   * Gera um access token
   */
  generateAccessToken(payload) {
    return jwt.sign(payload, this.secret, {
      expiresIn: this.expiresIn,
      issuer: 'library-api',
      audience: 'library-users'
    });
  }

  /**
   * Gera um refresh token
   */
  generateRefreshToken(payload) {
    return jwt.sign(payload, this.refreshSecret, {
      expiresIn: this.refreshExpiresIn,
      issuer: 'library-api',
      audience: 'library-users'
    });
  }

  /**
   * Verifica e decodifica um access token
   */
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, this.secret, {
        issuer: 'library-api',
        audience: 'library-users'
      });
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  }

  /**
   * Verifica e decodifica um refresh token
   */
  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, this.refreshSecret, {
        issuer: 'library-api',
        audience: 'library-users'
      });
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  /**
   * Gera um par de tokens (access + refresh)
   */
  generateTokenPair(payload) {
    const tokenPayload = {
      id: payload.id,
      email: payload.email,
      role: payload.role
    };

    return {
      accessToken: this.generateAccessToken(tokenPayload),
      refreshToken: this.generateRefreshToken({ id: payload.id }),
      expiresIn: this.expiresIn
    };
  }
}

module.exports = new JWTConfig();