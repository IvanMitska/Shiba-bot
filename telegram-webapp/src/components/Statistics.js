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

  useEffect(() => {
    generateChartData();
  }, [period, data]);

  const generateChartData = () => {
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;
    const labels = [];
    const clicksData = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      labels.push(format(date, 'd MMM', { locale: ru }));
      // Здесь должны быть реальные данные из API
      clicksData.push(Math.floor(Math.random() * 10));
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
          data?.statistics?.whatsappClicks || 0,
          data?.statistics?.telegramClicks || 0,
          Math.max(0, (data?.statistics?.totalClicks || 0) - 
            (data?.statistics?.whatsappClicks || 0) - 
            (data?.statistics?.telegramClicks || 0))
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
          {chartData && <Line data={chartData} options={chartOptions} />}
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
            <span style={{ fontSize: '14px', color: 'var(--tg-theme-hint-color)' }}>Средний CTR</span>
            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>2.3%</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
            <span style={{ fontSize: '14px', color: 'var(--tg-theme-hint-color)' }}>Конверсия в заявки</span>
            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>15%</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
            <span style={{ fontSize: '14px', color: 'var(--tg-theme-hint-color)' }}>Активных дней</span>
            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>23</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
            <span style={{ fontSize: '14px', color: 'var(--tg-theme-hint-color)' }}>Лучший день</span>
            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Понедельник</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;