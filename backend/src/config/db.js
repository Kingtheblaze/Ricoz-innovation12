const mongoose = require('mongoose');

let cachedConnection = null;

/**
 * Connect to MongoDB with caching for serverless environments (Vercel) and standalone servers.
 */
const connectDB = async () => {
  if (cachedConnection && mongoose.connection.readyState >= 1) {
    return cachedConnection;
  }

  const uri = process.env.MONGODB_URI || 'mongodb+srv://hedasambhav:hedasambhav@cluster0.ppnbyll.mongodb.net/Entries?retryWrites=true&w=majority';

  try {
    cachedConnection = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      bufferCommands: false, // Recommended for serverless to fail fast if disconnected
    });
    console.log(`[MongoDB] Connected successfully: ${cachedConnection.connection.host}`);
    return cachedConnection;
  } catch (error) {
    console.error(`[MongoDB Connection Error]: ${error.message}`);
    console.warn('[MongoDB] Make sure your MongoDB Atlas instance is running and accessible (0.0.0.0/0 whitelist for Vercel).');
    throw error;
  }
};

module.exports = connectDB;
