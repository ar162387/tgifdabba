import express from 'express';
import {
  getNotificationCounters,
  getRecentActivity
} from '../controllers/notificationController.js';
import { authenticateToken } from '../middleware/auth.js';
import { notificationLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Notification routes with lenient rate limiting
router.get('/counters', notificationLimiter, getNotificationCounters);
router.get('/activity', notificationLimiter, getRecentActivity);

export default router;
