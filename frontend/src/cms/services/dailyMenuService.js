import apiClient from './apiClient.js';

export const dailyMenuService = {
  getAllDailyMenus: async () => {
    const response = await apiClient.get('/daily-menu');
    return response.data;
  },

  getDailyMenuByDay: async (day) => {
    const response = await apiClient.get(`/daily-menu/day/${day}`);
    return response.data;
  },

  createDailyMenu: async (menuData) => {
    const response = await apiClient.post('/daily-menu', menuData);
    return response.data;
  },

  updateDailyMenu: async (id, menuData) => {
    const response = await apiClient.put(`/daily-menu/${id}`, menuData);
    return response.data;
  },

  deleteDailyMenu: async (id) => {
    const response = await apiClient.delete(`/daily-menu/${id}`);
    return response.data;
  },

  publishDailyMenu: async (id) => {
    const response = await apiClient.patch(`/daily-menu/${id}/publish`);
    return response.data;
  }
};
