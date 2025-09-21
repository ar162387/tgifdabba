import Stripe from 'stripe';
import logger from '../utils/logger.js';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  typescript: false,
});

class StripeService {
  constructor() {
    this.stripe = stripe;
  }

  /**
   * Create a payment intent for an order
   * @param {Object} order - The order object
   * @param {string} orderId - The order ID
   * @param {number} amount - Amount in pence (Stripe uses smallest currency unit)
   * @param {string} currency - Currency code (default: 'gbp')
   * @returns {Promise<Object>} Payment intent object
   */
  async createPaymentIntent(order, orderId, amount, currency = 'gbp') {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: this.formatAmountForStripe(amount), // Convert to pence with proper precision
        currency: currency.toLowerCase(),
        metadata: {
          orderId: orderId,
          customerEmail: order.customer.email,
          deliveryType: order.delivery.type,
          itemCount: order.items.length.toString()
        },
        description: `Order ${orderId} - ${order.items.length} item(s)`,
        payment_method_types: ['card'],
        capture_method: 'automatic',
      });

      logger.info(`Payment intent created for order ${orderId}`, {
        paymentIntentId: paymentIntent.id,
        amount: amount,
        currency: currency
      });

      return {
        success: true,
        paymentIntent: {
          id: paymentIntent.id,
          clientSecret: paymentIntent.client_secret,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency
        }
      };
    } catch (error) {
      logger.error('Error creating payment intent:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Retrieve a payment intent by ID
   * @param {string} paymentIntentId - Stripe payment intent ID
   * @returns {Promise<Object>} Payment intent object
   */
  async getPaymentIntent(paymentIntentId) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      return {
        success: true,
        paymentIntent
      };
    } catch (error) {
      logger.error('Error retrieving payment intent:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Confirm a payment intent
   * @param {string} paymentIntentId - Stripe payment intent ID
   * @returns {Promise<Object>} Confirmation result
   */
  async confirmPaymentIntent(paymentIntentId) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId);
      return {
        success: true,
        paymentIntent
      };
    } catch (error) {
      logger.error('Error confirming payment intent:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Cancel a payment intent
   * @param {string} paymentIntentId - Stripe payment intent ID
   * @returns {Promise<Object>} Cancellation result
   */
  async cancelPaymentIntent(paymentIntentId) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.cancel(paymentIntentId);
      return {
        success: true,
        paymentIntent
      };
    } catch (error) {
      logger.error('Error cancelling payment intent:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create a refund for a payment intent
   * @param {string} paymentIntentId - Stripe payment intent ID
   * @param {number} amount - Amount to refund in pence (optional, defaults to full amount)
   * @param {string} reason - Reason for refund
   * @returns {Promise<Object>} Refund result
   */
  async createRefund(paymentIntentId, amount = null, reason = 'requested_by_customer') {
    try {
      const refundData = {
        payment_intent: paymentIntentId,
        reason: reason
      };

      if (amount) {
        const amountInPence = this.formatAmountForStripe(amount);
        refundData.amount = amountInPence;
        
        logger.info(`Creating refund with amount conversion`, {
          originalAmount: amount,
          amountInPence: amountInPence,
          paymentIntentId: paymentIntentId,
          reason: reason
        });
      }

      const refund = await this.stripe.refunds.create(refundData);

      logger.info(`Refund created for payment intent ${paymentIntentId}`, {
        refundId: refund.id,
        amount: refund.amount,
        reason: reason
      });

      return {
        success: true,
        refund: {
          id: refund.id,
          amount: refund.amount,
          status: refund.status,
          reason: refund.reason
        }
      };
    } catch (error) {
      logger.error('Error creating refund:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Retrieve a refund by ID
   * @param {string} refundId - Stripe refund ID
   * @returns {Promise<Object>} Refund object
   */
  async getRefund(refundId) {
    try {
      const refund = await this.stripe.refunds.retrieve(refundId);
      return {
        success: true,
        refund
      };
    } catch (error) {
      logger.error('Error retrieving refund:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }


  /**
   * Verify payment intent with Stripe
   * @param {string} paymentIntentId - Payment intent ID
   * @param {number} expectedAmount - Expected amount in pounds
   * @returns {Object} Verification result
   */
  async verifyPaymentIntent(paymentIntentId, expectedAmount) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      
      // Check if payment was successful
      if (paymentIntent.status !== 'succeeded') {
        return {
          success: false,
          error: `Payment not successful. Status: ${paymentIntent.status}`
        };
      }
      
      // Check if amount matches
      const expectedAmountInPence = Math.round(expectedAmount * 100);
      if (paymentIntent.amount !== expectedAmountInPence) {
        return {
          success: false,
          error: `Amount mismatch. Expected: ${expectedAmountInPence}, Got: ${paymentIntent.amount}`
        };
      }
      
      logger.info(`Payment intent verified successfully`, {
        paymentIntentId,
        amount: paymentIntent.amount,
        status: paymentIntent.status
      });
      
      return {
        success: true,
        paymentIntent
      };
    } catch (error) {
      logger.error('Error verifying payment intent:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get Stripe publishable key for frontend
   * @returns {string} Publishable key
   */
  getPublishableKey() {
    return process.env.STRIPE_PUBLISHABLE_KEY;
  }

  /**
   * Format amount for display (convert from pence to pounds)
   * @param {number} amountInPence - Amount in pence
   * @returns {number} Amount in pounds
   */
  formatAmount(amountInPence) {
    return amountInPence / 100;
  }

  /**
   * Format amount for Stripe (convert from pounds to pence)
   * @param {number} amountInPounds - Amount in pounds
   * @returns {number} Amount in pence
   */
  formatAmountForStripe(amountInPounds) {
    // Use parseFloat and toFixed to handle precision issues
    return Math.round(parseFloat((amountInPounds * 100).toFixed(2)));
  }
}

// Create singleton instance
const stripeService = new StripeService();

export default stripeService;
