/**
 * MongoDB Setup Script
 * Ensures database connection and model indexes are created
 */

import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase } from './database';
import {
  MenuItemDocumentModel,
  OrderDocumentModel,
  PaymentDocumentModel,
  UserDocumentModel
} from '../db/models';

dotenv.config();

const setupDatabase = async (): Promise<void> => {
  try {
    await connectDatabase();

    await Promise.all([
      UserDocumentModel.syncIndexes(),
      MenuItemDocumentModel.syncIndexes(),
      OrderDocumentModel.syncIndexes(),
      PaymentDocumentModel.syncIndexes()
    ]);

    console.log('MongoDB setup completed successfully');
  } catch (error) {
    console.error('MongoDB setup failed:', error);
    throw error;
  } finally {
    await disconnectDatabase();
  }
};

setupDatabase()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
