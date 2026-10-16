import axios from 'axios';
import { useAuthStore } from '../store/authStore';

let API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Defensively append /api if it was omitted in Vercel configuration
API_BASE_URL = API_BASE_URL.trim().replace(/\/+$/, '');
if (API_BASE_URL && !/\/api$/i.test(API_BASE_URL)) {
  API_BASE_URL = `${API_BASE_URL}/api`;
}

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 90000,
});

axiosClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => {
    const body = response.data;
    if (body && typeof body.success === 'boolean') {
      if (body.success) {
        return body.data;
      }
      return Promise.reject(body.error || { message: 'Request failed' });
    }
    return response.data;
  },
  (error) => {
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      'Network error';

    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject({ message, status: error.response?.status, details: error.response?.data?.error?.details });
  }
);

export default axiosClient;
