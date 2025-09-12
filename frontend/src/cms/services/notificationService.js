import apiClient from './apiClient.js';

export const notificationService = {
  getNotificationCounters: async () => {
    const response = await apiClient.get('/notifications/counters');
    return response.data;
  },

  getRecentActivity: async (limit = 10) => {
    const response = await apiClient.get('/notifications/activity', { 
      params: { limit } 
    });
    return response.data;
  }
};
