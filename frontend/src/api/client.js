import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api'),
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((request) => {
  const token = localStorage.getItem('event_token');
  if (token) request.headers.Authorization = `Bearer ${token}`;
  return request;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRequest = /\/auth\/(login|register)/.test(error.config?.url || '');
    if (error.response?.status === 401 && localStorage.getItem('event_token') && !isAuthRequest) {
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default api;