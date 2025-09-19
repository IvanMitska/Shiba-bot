import React, { useState } from 'react';
import { useQuery } from 'react-query';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { partnerAPI } from '../services/api';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Analytics = () => {
  const [period, setPeriod] = useState(7);

  const { data: analytics, isLoading } = useQuery(
    ['analytics', period],
    () => partnerAPI.getAnalytics(period),
    { staleTime: 5 * 60 * 1000 }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const data = analytics?.data;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  };

  const dailyChartData = {
    labels: Object.keys(data?.dailyStats || {}).map(date => 
      format(new Date(date), 'dd MMM', { locale: ru })
    ),
    datasets: [
      {
        label: 'Переходы',
        data: Object.values(data?.dailyStats || {}),
        borderColor: '#2AABEE',
        backgroundColor: 'rgba(42, 171, 238, 0.1)',
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const hourlyChartData = {
    labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
    datasets: [
      {
        label: 'Активность по часам',
        data: data?.hourlyStats || [],
        backgroundColor: 'rgba(42, 171, 238, 0.6)',
        borderColor: '#2AABEE',
        borderWidth: 2,
      },
    ],
  };

  const messengerChartData = {
    labels: ['WhatsApp', 'Telegram'],
    datasets: [
      {
        data: [
          data?.messengerStats?.whatsapp || 0,
          data?.messengerStats?.telegram || 0,
        ],
        backgroundColor: ['#25D366', '#2AABEE'],
        borderWidth: 0,
      },
    ],
  };

  const deviceChartData = {
    labels: Object.keys(data?.deviceStats || {}),
    datasets: [
      {
        data: Object.values(data?.deviceStats || {}),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
        ],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Аналитика</h1>
          <select
            value={period}
            onChange={(e) => setPeriod(Number(e.target.value))}
            className="input w-auto"
          >
            <option value={7}>7 дней</option>
            <option value={14}>14 дней</option>
            <option value={30}>30 дней</option>
            <option value={90}>90 дней</option>
          </select>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-3xl font-bold text-blue-600">
              {data?.totalClicks || 0}
            </p>
            <p className="text-sm text-gray-600">Всего переходов</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-3xl font-bold text-green-600">
              {data?.uniqueVisitors || 0}
            </p>
            <p className="text-sm text-gray-600">Уникальных</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-3xl font-bold text-purple-600">
              {data?.conversionRate || 0}%
            </p>
            <p className="text-sm text-gray-600">Конверсия</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-3xl font-bold text-orange-600">
              {Object.keys(data?.countryStats || {}).length}
            </p>
            <p className="text-sm text-gray-600">Стран</p>
          </div>
        </div>
      </div>

      <div
        className="card"
      >
        <h2 className="text-xl font-semibold mb-4">Переходы по дням</h2>
        <div className="h-64">
          <Line data={dailyChartData} options={chartOptions} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Активность по часам</h2>
          <div className="h-64">
            <Bar data={hourlyChartData} options={chartOptions} />
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Выбор мессенджера</h2>
          <div className="h-64 flex items-center justify-center">
            <div className="w-48 h-48">
              <Doughnut 
                data={messengerChartData} 
                options={{
                  ...chartOptions,
                  plugins: {
                    ...chartOptions.plugins,
                    legend: {
                      display: true,
                      position: 'bottom',
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div
        className="card"
      >
        <h2 className="text-xl font-semibold mb-4">География переходов</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(data?.countryStats || {})
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([country, count], index) => (
              <div
                key={country}
                className="p-3 bg-gray-50 rounded-lg text-center"
              >
                <p className="font-semibold text-gray-800">{country}</p>
                <p className="text-2xl font-bold text-telegram-blue">{count}</p>
              </div>
            ))}
        </div>
      </div>

      {Object.keys(data?.deviceStats || {}).length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Устройства</h2>
          <div className="h-64 flex items-center justify-center">
            <div className="w-48 h-48">
              <Doughnut 
                data={deviceChartData} 
                options={{
                  ...chartOptions,
                  plugins: {
                    ...chartOptions.plugins,
                    legend: {
                      display: true,
                      position: 'bottom',
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;