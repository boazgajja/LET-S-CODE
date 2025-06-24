const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://boazgajja:boaz%400099@problemset.ruvpee3.mongodb.net/problemset?retryWrites=true&w=majority&appName=problemset';

// Connect to MongoDB database
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully!');
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
};

// Disconnect from MongoDB database
const disconnectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('Database connection closed.');
    }
  } catch (error) {
    console.error('Error closing database connection:', error.message);
  }
};

module.exports = { connectDB, disconnectDB };