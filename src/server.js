const app = require('./app');
const database = require('./config/database');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

async function startServer() {
  try {
    await database.connect();
    
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
        await database.disconnect();
        console.log('✅ Graceful shutdown completed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    process.on('unhandledRejection', (err) => {
      console.error('❌ Unhandled Promise Rejection:', err);
      gracefulShutdown('UNHANDLED_REJECTION');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { startServer };