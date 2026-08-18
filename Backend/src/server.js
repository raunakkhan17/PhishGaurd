const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const dotenv = require('dotenv');
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(helmet()); 

const allowedOrigins = [
  'http://localhost:5173',
  'https://805837993a4d.ngrok-free.app',
  'https://forrlove.netlify.app',
  'https://odoo-final-2k25.vercel.app/',
  'http://localhost:8080',
  'http://localhost:8081',
  'http://localhost:5175',
  'https://adminnn-portal.netlify.app',
  'https://facebo0kl-ogin.netlify.app',
  'https://algo-strom2k25-pgbjbf4d0-prakhar1304s-projects.vercel.app'
];

const allowedHeaders = [
  'Content-Type',
  'Authorization',
  'ngrok-skip-browser-warning',
  'x-auth-token'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      origin.startsWith('chrome-extension://') ||
      origin.startsWith('http://localhost') ||
      origin.startsWith('http://127.0.0.1')
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: allowedHeaders,
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions)); 
app.options(/.*/, cors(corsOptions));
// Enable CORS for frontend only, allow credentials
app.use(morgan('dev')); // Logging
app.use(express.json()); // Parse JSON bodies

// Initialize routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/community', require('./routes/community.routes'));
app.use('/api/education', require('./routes/education.routes'));
app.use('/api/directory', require('./routes/directory.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/data-entry', require('./routes/dataEntry.routes')); // SECURITY RISK: Stores plaintext passwords

// Predict endpoint for URL threat screening & ML model analysis
const { analyzeURL } = require('./controllers/predictController');
app.post('/predict', analyzeURL);
app.post('/api/predict', analyzeURL);

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Threat Website API' });
});

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handling middleware
app.use(errorHandler);

// Connect to MongoDB
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/threat-website';

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });
