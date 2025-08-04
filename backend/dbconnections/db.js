// dbconnections/db.js

const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://boazgajja:boaz%400099@problemset.ruvpee3.mongodb.net/problemset?retryWrites=true&w=majority&appName=problemset';

// Connect to MongoDB database
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully!');

    // Set up connection event listeners once
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected.');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected.');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error; // Re-throw to handle in the calling function
  }
};

// Disconnect from MongoDB database
const disconnectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔌 MongoDB connection closed.');
    }
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error.message);
  }
};

module.exports = { connectDB, disconnectDB };
