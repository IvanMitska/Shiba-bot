import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCopy, FiExternalLink, FiRefreshCw, FiTrendingUp, FiUsers, FiMousePointer, FiArrowUp, FiArrowDown, FiEye, FiShare2 } from 'react-icons/fi';
import { FaWhatsapp, FaTelegram } from 'react-icons/fa';
import { HiSparkles, HiLightningBolt } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { partnerAPI } from '../services/api';
import { hapticFeedback } from '../services/telegram';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const Dashboard = () => {
  const [copiedLink, setCopiedLink] = useState(false);

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

  if (infoLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const partner = partnerInfo?.data;
  const statistics = stats?.data;

  return (
    <div className="space-y-8 p-6">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden"
      >
        <div className="card-glass">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 via-accent-purple/20 to-accent-pink/20 opacity-50"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <div>
                <motion.h1 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl font-bold text-white mb-2"
                >
                  Добро пожаловать, <span className="gradient-text">{partner?.firstName || 'Партнер'}</span>! 
                  <motion.span
                    animate={{ rotate: [0, 20, 0] }}
                    transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
                    className="inline-block ml-2"
                  >
                    👋
                  </motion.span>
                </motion.h1>
                <p className="text-dark-300">Управляйте своими партнерскими ссылками</p>
              </div>
              <motion.button
                onClick={handleRefresh}
                whileHover={{ scale: 1.1, rotate: 180 }}
                whileTap={{ scale: 0.9 }}
                className="p-4 glass-card hover:bg-white/20 transition-all duration-300"
              >
                <FiRefreshCw className="w-6 h-6 text-primary-500" />
              </motion.button>
            </div>

            {/* Partner Link Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-r from-primary-500 via-accent-purple to-accent-pink p-1 rounded-2xl"
            >
              <div className="bg-dark-800 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <HiSparkles className="w-6 h-6 text-primary-500" />
                  <span className="text-lg font-semibold text-white">Ваша партнерская ссылка</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-dark-700 p-4 rounded-xl">
                    <code className="text-sm font-mono text-primary-300 break-all">
                      {partner?.partnerLink}
                    </code>
                  </div>
                  <motion.button
                    onClick={handleCopyLink}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`p-4 rounded-xl transition-all duration-300 ${
                      copiedLink 
                        ? 'bg-accent-green text-white' 
                        : 'bg-primary-500 hover:bg-primary-600 text-white'
                    }`}
                  >
                    <AnimatePresence mode="wait">
                      {copiedLink ? (
                        <motion.div
                          key="copied"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                        >
                          ✓
                        </motion.div>
                      ) : (
                        <motion.div
                          key="copy"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                        >
                          <FiCopy className="w-5 h-5" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                  {navigator.share && (
                    <motion.button
                      onClick={handleShare}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-4 bg-accent-cyan hover:bg-accent-cyan/80 text-white rounded-xl transition-all duration-300"
                    >
                      <FiShare2 className="w-5 h-5" />
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Statistics Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {[
          {
            icon: FiMousePointer,
            value: statistics?.totalClicks || 0,
            label: 'Всего кликов',
            gradient: 'from-primary-500 to-primary-600',
            delay: 0.1,
            trend: '+12%'
          },
          {
            icon: FiUsers,
            value: statistics?.uniqueVisitors || 0,
            label: 'Уникальные посетители',
            gradient: 'from-accent-cyan to-primary-500',
            delay: 0.2,
            trend: '+8%'
          },
          {
            icon: FaWhatsapp,
            value: statistics?.whatsappClicks || 0,
            label: 'WhatsApp переходы',
            gradient: 'from-whatsapp-green to-whatsapp-dark',
            delay: 0.3,
            trend: '+15%'
          },
          {
            icon: FaTelegram,
            value: statistics?.telegramClicks || 0,
            label: 'Telegram переходы',
            gradient: 'from-telegram-blue to-telegram-dark',
            delay: 0.4,
            trend: '+5%'
          }
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: stat.delay }}
            whileHover={{ 
              y: -8,
              transition: { duration: 0.2 }
            }}
            className="relative group"
          >
            <div className={`absolute inset-0 bg-gradient-to-r ${stat.gradient} rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>
            <div className="relative card-glass p-6 group-hover:border-white/30 transition-all duration-300">
              {/* Icon with floating animation */}
              <div className="flex items-center justify-between mb-4">
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className={`p-3 rounded-xl bg-gradient-to-r ${stat.gradient}`}
                >
                  <stat.icon className="w-6 h-6 text-white" />
                </motion.div>
                {stat.trend && (
                  <div className="flex items-center text-accent-green text-sm font-medium">
                    <FiArrowUp className="w-4 h-4 mr-1" />
                    {stat.trend}
                  </div>
                )}
              </div>
              
              {/* Value with counter animation */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: stat.delay + 0.2, type: "spring", stiffness: 200 }}
                className="text-4xl font-bold text-white mb-2"
              >
                {stat.value}
              </motion.div>
              
              <p className="text-dark-400 text-sm">{stat.label}</p>
              
              {/* Glow effect on hover */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${stat.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none`}></div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="card-glass"
      >
        <div className="flex items-center gap-3 mb-6">
          <HiLightningBolt className="w-6 h-6 text-accent-cyan" />
          <h3 className="text-xl font-semibold text-white">Быстрые действия</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleShare}
            className="p-4 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl text-white font-medium transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/25"
          >
            <FiShare2 className="w-5 h-5 mx-auto mb-2" />
            Поделиться ссылкой
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => window.location.href = '/analytics'}
            className="p-4 bg-gradient-to-r from-accent-purple to-accent-pink rounded-xl text-white font-medium transition-all duration-300 hover:shadow-lg"
          >
            <FiTrendingUp className="w-5 h-5 mx-auto mb-2" />
            Посмотреть аналитику
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => window.location.href = '/history'}
            className="p-4 bg-gradient-to-r from-accent-cyan to-accent-purple rounded-xl text-white font-medium transition-all duration-300 hover:shadow-lg"
          >
            <FiEye className="w-5 h-5 mx-auto mb-2" />
            История кликов
          </motion.button>
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="card-glass"
      >
        <div className="flex items-center gap-3 mb-6">
          <FiTrendingUp className="w-6 h-6 text-accent-pink" />
          <h3 className="text-xl font-semibold text-white">Последняя активность</h3>
        </div>

        {statistics?.recentClicks?.length > 0 ? (
          <div className="space-y-4">
            {statistics.recentClicks.slice(0, 5).map((click, index) => (
              <motion.div
                key={click.id}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 bg-dark-700/50 rounded-xl hover:bg-dark-600/50 transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                    className="p-2 bg-gradient-to-r from-accent-cyan to-primary-500 rounded-lg"
                  >
                    {click.redirectType === 'whatsapp' ? (
                      <FaWhatsapp className="w-4 h-4 text-white" />
                    ) : click.redirectType === 'telegram' ? (
                      <FaTelegram className="w-4 h-4 text-white" />
                    ) : (
                      <FiMousePointer className="w-4 h-4 text-white" />
                    )}
                  </motion.div>
                  <div>
                    <p className="font-medium text-white">
                      {click.city || 'Неизвестно'}, {click.country || 'N/A'}
                    </p>
                    <p className="text-sm text-dark-400">
                      {format(new Date(click.clickedAt), 'dd MMM HH:mm', { locale: ru })} • {click.deviceType}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-dark-400 bg-dark-800 px-3 py-1 rounded-full">
                  Клик #{index + 1}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-accent-purple rounded-full flex items-center justify-center mx-auto mb-4">
              <FiMousePointer className="w-8 h-8 text-white" />
            </div>
            <p className="text-dark-400 mb-2">Пока нет переходов по вашей ссылке</p>
            <p className="text-sm text-dark-500">Поделитесь ссылкой, чтобы увидеть активность!</p>
          </motion.div>
        )}
      </motion.div>

      {/* Tips Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="relative overflow-hidden rounded-2xl"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-gradient-from via-gradient-via to-gradient-to"></div>
        <div className="relative bg-dark-800/90 backdrop-blur-sm p-6 m-1 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              💡
            </motion.div>
            <h3 className="text-lg font-semibold text-white">Совет для увеличения переходов</h3>
          </div>
          <p className="text-dark-300 leading-relaxed">
            Добавьте партнерскую ссылку в описание своих социальных сетей и активно делитесь ею с друзьями. 
            Используйте призывы к действию: "Арендуй авто по выгодной цене!" для привлечения внимания.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;