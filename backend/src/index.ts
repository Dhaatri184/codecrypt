import dotenv from 'dotenv';
dotenv.config();

import { createServer } from 'http';
import app from './app';
import { logger } from './utils/logger';
import { query } from './db';
// import './workers/scanWorker'; // Disabled - using separate scanner service
import { initializeWebSocket } from './websocket';

const PORT = process.env.PORT || 4000;

// Test database connection
async function testDatabaseConnection() {
  try {
    await query('SELECT NOW()');
    logger.info('Database connection established');
  } catch (error) {
    logger.error('Failed to connect to database', { error });
    process.exit(1);
  }
}

// Start server
async function startServer() {
  try {
    await testDatabaseConnection();

    // Create HTTP server
    const httpServer = createServer(app);

    // Initialize WebSocket
    initializeWebSocket(httpServer);
    logger.info('WebSocket server initialized');

    httpServer.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { 
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});
