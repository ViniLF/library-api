const { PrismaClient } = require('@prisma/client');

/**
 * Configuração e inicialização do cliente Prisma
 * Implementa padrão Singleton para garantir uma única instância
 */
class Database {
  constructor() {
    if (!Database.instance) {
      this.prisma = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
        errorFormat: 'pretty',
      });
      
      Database.instance = this;
    }
    
    return Database.instance;
  }

  /**
   * Conecta ao banco de dados
   */
  async connect() {
    try {
      await this.prisma.$connect();
      console.log('✅ Database connected successfully');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      process.exit(1);
    }
  }

  /**
   * Desconecta do banco de dados
   */
  async disconnect() {
    try {
      await this.prisma.$disconnect();
      console.log('✅ Database disconnected successfully');
    } catch (error) {
      console.error('❌ Database disconnection failed:', error);
    }
  }

  /**
   * Retorna a instância do Prisma Client
   */
  getClient() {
    return this.prisma;
  }

  /**
   * Executa uma transação
   */
  async transaction(callback) {
    return await this.prisma.$transaction(callback);
  }
}

// Exporta uma instância única (Singleton)
const database = new Database();
module.exports = database;