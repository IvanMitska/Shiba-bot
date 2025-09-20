import React, { useState, useEffect } from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { format, subDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import axios from 'axios';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Statistics = ({ data }) => {
  const [period, setPeriod] = useState('week');
  const [chartData, setChartData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAnalyticsData();
  }, [period, data]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;

      // Получаем токен авторизации из Telegram WebApp
      const tg = window.Telegram?.WebApp;
      const authToken = tg?.initData;

      if (!authToken && !data) {
        generateEmptyChartData(days);
        return;
      }

      const apiUrl = process.env.REACT_APP_API_URL || window.location.origin + '/api';

      const response = await axios.get(`${apiUrl}/partner/analytics`, {
        headers: authToken ? {
          'Authorization': `Bearer ${authToken}`
        } : {},
        params: { days }
      });

      const analytics = response.data;
      setAnalyticsData(analytics);
      generateChartDataFromAPI(analytics, days);

    } catch (error) {
      console.error('Error loading analytics:', error);
      // Fallback to empty data
      const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;
      generateEmptyChartData(days);
    } finally {
      setLoading(false);
    }
  };

  const generateEmptyChartData = (days) => {
    const labels = [];
    const clicksData = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      labels.push(format(date, 'd MMM', { locale: ru }));
      clicksData.push(0);
    }

    setChartData({
      labels,
      datasets: [
        {
          label: 'Переходы',
          data: clicksData,
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          tension: 0.4
        }
      ]
    });
  };

  const generateChartDataFromAPI = (analytics, days) => {
    const labels = [];
    const clicksData = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      labels.push(format(date, 'd MMM', { locale: ru }));
      clicksData.push(analytics.dailyStats[dateStr] || 0);
    }

    setChartData({
      labels,
      datasets: [
        {
          label: 'Переходы',
          data: clicksData,
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          tension: 0.4
        }
      ]
    });
  };

  const sourceData = {
    labels: ['WhatsApp', 'Telegram', 'Прямые'],
    datasets: [
      {
        data: [
          analyticsData?.messengerStats?.whatsapp || data?.statistics?.whatsappClicks || 0,
          analyticsData?.messengerStats?.telegram || data?.statistics?.telegramClicks || 0,
          Math.max(0, (analyticsData?.totalClicks || data?.statistics?.totalClicks || 0) -
            (analyticsData?.messengerStats?.whatsapp || data?.statistics?.whatsappClicks || 0) -
            (analyticsData?.messengerStats?.telegram || data?.statistics?.telegramClicks || 0))
        ],
        backgroundColor: ['#25D366', '#0088cc', '#667eea'],
        borderWidth: 0
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 8
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          font: {
            size: 12
          }
        }
      }
    }
  };

  return (
    <div className="statistics">
      <div className="card">
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
          График переходов
        </h3>
        
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            className={`tab ${period === 'week' ? 'active' : ''}`}
            onClick={() => setPeriod('week')}
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            Неделя
          </button>
          <button
            className={`tab ${period === 'month' ? 'active' : ''}`}
            onClick={() => setPeriod('month')}
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            Месяц
          </button>
          <button
            className={`tab ${period === 'quarter' ? 'active' : ''}`}
            onClick={() => setPeriod('quarter')}
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            Квартал
          </button>
        </div>

        <div className="chart-container">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
              <div className="spinner"></div>
            </div>
          ) : chartData ? (
            <Line data={chartData} options={chartOptions} />
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--tg-theme-hint-color)', padding: '40px 0' }}>
              Нет данных для отображения
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
          Источники трафика
        </h3>
        <div className="chart-container">
          <Doughnut data={sourceData} options={doughnutOptions} />
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
          Детальная статистика
        </h3>
        <div style={{ display: 'grid', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
            <span style={{ fontSize: '14px', color: 'var(--tg-theme-hint-color)' }}>Всего кликов</span>
            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{analyticsData?.totalClicks || data?.statistics?.totalClicks || 0}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
            <span style={{ fontSize: '14px', color: 'var(--tg-theme-hint-color)' }}>Конверсия в действия</span>
            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{analyticsData?.conversionRate || 0}%</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
            <span style={{ fontSize: '14px', color: 'var(--tg-theme-hint-color)' }}>Уникальных посетителей</span>
            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{analyticsData?.uniqueVisitors || 0}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
            <span style={{ fontSize: '14px', color: 'var(--tg-theme-hint-color)' }}>Период</span>
            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
              {period === 'week' ? '7 дней' : period === 'month' ? '30 дней' : '90 дней'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;