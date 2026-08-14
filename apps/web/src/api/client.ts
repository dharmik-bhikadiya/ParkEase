import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptor to inject bearer token from localStorage
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('parkease_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error normalization
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = 'An unexpected error occurred';
    let status = error.response?.status || 500;

    if (!error.response) {
      // Network Error or server offline
      message = 'Unable to connect to the server. Please check your connection and try again.';
      status = 0;
    } else if (error.response.data?.detail) {
      message = typeof error.response.data.detail === 'string'
        ? error.response.data.detail
        : JSON.stringify(error.response.data.detail);
    } else if (error.response.data?.message) {
      message = error.response.data.message;
    } else if (status === 401) {
      message = 'Session expired. Please sign in again.';
    } else if (status === 403) {
      message = 'Access denied. You do not have permission.';
    } else if (status === 404) {
      message = 'Requested resource not found.';
    }

    const customError = {
      message,
      status,
    };
    return Promise.reject(customError);
  }
);
