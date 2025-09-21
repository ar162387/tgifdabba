import apiClient from './apiClient.js';

export const authService = {
  login: async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  refreshToken: async () => {
    try {
      const response = await apiClient.get('/auth/me');
      if (response.data && response.data.token) {
        this.setToken(response.data.token);
        return response.data.token;
      }
      throw new Error('No token received');
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  },

  updateProfile: async (profileData) => {
    const response = await apiClient.patch('/auth/profile', profileData);
    return response.data;
  },

  // Token management
  setToken: (token) => {
    localStorage.setItem('cms_token', token);
  },

  getToken: () => {
    return localStorage.getItem('cms_token');
  },

  removeToken: () => {
    localStorage.removeItem('cms_token');
  },

  // User data management
  setUser: (user) => {
    localStorage.setItem('cms_user', JSON.stringify(user));
  },

  getUser: () => {
    const user = localStorage.getItem('cms_user');
    return user ? JSON.parse(user) : null;
  },

  removeUser: () => {
    localStorage.removeItem('cms_user');
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('cms_token');
  },

  // Clear all auth data
  clearAuth: () => {
    localStorage.removeItem('cms_token');
    localStorage.removeItem('cms_user');
  }
};
