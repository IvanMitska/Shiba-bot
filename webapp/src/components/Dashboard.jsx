import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { FiCopy, FiRefreshCw, FiArrowRight, FiMousePointer, FiUsers, FiMessageCircle, FiSend, FiExternalLink, FiTrendingUp } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { partnerAPI } from '../services/api';
import { hapticFeedback } from '../services/telegram';

const StatCard = ({ icon: Icon, label, value, subtext, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-[#141419] border border-[#1f1f26] rounded-xl md:rounded-2xl p-4 md:p-6"
  >
    <div className="flex items-center justify-between mb-3 md:mb-4">
      <Icon className="w-4 h-4 md:w-5 md:h-5 text-zinc-500" />
      {subtext && (
        <span className="text-[10px] md:text-xs text-zinc-600 uppercase tracking-wider">{subtext}</span>
      )}
    </div>
    <div className="text-2xl md:text-4xl font-semibold text-white mb-0.5 md:mb-1 tabular-nums">
      {value.toLocaleString()}
    </div>
    <div className="text-zinc-500 text-xs md:text-sm">{label}</div>
  </motion.div>
);

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
      toast.success('Ссылка скопирована');
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleRefresh = () => {
    refetch();
    hapticFeedback('light');
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
        <div className="w-6 h-6 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
      </div>
    );
  }

  const partner = partnerInfo?.data;
  const statistics = stats?.data;

  return (
    <div className="space-y-6 md:space-y-8 pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-white">
            {partner?.firstName || 'Партнер'}
          </h1>
          <p className="text-zinc-500 text-sm md:text-base">Панель управления</p>
        </div>
        <button
          onClick={handleRefresh}
          className="p-2.5 md:p-3 text-zinc-500 hover:text-zinc-300 rounded-lg hover:bg-zinc-800/50 transition-colors"
        >
          <FiRefreshCw className="w-4 h-4 md:w-5 md:h-5" />
        </button>
      </motion.div>

      {/* Partner Link */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-[#141419] border border-[#1f1f26] rounded-xl md:rounded-2xl p-4 md:p-6"
      >
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <span className="text-zinc-400 text-sm md:text-base font-medium">Партнерская ссылка</span>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 text-xs md:text-sm text-zinc-500 hover:text-white transition-colors"
          >
            <FiCopy className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span>Копировать</span>
          </button>
        </div>
        <div className="bg-[#0c0c0f] rounded-lg md:rounded-xl px-3 md:px-4 py-2.5 md:py-3 border border-[#1f1f26]">
          <code className="text-zinc-300 text-sm md:text-base break-all">
            {partnerInfo?.data?.partnerLink || 'Загрузка...'}
          </code>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <StatCard
          icon={FiMousePointer}
          label="Всего кликов"
          value={statistics?.totalClicks || 0}
          subtext="за все время"
          delay={0.1}
        />
        <StatCard
          icon={FiUsers}
          label="Уникальных"
          value={statistics?.uniqueVisitors || 0}
          subtext="посетителей"
          delay={0.15}
        />
        <StatCard
          icon={FiMessageCircle}
          label="WhatsApp"
          value={statistics?.whatsappClicks || 0}
          delay={0.2}
        />
        <StatCard
          icon={FiSend}
          label="Telegram"
          value={statistics?.telegramClicks || 0}
          delay={0.25}
        />
      </div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-2 md:space-y-3"
      >
        <button
          onClick={handleCopyLink}
          className="w-full flex items-center justify-between bg-[#141419] hover:bg-[#1a1a21] border border-[#1f1f26] text-white px-4 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl transition-colors group"
        >
          <div className="flex items-center gap-3 md:gap-4">
            <FiCopy className="w-4 h-4 md:w-5 md:h-5 text-zinc-500" />
            <span className="text-sm md:text-base font-medium">Скопировать ссылку</span>
          </div>
          <FiArrowRight className="w-4 h-4 md:w-5 md:h-5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
        </button>

        <button
          onClick={handleOpenLanding}
          className="w-full flex items-center justify-between bg-[#141419] hover:bg-[#1a1a21] border border-[#1f1f26] text-white px-4 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl transition-colors group"
        >
          <div className="flex items-center gap-3 md:gap-4">
            <FiExternalLink className="w-4 h-4 md:w-5 md:h-5 text-zinc-500" />
            <span className="text-sm md:text-base font-medium">Открыть лендинг</span>
          </div>
          <FiArrowRight className="w-4 h-4 md:w-5 md:h-5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
        </button>

        <button
          onClick={() => window.location.href = '/analytics'}
          className="w-full flex items-center justify-between bg-[#141419] hover:bg-[#1a1a21] border border-[#1f1f26] text-white px-4 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl transition-colors group"
        >
          <div className="flex items-center gap-3 md:gap-4">
            <FiTrendingUp className="w-4 h-4 md:w-5 md:h-5 text-zinc-500" />
            <span className="text-sm md:text-base font-medium">Аналитика</span>
          </div>
          <FiArrowRight className="w-4 h-4 md:w-5 md:h-5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
        </button>
      </motion.div>

      {/* Recent Activity */}
      {statistics?.recentClicks?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-[#141419] border border-[#1f1f26] rounded-xl md:rounded-2xl p-4 md:p-6"
        >
          <h3 className="text-zinc-400 text-sm md:text-base font-medium mb-3 md:mb-4">Последние переходы</h3>
          <div className="space-y-2 md:space-y-3">
            {statistics.recentClicks.slice(0, 5).map((click, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 md:py-3 border-b border-[#1f1f26] last:border-0"
              >
                <div className="flex items-center gap-2.5 md:gap-3">
                  {click.type === 'whatsapp' ? (
                    <FiMessageCircle className="w-4 h-4 md:w-5 md:h-5 text-zinc-500" />
                  ) : (
                    <FiSend className="w-4 h-4 md:w-5 md:h-5 text-zinc-500" />
                  )}
                  <span className="text-zinc-300 text-sm md:text-base">
                    {click.type === 'whatsapp' ? 'WhatsApp' : 'Telegram'}
                  </span>
                </div>
                <span className="text-zinc-600 text-xs md:text-sm">{click.time}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Dashboard;
