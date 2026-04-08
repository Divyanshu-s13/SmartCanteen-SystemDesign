/**
 * SmartCanteen Backend Server
 * Main entry point for the application
 */

import express, { Application } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware';
import { disconnectDatabase, testConnection } from './config/database';
import { createWebSocketHandler } from './websocket';
import { orderService } from './services';

// Create Express app
const app: Application = express();

// Create HTTP server
const httpServer = createServer(app);

// Initialize WebSocket
const wsHandler = createWebSocketHandler(httpServer);

const defaultOrigins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'];
const configuredOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = Array.from(new Set([...defaultOrigins, ...configuredOrigins]));

const isLocalDevOrigin = (origin: string): boolean => {
  try {
    const parsed = new URL(origin);
    return parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
  } catch {
    return false;
  }
};

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser clients and same-origin requests without an Origin header.
    if (
      !origin
      || allowedOrigins.includes(origin)
      || (process.env.NODE_ENV !== 'production' && isLocalDevOrigin(origin))
    ) {
      callback(null, true);
      return;
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// API Routes
app.use('/api', routes);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

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

    // Initialize queue from database
    await orderService.initializeQueue();

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
