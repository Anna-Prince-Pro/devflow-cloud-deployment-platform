import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('devflow_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 Unauthorized globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't clear token if the request was the login attempt itself
      const isLoginRequest = error.config?.url?.includes('/users/login');
      if (!isLoginRequest) {
        localStorage.removeItem('devflow_token');
        localStorage.removeItem('devflow_user');
        // Dispatch custom event so AuthContext can handle state update
        window.dispatchEvent(new Event('devflow:unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
