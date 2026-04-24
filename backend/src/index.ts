/**
 * SmartCanteen Backend Server
 * Main entry point for the application
 */

import { createServer } from 'http';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import { disconnectDatabase, testConnection } from './config/database';
import { createWebSocketHandler } from './websocket';
import { createApp } from './app';

// Create Express app
const app = createApp();

// Create HTTP server
const httpServer = createServer(app);

// Initialize WebSocket
const wsHandler = createWebSocketHandler(httpServer);

// Start server
const PORT = parseInt(process.env.PORT || '5000', 10);

const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('Failed to connect to database. Exiting...');
      process.exit(1);
    }

    // Start listening
    httpServer.listen(PORT, () => {
      console.log('');
      console.log('='.repeat(50));
      console.log('  SmartCanteen Backend Server');
      console.log('='.repeat(50));
      console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`  Server running on: http://localhost:${PORT}`);
      console.log(`  API endpoint: http://localhost:${PORT}/api`);
      console.log(`  WebSocket: ws://localhost:${PORT}`);
      console.log('='.repeat(50));
      console.log('');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  httpServer.close(async () => {
    await disconnectDatabase();
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\nShutting down gracefully...');
  httpServer.close(async () => {
    await disconnectDatabase();
    console.log('Server closed');
    process.exit(0);
  });
});

// Export for testing
export { app, httpServer, wsHandler };

// Start server
startServer();
