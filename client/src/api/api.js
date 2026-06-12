import axios from 'axios';

// Create central Axios instance pointing to backend
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject JWT token in headers of outgoing requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('trimurl_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
