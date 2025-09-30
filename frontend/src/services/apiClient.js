import axios from 'axios';

// Use environment variable for production, fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';


// VITE_API_BASE_URL=https://tgifdabba-backend.onrender.com/api
// VITE_CMS_API_BASE_URL=https://tgifdabba-backend.onrender.com/api/cms

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
