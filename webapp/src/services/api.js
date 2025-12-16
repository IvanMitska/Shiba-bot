import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token') || localStorage.getItem('token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      toast.error('Сессия истекла. Пожалуйста, перезайдите.');
      window.Telegram?.WebApp?.close();
    } else if (error.response?.status === 403) {
      toast.error('Доступ запрещен');
    } else if (error.response?.status >= 500) {
      toast.error('Ошибка сервера. Попробуйте позже.');
    }
    
    return Promise.reject(error);
  }
);

export const partnerAPI = {
  getInfo: () => api.get('/partner/info'),
  getStats: (period = 'week') => api.get('/partner/stats', { params: { period } }),
  getClicks: (params) => api.get('/partner/clicks', { params }),
  getAnalytics: (days = 7) => api.get('/partner/analytics', { params: { days } }),
};

export const adminAPI = {
  login: (secretKey) => axios.post(`${API_URL.replace('/api', '')}/admin-login`, { secretKey }),
  getDashboard: () => api.get('/admin/dashboard'),
  getPartners: (params) => api.get('/admin/partners', { params }),
  getPartner: (id) => api.get(`/admin/partners/${id}`),
  updatePartner: (id, data) => api.patch(`/admin/partners/${id}`, data),
  getAnalytics: (days = 30) => api.get('/admin/analytics', { params: { days } }),
  getSettings: () => api.get('/admin/settings'),
  updateSetting: (key, data) => api.put(`/admin/settings/${key}`, data),
  getAllClicks: (params) => api.get('/admin/clicks', { params }),
};

export const publicAPI = {
  getPublicSettings: () => api.get('/settings/public'),
};

export default api;