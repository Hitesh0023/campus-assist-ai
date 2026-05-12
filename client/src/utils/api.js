import axios from 'axios';

const resolvedBaseURL = import.meta.env.VITE_API_BASE_URL || '';

const api = axios.create({
  // Use the Vite proxy in development when no explicit backend URL is provided.
  baseURL: resolvedBaseURL,
  headers: { 'Content-Type': 'application/json' }
});

// Global error interceptor
api.interceptors.response.use(
  res => res,
  err => {
    const backendMessage = err.response?.data?.error;
    const defaultMessage = err.code === 'ERR_NETWORK'
      ? 'Cannot reach the backend API. Make sure the server is running and check your backend URL.'
      : err.message || 'Something went wrong';

    return Promise.reject(new Error(backendMessage || defaultMessage));
  }
);

export default api;
