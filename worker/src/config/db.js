const mongoose = require('mongoose');
const logger = require('../utils/logger');

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/voice_reminder';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info(`Worker MongoDB Connected: ${conn.connection.host}`);
    
    mongoose.connection.on('error', (err) => {
      logger.error({ err }, 'Worker MongoDB connection error');
    });

    mongoose.connection.on('disconnected', () => {
      logger.info('Worker MongoDB disconnected');
    });

    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('Worker MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    logger.error({ error }, 'Worker MongoDB connection failed');
    process.exit(1);
  }
};

module.exports = connectDB;
