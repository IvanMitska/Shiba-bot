import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

// Создаем экземпляр axios с базовой конфигурацией
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Добавляем данные Telegram Web App к каждому запросу
api.interceptors.request.use((config) => {
  if (window.Telegram?.WebApp?.initData) {
    config.headers['X-Telegram-Init-Data'] = window.Telegram.WebApp.initData;
  }
  return config;
});

// Получение данных партнера
export const fetchPartnerData = async (telegramId) => {
  try {
    const response = await api.get(`/partner/${telegramId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching partner data:', error);
    // Возвращаем моковые данные для разработки
    return {
      partnerId: telegramId,
      partnerLink: `https://shiba-cars-partners.netlify.app/r/${generatePartnerCode(telegramId)}`,
      registrationDate: new Date().toISOString(),
      statistics: {
        todayClicks: 5,
        totalClicks: 42,
        whatsappClicks: 25,
        telegramClicks: 17,
        conversionRate: 12.5,
        earnings: 1250
      },
      clicks: []
    };
  }
};

// Получение истории кликов
export const fetchClickHistory = async (telegramId, limit = 50) => {
  try {
    const response = await api.get(`/partner/${telegramId}/clicks`, {
      params: { limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching click history:', error);
    return [];
  }
};

// Получение статистики за период
export const fetchStatistics = async (telegramId, period = 'week') => {
  try {
    const response = await api.get(`/partner/${telegramId}/statistics`, {
      params: { period }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return null;
  }
};

// Обновление профиля партнера
export const updatePartnerProfile = async (telegramId, data) => {
  try {
    const response = await api.put(`/partner/${telegramId}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating partner profile:', error);
    throw error;
  }
};

// Генерация партнерского кода (для моковых данных)
const generatePartnerCode = (telegramId) => {
  const hash = btoa(String(telegramId)).replace(/[^a-zA-Z0-9]/g, '').substring(0, 8);
  return hash.toUpperCase();
};