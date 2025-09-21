import apiClient from './apiClient';

export const dailyMenuService = {
  // Get daily menu by day of week
  getDailyMenuByDay: async (day) => {
    try {
      const response = await apiClient.get(`/daily-menu/day/${day}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching daily menu:', error);
      throw error;
    }
  },

  // Get all daily menus
  getAllDailyMenus: async () => {
    try {
      const response = await apiClient.get('/daily-menu');
      return response.data;
    } catch (error) {
      console.error('Error fetching daily menus:', error);
      throw error;
    }
  }
};

export default dailyMenuService;
