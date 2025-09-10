import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion } from 'framer-motion';
import { FiUsers, FiActivity, FiSettings, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const AdminPanel = () => {
  const [selectedTab, setSelectedTab] = useState('partners');
  const queryClient = useQueryClient();

  const { data: dashboard } = useQuery(
    'adminDashboard',
    () => adminAPI.getDashboard(),
    { staleTime: 60 * 1000 }
  );

  const { data: partners, isLoading: partnersLoading } = useQuery(
    'adminPartners',
    () => adminAPI.getPartners({ limit: 100 }),
    { staleTime: 5 * 60 * 1000 }
  );

  const togglePartnerMutation = useMutation(
    ({ id, isActive }) => adminAPI.updatePartner(id, { isActive }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminPartners');
        toast.success('Статус партнера обновлен');
      },
      onError: () => {
        toast.error('Ошибка при обновлении статуса');
      },
    }
  );

  const handleTogglePartner = (partner) => {
    togglePartnerMutation.mutate({
      id: partner.id,
      isActive: !partner.isActive,
    });
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Панель администратора</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="stat-card from-blue-500 to-blue-600">
            <FiUsers className="w-8 h-8 mb-2 opacity-80" />
            <p className="text-3xl font-bold">{dashboard?.data?.totalPartners || 0}</p>
            <p className="text-sm opacity-90">Всего партнеров</p>
          </div>

          <div className="stat-card from-green-500 to-green-600">
            <FiActivity className="w-8 h-8 mb-2 opacity-80" />
            <p className="text-3xl font-bold">{dashboard?.data?.activePartners || 0}</p>
            <p className="text-sm opacity-90">Активных</p>
          </div>

          <div className="stat-card from-purple-500 to-purple-600">
            <p className="text-3xl font-bold">{dashboard?.data?.totalClicks || 0}</p>
            <p className="text-sm opacity-90">Всего кликов</p>
          </div>

          <div className="stat-card from-orange-500 to-orange-600">
            <p className="text-3xl font-bold">{dashboard?.data?.todayClicks || 0}</p>
            <p className="text-sm opacity-90">Кликов сегодня</p>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setSelectedTab('partners')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedTab === 'partners'
                ? 'bg-telegram-blue text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FiUsers className="inline mr-2" />
            Партнеры
          </button>
          <button
            onClick={() => setSelectedTab('analytics')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedTab === 'analytics'
                ? 'bg-telegram-blue text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FiActivity className="inline mr-2" />
            Аналитика
          </button>
          <button
            onClick={() => setSelectedTab('settings')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedTab === 'settings'
                ? 'bg-telegram-blue text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FiSettings className="inline mr-2" />
            Настройки
          </button>
        </div>
      </motion.div>

      {selectedTab === 'partners' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <h2 className="text-xl font-semibold mb-4">Управление партнерами</h2>
          
          {partnersLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-telegram-blue"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">ID</th>
                    <th className="text-left py-3 px-2">Имя</th>
                    <th className="text-left py-3 px-2">Username</th>
                    <th className="text-center py-3 px-2">Клики</th>
                    <th className="text-center py-3 px-2">Уникальные</th>
                    <th className="text-center py-3 px-2">Статус</th>
                    <th className="text-left py-3 px-2">Регистрация</th>
                  </tr>
                </thead>
                <tbody>
                  {partners?.data?.partners?.map((partner) => (
                    <tr key={partner.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-2">{partner.id}</td>
                      <td className="py-3 px-2">
                        {partner.firstName} {partner.lastName}
                      </td>
                      <td className="py-3 px-2">
                        {partner.username ? `@${partner.username}` : '-'}
                      </td>
                      <td className="text-center py-3 px-2">{partner.totalClicks}</td>
                      <td className="text-center py-3 px-2">{partner.uniqueVisitors}</td>
                      <td className="text-center py-3 px-2">
                        <button
                          onClick={() => handleTogglePartner(partner)}
                          className="inline-flex items-center"
                        >
                          {partner.isActive ? (
                            <FiToggleRight className="w-8 h-8 text-green-500" />
                          ) : (
                            <FiToggleLeft className="w-8 h-8 text-gray-400" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-2">
                        {format(new Date(partner.createdAt), 'dd.MM.yyyy')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}

      {selectedTab === 'analytics' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <h2 className="text-xl font-semibold mb-4">Системная аналитика</h2>
          <p className="text-gray-500">Раздел в разработке...</p>
        </motion.div>
      )}

      {selectedTab === 'settings' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <h2 className="text-xl font-semibold mb-4">Системные настройки</h2>
          <p className="text-gray-500">Раздел в разработке...</p>
        </motion.div>
      )}
    </div>
  );
};

export default AdminPanel;