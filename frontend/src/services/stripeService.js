import apiClient from './apiClient';

const STRIPE_API_BASE = '/stripe';

export const stripeService = {
  // Create payment intent for order
  createPaymentIntent: async (orderData, amount, orderId) => {
    try {
      const response = await apiClient.post(`${STRIPE_API_BASE}/create-payment-intent`, {
        orderData,
        amount,
        orderId
      });
      return response.data;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw new Error(
        error.response?.data?.message || 
        'Failed to create payment intent. Please try again.'
      );
    }
  }
};

export default stripeService;
