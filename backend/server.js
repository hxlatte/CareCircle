const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const auth = require('./middleware/auth');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', // Allow specific frontend in production
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true
}));
app.use(express.json());

// Root API check
app.get('/api', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const maskedUri = process.env.MONGO_URI ? 
    process.env.MONGO_URI.replace(/\/\/.*@/, '//****:****@') : 'not set';

  res.json({ 
    status: 'CareCircle API is running', 
    env: process.env.NODE_ENV,
    database: states[dbState] || 'unknown',
    dbError: lastDbError,
    uriFound: maskedUri,
    config: {
      hasMongoUri: !!process.env.MONGO_URI,
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasGroqKey: !!process.env.GROQ_API_KEY
    }
  });
});

// Define Routes (Synchronous registration for Vercel)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/checkin', require('./routes/checkin'));
app.use('/api/medications', require('./routes/medications'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/health', require('./routes/health'));
app.use('/api/history', require('./routes/history'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/insights', require('./routes/insights'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/reminders', require('./routes/reminders'));
app.use('/api/linking', require('./routes/linking'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/family', require('./routes/family'));
app.use('/api/assistant', require('./routes/assistant'));
app.use('/api/community', require('./routes/community'));
app.use('/api/medical-records', require('./routes/medicalRecords'));

// Serve Static Files
app.use('/uploads', express.static('uploads'));

let lastDbError = null;

const startServer = async () => {
  try {
    let mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI is not defined in the environment variables');
    }

    console.log('Attempting to connect to MongoDB Atlas...');
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 30000 });
    console.log('MongoDB Connected successfully to Atlas');
    lastDbError = null;

    const PORT = process.env.PORT || 5000;
    // Only listen if not running as a Vercel function
    if (process.env.NODE_ENV !== 'production') {
      app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
    }
  } catch (error) {
    lastDbError = error.message;
    console.error('Critical Error starting server / connecting to MongoDB:', error);
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
};

// Global Error Handler for Debugging Production 500s
app.use((err, req, res, next) => {
  console.error('SERVER ERROR:', err);
  res.status(500).json({ 
    msg: 'Server Error', 
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined 
  });
});

startServer();

module.exports = app; // Export for Vercel
