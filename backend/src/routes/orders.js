import express from 'express';
import {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  markOrderAsRead,
  getOrderStats
} from '../controllers/orderController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateOrderUpdate } from '../middleware/validate.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Order routes
router.get('/', getAllOrders);
router.get('/stats', getOrderStats);
router.get('/:id', getOrderById);
router.patch('/:id/status', validateOrderUpdate, updateOrderStatus);
router.patch('/:id/read', markOrderAsRead);

export default router;
