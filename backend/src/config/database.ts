/**
 * Database Configuration
 * MongoDB connection setup with Mongoose
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_canteen';

export const connectDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  await mongoose.connect(mongoUri);
};

export const disconnectDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
};

export const testConnection = async (): Promise<boolean> => {
  try {
    await connectDatabase();
    console.log('MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    return false;
  }
};
