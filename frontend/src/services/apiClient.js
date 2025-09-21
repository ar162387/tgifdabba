import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

// Create axios instance for public API calls
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for any future auth needs
apiClient.interceptors.request.use(
  (config) => {
    // Add any public headers here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default apiClient;
