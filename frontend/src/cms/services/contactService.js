import apiClient from './apiClient.js';

export const contactService = {
  getAllContacts: async (params = {}) => {
    const response = await apiClient.get('/contacts', { params });
    return response.data;
  },

  getContactById: async (id) => {
    const response = await apiClient.get(`/contacts/${id}`);
    return response.data;
  },

  markContactAsRead: async (id) => {
    const response = await apiClient.patch(`/contacts/${id}/read`);
    return response.data;
  },

  respondToContact: async (id, responseData) => {
    const response = await apiClient.patch(`/contacts/${id}/respond`, responseData);
    return response.data;
  },

  deleteContact: async (id) => {
    const response = await apiClient.delete(`/contacts/${id}`);
    return response.data;
  },

  getContactStats: async () => {
    const response = await apiClient.get('/contacts/stats');
    return response.data;
  }
};
