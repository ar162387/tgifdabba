import apiClient from './apiClient.js';

export const orderService = {
  getAllOrders: async (params = {}) => {
    const response = await apiClient.get('/orders', { params });
    return response.data;
  },

  getOrderById: async (id) => {
    const response = await apiClient.get(`/orders/${id}`);
    return response.data;
  },

  updateOrderStatus: async (id, statusData) => {
    const response = await apiClient.patch(`/orders/${id}/status`, statusData);
    return response.data;
  },

  getOrderStats: async (params = {}) => {
    const response = await apiClient.get('/orders/stats/overview', { params });
    return response.data;
  },

  // Additional methods for order management
  cancelOrder: async (id, reason = null) => {
    const response = await apiClient.patch(`/orders/${id}/cancel`, { reason });
    return response.data;
  },

  deleteOrder: async (id) => {
    const response = await apiClient.delete(`/orders/${id}`);
    return response.data;
  },

  updatePaymentStatus: async (id, paymentStatus) => {
    const response = await apiClient.patch(`/orders/${id}/payment-status`, { paymentStatus });
    return response.data;
  },

  // Stripe-specific methods
  confirmStripePayment: async (id, paymentIntentId) => {
    const response = await apiClient.post(`/orders/${id}/confirm-payment`, { paymentIntentId });
    return response.data;
  },

  createStripeRefund: async (id, amount = null, reason = 'requested_by_customer') => {
    const response = await apiClient.post(`/orders/${id}/refund`, { amount, reason });
    return response.data;
  }
};
