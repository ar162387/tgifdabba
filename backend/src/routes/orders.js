import express from 'express';
import orderController from '../controllers/orderController.js';
import { authenticateToken } from '../middleware/auth.js';
import { createOrder, general, realtimeLimiter } from '../middleware/rateLimit.js';
import { 
  validateOrderCreation, 
  validateOrderStatusUpdate, 
  validateOrderCancellation 
} from '../middleware/validate.js';

const router = express.Router();

// Public routes (no authentication required)
router.post(
  '/',
  createOrder,
  validateOrderCreation,
  orderController.createOrder
);

// Create order with successful payment (for Stripe payments)
router.post(
  '/with-payment',
  createOrder,
  validateOrderCreation,
  orderController.createOrderWithPayment
);

router.get(
  '/:orderId',
  general,
  orderController.getOrderById
);

router.get(
  '/customer/:email',
  general,
  orderController.getOrdersByCustomer
);

// Protected routes (authentication required)
router.get(
  '/',
  authenticateToken,
  realtimeLimiter, // Use more lenient rate limiter for frequent polling
  orderController.getOrders
);

router.patch(
  '/:orderId/status',
  authenticateToken,
  general,
  validateOrderStatusUpdate,
  orderController.updateOrderStatus
);

router.patch(
  '/:orderId/cancel',
  authenticateToken,
  general,
  validateOrderCancellation,
  orderController.cancelOrder
);

router.patch(
  '/:orderId/payment-status',
  authenticateToken,
  general,
  orderController.updatePaymentStatus
);

router.get(
  '/stats/overview',
  authenticateToken,
  general,
  orderController.getOrderStats
);

router.delete(
  '/:orderId',
  authenticateToken,
  general,
  orderController.deleteOrder
);

router.post(
  '/bulk-delete',
  authenticateToken,
  general,
  orderController.bulkDeleteOrders
);

// Stripe-specific routes
router.post(
  '/:orderId/confirm-payment',
  authenticateToken,
  general,
  orderController.confirmStripePayment
);

router.post(
  '/:orderId/refund',
  authenticateToken,
  general,
  orderController.createStripeRefund
);


export default router;
