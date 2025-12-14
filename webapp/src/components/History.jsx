import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { FiClock, FiGlobe, FiSmartphone, FiMonitor, FiChevronLeft, FiChevronRight, FiMessageCircle, FiSend } from 'react-icons/fi';
import { partnerAPI } from '../services/api';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const History = () => {
  const [page, setPage] = useState(0);
  const limit = 20;

  const { data, isLoading, isFetching } = useQuery(
    ['clicks', page],
    () => partnerAPI.getClicks({ limit, offset: page * limit }),
    {
      staleTime: 60 * 1000,
      keepPreviousData: true
    }
  );

  const clicks = data?.data?.clicks || [];
  const total = data?.data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-white">История</h1>
          <p className="text-zinc-500 text-sm md:text-base">Все переходы</p>
        </div>
        <div className="bg-[#141419] border border-[#1f1f26] rounded-lg px-3 md:px-4 py-1.5 md:py-2">
          <span className="text-zinc-500 text-xs md:text-sm">Всего: </span>
          <span className="text-white text-xs md:text-sm font-medium">{total}</span>
        </div>
      </motion.div>

      {/* Clicks List */}
      <div className="space-y-2 md:space-y-3">
        {clicks.length > 0 ? (
          clicks.map((click, index) => (
            <motion.div
              key={click.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
              className="bg-[#141419] border border-[#1f1f26] rounded-xl md:rounded-2xl p-4 md:p-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                  {/* Icon */}
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-[#1f1f26] rounded-xl flex items-center justify-center flex-shrink-0">
                    {click.redirectType === 'whatsapp' ? (
                      <FiMessageCircle className="w-4 h-4 md:w-5 md:h-5 text-zinc-500" />
                    ) : (
                      <FiSend className="w-4 h-4 md:w-5 md:h-5 text-zinc-500" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 md:gap-3 text-sm md:text-base">
                      <span className="text-white font-medium">
                        {click.redirectType === 'whatsapp' ? 'WhatsApp' : 'Telegram'}
                      </span>
                      {click.isUnique && (
                        <span className="text-[10px] md:text-xs text-zinc-500 bg-zinc-800 px-1.5 md:px-2 py-0.5 md:py-1 rounded">
                          NEW
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 md:gap-4 text-xs md:text-sm text-zinc-500 mt-1">
                      <span>{format(new Date(click.clickedAt), 'dd MMM, HH:mm', { locale: ru })}</span>
                      {click.country && (
                        <span className="flex items-center gap-1">
                          <FiGlobe className="w-3 h-3 md:w-4 md:h-4" />
                          {click.country}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Device */}
                <div className="flex-shrink-0">
                  {['mobile', 'tablet'].includes(click.deviceType?.toLowerCase()) ? (
                    <FiSmartphone className="w-4 h-4 md:w-5 md:h-5 text-zinc-600" />
                  ) : (
                    <FiMonitor className="w-4 h-4 md:w-5 md:h-5 text-zinc-600" />
                  )}
                </div>
              </div>

              {/* UTM Tags */}
              {(click.utmSource || click.utmMedium || click.utmCampaign) && (
                <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-[#1f1f26] flex flex-wrap gap-2">
                  {click.utmSource && (
                    <span className="text-[10px] md:text-xs text-zinc-500 bg-[#0c0c0f] px-2 md:px-3 py-1 rounded-lg">
                      {click.utmSource}
                    </span>
                  )}
                  {click.utmMedium && (
                    <span className="text-[10px] md:text-xs text-zinc-500 bg-[#0c0c0f] px-2 md:px-3 py-1 rounded-lg">
                      {click.utmMedium}
                    </span>
                  )}
                  {click.utmCampaign && (
                    <span className="text-[10px] md:text-xs text-zinc-500 bg-[#0c0c0f] px-2 md:px-3 py-1 rounded-lg">
                      {click.utmCampaign}
                    </span>
                  )}
                </div>
              )}
            </motion.div>
          ))
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-[#141419] border border-[#1f1f26] rounded-xl md:rounded-2xl p-10 md:p-16 text-center"
          >
            <FiClock className="w-10 h-10 md:w-12 md:h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-400 text-base md:text-lg">История пуста</p>
            <p className="text-zinc-600 text-sm md:text-base mt-2">Поделитесь ссылкой для начала отслеживания</p>
          </motion.div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 md:gap-4">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0 || isFetching}
            className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-[#141419] border border-[#1f1f26] text-zinc-400 rounded-xl text-xs md:text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:text-white transition-colors"
          >
            <FiChevronLeft className="w-4 h-4" />
            Назад
          </button>

          <span className="text-zinc-500 text-sm md:text-base px-2">
            {page + 1} / {totalPages}
          </span>

          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1 || isFetching}
            className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-[#141419] border border-[#1f1f26] text-zinc-400 rounded-xl text-xs md:text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:text-white transition-colors"
          >
            Вперед
            <FiChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default History;
