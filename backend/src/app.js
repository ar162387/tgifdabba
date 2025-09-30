import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { config } from '../config.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { errorHandler, notFound } from './middleware/error.js';
import logger from './utils/logger.js';

// Import routes
import authRoutes from './routes/auth.js';
import itemRoutes from './routes/items.js';
import dailyMenuRoutes from './routes/dailyMenu.js';
import publicDailyMenuRoutes from './routes/publicDailyMenu.js';
import orderRoutes from './routes/orders.js';
import contactRoutes from './routes/contacts.js';
import publicContactRoutes from './routes/publicContact.js';
import notificationRoutes from './routes/notifications.js';
import realtimeRoutes from './routes/realtime.js';
import stripeRoutes from './routes/stripe.js';

const app = express();

// Trust proxy - required for rate limiting behind reverse proxy (Render, Heroku, etc.)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors(config.corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate limiting
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'TGIF Dabba Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api',
      docs: 'API documentation coming soon'
    },
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/cms/auth', authRoutes);
app.use('/api/cms/items', itemRoutes);
app.use('/api/cms/daily-menu', dailyMenuRoutes);
app.use('/api/cms/orders', orderRoutes);
app.use('/api/cms/contacts', contactRoutes);
app.use('/api/cms/notifications', notificationRoutes);
app.use('/api/cms/realtime', realtimeRoutes);

// Public API routes (no authentication required)
app.use('/api/daily-menu', publicDailyMenuRoutes);
app.use('/api/contact', publicContactRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/stripe', stripeRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(config.mongodbUri);
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error('MongoDB connection error', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down server...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Shutting down server...');
  await mongoose.connection.close();
  process.exit(0);
});

export { app, connectDB };
