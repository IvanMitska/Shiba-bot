import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
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
import { FiTrendingUp, FiUsers, FiPercent, FiGlobe } from 'react-icons/fi';
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
        <div className="w-6 h-6 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
      </div>
    );
  }

  const data = analytics?.data;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#18181b',
        titleColor: '#fff',
        bodyColor: '#a1a1aa',
        padding: 12,
        cornerRadius: 8,
        borderColor: '#27272a',
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#1f1f23', drawBorder: false },
        ticks: { color: '#52525b', font: { size: 12 } },
      },
      x: {
        grid: { display: false },
        ticks: { color: '#52525b', font: { size: 12 } },
      },
    },
  };

  const dailyChartData = {
    labels: Object.keys(data?.dailyStats || {}).map(date =>
      format(new Date(date), 'dd MMM', { locale: ru })
    ),
    datasets: [{
      data: Object.values(data?.dailyStats || {}),
      borderColor: '#52525b',
      backgroundColor: 'rgba(82, 82, 91, 0.1)',
      fill: true,
      tension: 0.3,
      pointBackgroundColor: '#71717a',
      pointBorderColor: '#71717a',
      pointRadius: 4,
      borderWidth: 2,
    }],
  };

  const hourlyChartData = {
    labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
    datasets: [{
      data: data?.hourlyStats || [],
      backgroundColor: '#27272a',
      borderRadius: 4,
    }],
  };

  const messengerChartData = {
    labels: ['WhatsApp', 'Telegram'],
    datasets: [{
      data: [data?.messengerStats?.whatsapp || 0, data?.messengerStats?.telegram || 0],
      backgroundColor: ['#3f3f46', '#52525b'],
      borderWidth: 0,
    }],
  };

  const doughnutOptions = {
    ...chartOptions,
    cutout: '70%',
    plugins: {
      ...chartOptions.plugins,
      legend: {
        display: true,
        position: 'bottom',
        labels: { color: '#71717a', padding: 16, usePointStyle: true, font: { size: 12 } },
      },
    },
  };

  const periods = [
    { value: 7, label: '7 дней' },
    { value: 14, label: '14 дней' },
    { value: 30, label: '30 дней' },
    { value: 90, label: '90 дней' },
  ];

  return (
    <div className="space-y-6 md:space-y-8 pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-white">Аналитика</h1>
          <p className="text-zinc-500 text-sm md:text-base">Статистика переходов</p>
        </div>
        <div className="flex items-center gap-1 bg-[#141419] border border-[#1f1f26] rounded-lg p-1">
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-2.5 md:px-3 py-1.5 rounded-md text-xs md:text-sm font-medium transition-colors ${
                period === p.value
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[
          { icon: FiTrendingUp, label: 'Переходы', value: data?.totalClicks || 0 },
          { icon: FiUsers, label: 'Уникальные', value: data?.uniqueVisitors || 0 },
          { icon: FiPercent, label: 'Конверсия', value: `${data?.conversionRate || 0}%` },
          { icon: FiGlobe, label: 'Стран', value: Object.keys(data?.countryStats || {}).length },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-[#141419] border border-[#1f1f26] rounded-xl md:rounded-2xl p-4 md:p-5 text-center"
          >
            <stat.icon className="w-4 h-4 md:w-5 md:h-5 text-zinc-500 mx-auto mb-2 md:mb-3" />
            <div className="text-xl md:text-2xl font-semibold text-white">{stat.value}</div>
            <div className="text-zinc-500 text-xs md:text-sm uppercase tracking-wider mt-1">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Daily Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-[#141419] border border-[#1f1f26] rounded-xl md:rounded-2xl p-4 md:p-6"
      >
        <h2 className="text-zinc-400 text-sm md:text-base font-medium mb-4 md:mb-6">Переходы по дням</h2>
        <div className="h-56 md:h-72">
          <Line data={dailyChartData} options={chartOptions} />
        </div>
      </motion.div>

      {/* Two columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-[#141419] border border-[#1f1f26] rounded-xl md:rounded-2xl p-4 md:p-6"
        >
          <h2 className="text-zinc-400 text-sm md:text-base font-medium mb-4 md:mb-6">Активность по часам</h2>
          <div className="h-48 md:h-56">
            <Bar data={hourlyChartData} options={chartOptions} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#141419] border border-[#1f1f26] rounded-xl md:rounded-2xl p-4 md:p-6"
        >
          <h2 className="text-zinc-400 text-sm md:text-base font-medium mb-4 md:mb-6">Мессенджеры</h2>
          <div className="h-48 md:h-56 flex items-center justify-center">
            <div className="w-36 h-36 md:w-44 md:h-44">
              <Doughnut data={messengerChartData} options={doughnutOptions} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Geography */}
      {Object.keys(data?.countryStats || {}).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-[#141419] border border-[#1f1f26] rounded-xl md:rounded-2xl p-4 md:p-6"
        >
          <h2 className="text-zinc-400 text-sm md:text-base font-medium mb-4">География</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(data?.countryStats || {})
              .sort((a, b) => b[1] - a[1])
              .slice(0, 8)
              .map(([country, count]) => (
                <div key={country} className="bg-[#0c0c0f] border border-[#1f1f26] rounded-xl p-3 md:p-4 text-center">
                  <div className="text-white font-semibold text-lg md:text-xl">{count}</div>
                  <div className="text-zinc-500 text-xs md:text-sm truncate mt-1">{country}</div>
                </div>
              ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Analytics;
