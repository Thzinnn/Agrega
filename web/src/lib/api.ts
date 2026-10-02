import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 
  (process.env.NODE_ENV === 'development' ? 'http://localhost:3333/api/v1' : '');

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Prevent caching ONLY for Admin routes by appending a unique timestamp.
    // Public routes MUST BE cached to handle traffic.
    if (config.method?.toLowerCase() === 'get' && config.url?.includes('/admin/')) {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
    }
  }
  return config;
});
