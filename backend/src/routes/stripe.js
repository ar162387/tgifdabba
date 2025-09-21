import express from 'express';
import stripeController from '../controllers/stripeController.js';
import { general } from '../middleware/rateLimit.js';

const router = express.Router();

// Create payment intent
router.post(
  '/create-payment-intent',
  general,
  stripeController.createPaymentIntent
);

export default router;
