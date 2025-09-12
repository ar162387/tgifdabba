import express from 'express';
import {
  getNotificationCounters,
  getRecentActivity
} from '../controllers/notificationController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Notification routes
router.get('/counters', getNotificationCounters);
router.get('/activity', getRecentActivity);

export default router;
