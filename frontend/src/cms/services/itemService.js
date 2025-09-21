import apiClient from './apiClient.js';

export const itemService = {
  getAllItems: async (params = {}) => {
    // Remove active filter for CMS - show all items regardless of status
    const response = await apiClient.get('/items', { params });
    return response.data;
  },

  getItemById: async (id) => {
    const response = await apiClient.get(`/items/${id}`);
    return response.data;
  },

  createItem: async (itemData) => {
    const config = {
      headers: {
        'Content-Type': itemData instanceof FormData ? 'multipart/form-data' : 'application/json'
      }
    };
    const response = await apiClient.post('/items', itemData, config);
    return response.data;
  },

  updateItem: async (id, itemData) => {
    const config = {
      headers: {
        'Content-Type': itemData instanceof FormData ? 'multipart/form-data' : 'application/json'
      }
    };
    const response = await apiClient.put(`/items/${id}`, itemData, config);
    return response.data;
  },

  deleteItem: async (id) => {
    const response = await apiClient.delete(`/items/${id}`);
    return response.data;
  },

  toggleItemStatus: async (id) => {
    const response = await apiClient.patch(`/items/${id}/toggle-status`);
    return response.data;
  },

  checkItemUsage: async (id) => {
    const response = await apiClient.get(`/items/${id}/usage`);
    return response.data;
  }
};
