import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { FiCopy, FiRefreshCw, FiTrendingUp, FiUsers, FiMousePointer, FiEye, FiShare2, FiExternalLink } from 'react-icons/fi';
import { FaWhatsapp, FaTelegram } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { partnerAPI } from '../services/api';
import { hapticFeedback } from '../services/telegram';

const Dashboard = () => {
  const [, setCopiedLink] = useState(false);

  const { data: partnerInfo, isLoading: infoLoading } = useQuery(
    'partnerInfo',
    () => partnerAPI.getInfo(),
    { staleTime: 5 * 60 * 1000 }
  );

  const { data: stats, isLoading: statsLoading, refetch } = useQuery(
    'partnerStats',
    () => partnerAPI.getStats('today'),
    { 
      staleTime: 60 * 1000,
      refetchInterval: 30 * 1000 
    }
  );

  const handleCopyLink = () => {
    if (partnerInfo?.data?.partnerLink) {
      navigator.clipboard.writeText(partnerInfo.data.partnerLink);
      setCopiedLink(true);
      hapticFeedback('success');
      toast.success('Ссылка скопирована!');
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleRefresh = () => {
    refetch();
    hapticFeedback('light');
    toast.success('Данные обновлены');
  };

  const handleShare = () => {
    if (partnerInfo?.data?.partnerLink && navigator.share) {
      navigator.share({
        title: 'Моя партнерская ссылка',
        text: 'Переходите по ссылке для аренды транспорта',
        url: partnerInfo.data.partnerLink,
      }).catch(() => {});
      hapticFeedback('medium');
    }
  };

  const handleOpenLanding = () => {
    if (partnerInfo?.data?.partnerLink) {
      window.open(partnerInfo.data.partnerLink, '_blank');
      hapticFeedback('medium');
    }
  };

  if (infoLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-primary-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const partner = partnerInfo?.data;
  const statistics = stats?.data;

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header with Logo */}
      <div className="bg-dark-card border-b border-dark-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-orange rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <h1 className="text-xl font-bold text-white">SHIBA CARS</h1>
            </div>
            <button
              onClick={handleRefresh}
              className="p-2 text-dark-text-secondary hover:text-primary-orange transition-colors"
            >
              <FiRefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Welcome Section */}
        <div className="bg-dark-card rounded-2xl p-6 border border-dark-border">
          <h2 className="text-2xl font-bold text-white mb-2">
            Добро пожаловать, {partner?.firstName || 'Партнер'}!
          </h2>
          <p className="text-dark-text-secondary">
            Управляйте своими партнерскими ссылками
          </p>
        </div>

        {/* Partner Link Card */}
        <div className="bg-gradient-to-r from-primary-orange to-primary-orange-dark rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold text-lg">Ваша партнерская ссылка</h3>
            <div className="flex space-x-2">
              <button
                onClick={handleCopyLink}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                <FiCopy className="w-5 h-5 text-white" />
              </button>
              {navigator.share && (
                <button
                  onClick={handleShare}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                  <FiShare2 className="w-5 h-5 text-white" />
                </button>
              )}
            </div>
          </div>
          <div className="bg-black/20 rounded-lg p-3">
            <code className="text-white text-sm break-all">
              {partnerInfo?.data?.partnerLink || 'Загрузка...'}
            </code>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div
            className="bg-dark-card rounded-2xl p-6 border border-dark-border"
          >
            <div className="flex items-center justify-between mb-2">
              <FiMousePointer className="w-6 h-6 text-primary-orange" />
              {statistics?.changeStats?.totalClicksChange && (
                <span className={`text-xs font-semibold ${
                  statistics.changeStats.totalClicksChange >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {statistics.changeStats.totalClicksChange >= 0 ? '+' : ''}{statistics.changeStats.totalClicksChange}%
                </span>
              )}
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {statistics?.totalClicks || 0}
            </div>
            <div className="text-dark-text-secondary text-sm">Всего кликов</div>
          </div>

          <div
            className="bg-dark-card rounded-2xl p-6 border border-dark-border"
          >
            <div className="flex items-center justify-between mb-2">
              <FiUsers className="w-6 h-6 text-primary-orange" />
              {statistics?.changeStats?.uniqueVisitorsChange && (
                <span className={`text-xs font-semibold ${
                  statistics.changeStats.uniqueVisitorsChange >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {statistics.changeStats.uniqueVisitorsChange >= 0 ? '+' : ''}{statistics.changeStats.uniqueVisitorsChange}%
                </span>
              )}
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {statistics?.uniqueVisitors || 0}
            </div>
            <div className="text-dark-text-secondary text-sm">Уникальных посетителей</div>
          </div>

          <div
            className="bg-dark-card rounded-2xl p-6 border border-dark-border"
          >
            <div className="flex items-center justify-between mb-2">
              <FaWhatsapp className="w-6 h-6 text-whatsapp-green" />
              {statistics?.changeStats?.whatsappClicksChange && (
                <span className={`text-xs font-semibold ${
                  statistics.changeStats.whatsappClicksChange >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {statistics.changeStats.whatsappClicksChange >= 0 ? '+' : ''}{statistics.changeStats.whatsappClicksChange}%
                </span>
              )}
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {statistics?.whatsappClicks || 0}
            </div>
            <div className="text-dark-text-secondary text-sm">WhatsApp переходы</div>
          </div>

          <div
            className="bg-dark-card rounded-2xl p-6 border border-dark-border"
          >
            <div className="flex items-center justify-between mb-2">
              <FaTelegram className="w-6 h-6 text-telegram-blue" />
              {statistics?.changeStats?.telegramClicksChange && (
                <span className={`text-xs font-semibold ${
                  statistics.changeStats.telegramClicksChange >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {statistics.changeStats.telegramClicksChange >= 0 ? '+' : ''}{statistics.changeStats.telegramClicksChange}%
                </span>
              )}
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {statistics?.telegramClicks || 0}
            </div>
            <div className="text-dark-text-secondary text-sm">Telegram переходы</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div
          className="bg-dark-card rounded-2xl p-6 border border-dark-border"
        >
          <h3 className="text-white font-semibold text-lg mb-4 flex items-center">
            <span className="mr-2">⚡</span> Быстрые действия
          </h3>
          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={handleCopyLink}
              className="w-full bg-primary-orange hover:bg-primary-orange-dark text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center space-x-2"
            >
              <FiShare2 className="w-5 h-5" />
              <span>Поделиться ссылкой</span>
            </button>

            <button
              onClick={handleOpenLanding}
              className="w-full bg-gradient-to-r from-primary-orange to-primary-orange-dark hover:from-primary-orange-dark hover:to-primary-orange text-white font-medium py-3 px-4 rounded-xl transition-all flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
            >
              <FiExternalLink className="w-5 h-5" />
              <span>Открыть лендинг</span>
            </button>

            <button
              onClick={() => window.location.href = '/analytics'}
              className="w-full bg-dark-bg hover:bg-dark-card-hover text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center space-x-2 border border-dark-border"
            >
              <FiTrendingUp className="w-5 h-5" />
              <span>Посмотреть аналитику</span>
            </button>

            <button
              onClick={() => window.location.href = '/history'}
              className="w-full bg-dark-bg hover:bg-dark-card-hover text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center space-x-2 border border-dark-border"
            >
              <FiEye className="w-5 h-5" />
              <span>История кликов</span>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div
          className="bg-dark-card rounded-2xl p-6 border border-dark-border"
        >
          <h3 className="text-white font-semibold text-lg mb-4 flex items-center">
            <span className="mr-2">📊</span> Последняя активность
          </h3>
          <div className="space-y-3">
            {statistics?.recentClicks?.length > 0 ? (
              statistics.recentClicks.slice(0, 5).map((click, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-dark-border last:border-0">
                  <div className="flex items-center space-x-3">
                    {click.type === 'whatsapp' ? (
                      <FaWhatsapp className="w-5 h-5 text-whatsapp-green" />
                    ) : (
                      <FaTelegram className="w-5 h-5 text-telegram-blue" />
                    )}
                    <div>
                      <div className="text-white text-sm">Клик по {click.type}</div>
                      <div className="text-dark-text-secondary text-xs">{click.time}</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-dark-text-secondary">
                Пока нет активности
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;