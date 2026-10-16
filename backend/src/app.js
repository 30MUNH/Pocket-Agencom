const express = require('express');
const cors = require('cors');

const apiRoutes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');
const { success } = require('./utils/response');

function createApp() {
  const app = express();
  const allowedOrigins = (process.env.FRONTEND_URL || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => {
      try {
        return new URL(value).origin;
      } catch {
        return value.replace(/\/+$/, '');
      }
    });
  const corsOptions = {
    origin: (origin, callback) => {
      callback(null, !origin || allowedOrigins.includes(origin) || allowedOrigins.length === 0);
    },
    credentials: true,
  };

  app.use(cors(corsOptions));
  app.use(express.json());
  app.get('/api/health', (req, res) => {
    success(res, { status: 'UP', message: 'Pocket Agencom API is healthy!' });
  });
  app.get('/', (req, res) => {
    success(res, { message: 'Welcome to the Pocket Agencom API!' });
  });
  app.use('/api', apiRoutes);
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      data: null,
      error: { message: 'Route not found' },
    });
  });
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
