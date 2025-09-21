import logger from '../utils/logger.js';
import stripeService from '../services/stripeService.js';

// Create payment intent for order
const createPaymentIntent = async (req, res) => {
  try {
    const { orderData, amount, orderId } = req.body;

    // Validate required fields
    if (!orderData || !amount || !orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order data, amount, and order ID are required'
      });
    }

    // Validate amount is a valid number
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a valid positive number'
      });
    }

    // Validate order ID format
    const orderIdRegex = /^TGIF\d{8}\d{3}$/;
    if (!orderIdRegex.test(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format'
      });
    }

    // Create payment intent with the provided order ID
    const result = await stripeService.createPaymentIntent(orderData, orderId, numericAmount);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.paymentIntent
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error || 'Failed to create payment intent'
      });
    }

  } catch (error) {
    logger.error('Error creating payment intent:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while creating payment intent'
    });
  }
};

export default {
  createPaymentIntent
};
