import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { FiCalendar, FiGlobe, FiSmartphone, FiClock } from 'react-icons/fi';
import { FaWhatsapp, FaTelegram } from 'react-icons/fa';
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

  const getMessengerIcon = (type) => {
    switch (type) {
      case 'whatsapp':
        return <FaWhatsapp className="text-whatsapp-green" />;
      case 'telegram':
        return <FaTelegram className="text-telegram-blue" />;
      default:
        return null;
    }
  };

  const getDeviceIcon = (device) => {
    const isMobile = ['mobile', 'tablet'].includes(device?.toLowerCase());
    return <FiSmartphone className={isMobile ? 'text-blue-500' : 'text-gray-500'} />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-telegram-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">История переходов</h1>
          <span className="text-sm text-gray-500">
            Всего: {total} {total === 1 ? 'переход' : 'переходов'}
          </span>
        </div>

        {clicks.length > 0 ? (
          <div className="space-y-3">
            {clicks.map((click, index) => (
              <motion.div
                key={click.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FiCalendar className="text-gray-400" />
                      <span className="font-medium">
                        {format(new Date(click.clickedAt), 'dd MMMM yyyy', { locale: ru })}
                      </span>
                      <FiClock className="text-gray-400 ml-2" />
                      <span className="text-gray-600">
                        {format(new Date(click.clickedAt), 'HH:mm:ss')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <FiGlobe className="text-gray-400" />
                        <span className="text-gray-600">
                          {click.city || 'Неизвестно'}, {click.country || 'N/A'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {getDeviceIcon(click.deviceType)}
                        <span className="text-gray-600">
                          {click.deviceType || 'Desktop'}
                        </span>
                      </div>

                      {click.browser && (
                        <div className="text-gray-600">
                          Браузер: {click.browser}
                        </div>
                      )}

                      {click.os && (
                        <div className="text-gray-600">
                          ОС: {click.os}
                        </div>
                      )}
                    </div>

                    {(click.utmSource || click.utmMedium || click.utmCampaign) && (
                      <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                        <span className="font-medium text-blue-700">UTM: </span>
                        {click.utmSource && (
                          <span className="text-gray-600">source={click.utmSource} </span>
                        )}
                        {click.utmMedium && (
                          <span className="text-gray-600">medium={click.utmMedium} </span>
                        )}
                        {click.utmCampaign && (
                          <span className="text-gray-600">campaign={click.utmCampaign}</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-center gap-2 ml-4">
                    {getMessengerIcon(click.redirectType)}
                    {click.isUnique && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        Уникальный
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">История переходов пуста</p>
            <p className="text-sm text-gray-400 mt-2">
              Поделитесь своей партнерской ссылкой, чтобы начать получать переходы
            </p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0 || isFetching}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Назад
            </button>
            
            <span className="px-4 py-2">
              {page + 1} / {totalPages}
            </span>
            
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1 || isFetching}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Вперед
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default History;