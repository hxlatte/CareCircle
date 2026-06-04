const mongoose = require('mongoose');
require('dotenv').config();

const clearDatabase = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, { 
      serverSelectionTimeoutMS: 5000 
    });
    console.log('Connected.');

    const collections = ['users', 'healthlogs', 'medications', 'tasks', 'alerts', 'reminders', 'messages', 'checkins'];
    
    for (const colName of collections) {
      try {
        await mongoose.connection.collection(colName).deleteMany({});
        console.log(`Cleared collection: ${colName}`);
      } catch (err) {
        console.log(`Collection ${colName} might not exist, skipping...`);
      }
    }

    console.log('Database cleared successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error clearing database:', err.message);
    process.exit(1);
  }
};

clearDatabase();
