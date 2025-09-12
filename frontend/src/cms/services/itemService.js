import apiClient from './apiClient.js';

export const itemService = {
  getAllItems: async (params = {}) => {
    const response = await apiClient.get('/items', { params });
    return response.data;
  },

  getItemById: async (id) => {
    const response = await apiClient.get(`/items/${id}`);
    return response.data;
  },

  createItem: async (itemData) => {
    const response = await apiClient.post('/items', itemData);
    return response.data;
  },

  updateItem: async (id, itemData) => {
    const response = await apiClient.put(`/items/${id}`, itemData);
    return response.data;
  },

  deleteItem: async (id) => {
    const response = await apiClient.delete(`/items/${id}`);
    return response.data;
  },

  toggleItemStatus: async (id) => {
    const response = await apiClient.patch(`/items/${id}/toggle-status`);
    return response.data;
  }
};
