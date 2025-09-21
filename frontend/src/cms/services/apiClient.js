import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api/cms';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue = [];

// Process failed requests after token refresh
const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

// Request interceptor to add auth token and CMS header
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cms_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Add CMS header to indicate this is a CMS request
    config.headers['x-cms-request'] = 'true';
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors with token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't try to refresh if this is already a login request or auth/me request
      if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/me')) {
        return Promise.reject(error);
      }

      // Check if we have a token to refresh
      const currentToken = localStorage.getItem('cms_token');
      if (!currentToken) {
        // No token, just redirect to login
        localStorage.removeItem('cms_user');
        if (window.location.pathname !== '/cms/login') {
          window.location.href = '/cms/login';
        }
        return Promise.reject(error);
      }

      // Check if token is expired by decoding it
      let isTokenExpired = false;
      try {
        const payload = JSON.parse(atob(currentToken.split('.')[1]));
        const now = Math.floor(Date.now() / 1000);
        isTokenExpired = payload.exp && payload.exp < now;
      } catch (e) {
        isTokenExpired = true; // Invalid token format
      }

      if (!isTokenExpired) {
        // Token is not expired, this might be a different auth issue
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try to refresh token
        const refreshResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${currentToken}`
          }
        });

        if (refreshResponse.data?.data?.token) {
          const newToken = refreshResponse.data.data.token;
          localStorage.setItem('cms_token', newToken);
          
          // Update the original request with new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          
          // Process queued requests
          processQueue(null, newToken);
          
          // Retry the original request
          return apiClient(originalRequest);
        } else {
          throw new Error('No token received from refresh');
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        
        // Clear auth data and redirect to login
        localStorage.removeItem('cms_token');
        localStorage.removeItem('cms_user');
        
        // Process queued requests with error
        processQueue(refreshError, null);
        
        // Redirect to login
        if (window.location.pathname !== '/cms/login') {
          window.location.href = '/cms/login';
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
