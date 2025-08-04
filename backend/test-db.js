const { connectDB, disconnectDB } = require('./dbconnections/db');

async function testConnection() {
  try {
    console.log('Testing MongoDB connection...');
    await connectDB();
    console.log('Connection successful!');
    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('Connection test failed:', error);
    process.exit(1);
  }
}

testConnection();