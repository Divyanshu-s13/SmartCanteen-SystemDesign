import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware';
import { connectDatabase } from './config/database';
import { orderService } from './services';

dotenv.config();

const defaultOrigins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'];
const normalizeOrigin = (origin: string): string => origin.trim().replace(/\/$/, '');

const configuredOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => normalizeOrigin(origin))
  .filter(Boolean);
const allowedOrigins = Array.from(new Set([...defaultOrigins.map(normalizeOrigin), ...configuredOrigins]));

const isLocalDevOrigin = (origin: string): boolean => {
  try {
    const parsed = new URL(origin);
    return parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
  } catch {
    return false;
  }
};

let queueInitializationPromise: Promise<void> | null = null;

const ensureBackendReady = async (): Promise<void> => {
  await connectDatabase();

  if (!queueInitializationPromise) {
    queueInitializationPromise = orderService.initializeQueue().catch((error) => {
      queueInitializationPromise = null;
      throw error;
    });
  }

  await queueInitializationPromise;
};

export const createApp = (): Application => {
  const app: Application = express();

  app.use(cors({
    origin: (_origin, callback) => {
      callback(null, true);
    },
    credentials: true
  }));

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  if (process.env.NODE_ENV === 'development') {
    app.use((req: Request, _res: Response, next: NextFunction) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  app.use(async (_req: Request, _res: Response, next: NextFunction) => {
    try {
      await ensureBackendReady();
      next();
    } catch (error) {
      next(error);
    }
  });

  app.use('/api', routes);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
