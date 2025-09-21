import express from 'express';
const router = express.Router();
import { streamOrders, getPendingOrdersCount, getPendingOrders } from '../controllers/realtimeController.js';
import { authenticateToken } from '../middleware/auth.js';

// SSE endpoint for realtime order notifications
router.get('/orders', streamOrders);

// Get pending orders count
router.get('/pending-count', authenticateToken, getPendingOrdersCount);

// Get pending orders for notification panel
router.get('/pending-orders', authenticateToken, getPendingOrders);

export default router;
