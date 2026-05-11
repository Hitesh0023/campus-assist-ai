import axios from 'axios';

const api = axios.create({
  // Use the configured backend URL in production.
  // In local dev, fall back to the expected backend port when no env var is set.
  baseURL: import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:5001' : ''),
  headers: { 'Content-Type': 'application/json' }
});

// Global error interceptor
api.interceptors.response.use(
  res => res,
  err => {
    const backendMessage = err.response?.data?.error;
    const defaultMessage = err.code === 'ERR_NETWORK'
      ? 'Cannot reach the backend API. Make sure the server is running on http://localhost:5001.'
      : err.message || 'Something went wrong';

    return Promise.reject(new Error(backendMessage || defaultMessage));
  }
);

export default api;
