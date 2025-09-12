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

  markOrderAsRead: async (id) => {
    const response = await apiClient.patch(`/orders/${id}/read`);
    return response.data;
  },

  getOrderStats: async () => {
    const response = await apiClient.get('/orders/stats');
    return response.data;
  }
};
