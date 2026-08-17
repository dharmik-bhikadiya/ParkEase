import axios from 'axios';

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
const API_BASE_URL = rawBaseUrl.replace(/\/+$/, '');

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Interceptor to inject bearer token from localStorage
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('parkease_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for friendly error normalization
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = 'Unable to complete your request right now. Please try again.';
    let status = error.response?.status || 500;

    if (!error.response || error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
      // Real Network Error, CORS preflight failure, or server offline
      message = 'Unable to connect to ParkEase right now. Please check your connection and try again.';
      status = 0;
    } else if (error.response.data?.detail) {
      const detail = error.response.data.detail;
      if (typeof detail === 'string') {
        message = detail;
      } else if (Array.isArray(detail)) {
        message = detail.map((d: any) => d.msg || d.message).join(', ');
      } else {
        message = JSON.stringify(detail);
      }
    } else if (error.response.data?.error?.details) {
      const details = error.response.data.error.details;
      if (typeof details === 'string') {
        message = details;
      } else if (Array.isArray(details)) {
        message = details.map((d: any) => d.msg || d.message).join(', ');
      } else {
        message = JSON.stringify(details);
      }
    } else if (error.response.data?.message) {
      message = error.response.data.message;
    } else if (status === 401) {
      message = 'Your session has expired. Please sign in to continue.';
    } else if (status === 403) {
      message = 'Access restricted. You do not have permission to view this resource.';
    } else if (status === 404) {
      message = 'The requested information or parking resource could not be found.';
    } else if (status === 422) {
      message = 'Please double check the entered information and try again.';
    } else if (status >= 500) {
      message = 'ParkEase is currently experiencing technical difficulties. Please try again in a few moments.';
    }

    const customError = {
      message,
      status,
      originalError: error,
    };
    return Promise.reject(customError);
  }
);
