const mongoose = require('mongoose');

/**
 * Connect to MongoDB with retry logic and clean error handling.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/employment-contract-localizer', {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[MongoDB Connection Error]: ${error.message}`);
    // In dev or offline environments, warn clearly
    console.warn('[MongoDB] Make sure your MongoDB instance is running or update MONGODB_URI in .env');
  }
};

module.exports = connectDB;
