const app = require('./app');
const database = require('./config/database');

/**
 * Configuração e inicialização do servidor
 */
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

/**
 * Função para inicializar o servidor
 */
async function startServer() {
  try {
    // Conectar ao banco de dados
    await database.connect();
    
    // Iniciar o servidor
    const server = app.listen(PORT, () => {
      console.log('🚀 Server Configuration:');
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Server running on: http://${HOST}:${PORT}`);
      console.log(`   API Base URL: http://${HOST}:${PORT}/api/v1`);
      console.log(`   Health Check: http://${HOST}:${PORT}/health`);
      console.log('✅ Server started successfully!');
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`\n📡 Received ${signal}. Starting graceful shutdown...`);
      
      server.close(async () => {
        console.log('🔌 HTTP server closed');
        
        // Fechar conexão com o banco
        await database.disconnect();
        
        console.log('✅ Graceful shutdown completed');
        process.exit(0);
      });
    };

    // Listeners para sinais de shutdown
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // Listener para erros não capturados
    process.on('unhandledRejection', (err) => {
      console.error('❌ Unhandled Promise Rejection:', err);
      gracefulShutdown('UNHANDLED_REJECTION');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Inicializar servidor apenas se este arquivo for executado diretamente
if (require.main === module) {
  startServer();
}

module.exports = { startServer };