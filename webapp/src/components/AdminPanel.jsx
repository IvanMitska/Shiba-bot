import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion } from 'framer-motion';
import { FiUsers, FiActivity, FiMousePointer, FiLogIn, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useStore } from '../store/store';

const AdminPanel = () => {
  const [selectedTab, setSelectedTab] = useState('clicks');
  const [secretKey, setSecretKey] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const queryClient = useQueryClient();
  const { isAdmin, setIsAdmin, setToken } = useStore();

  // Check if admin token exists
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      setIsAdmin(true);
      setToken(token);
    }
  }, [setIsAdmin, setToken]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);

    try {
      const response = await adminAPI.login(secretKey);
      const { token } = response.data;

      localStorage.setItem('adminToken', token);
      localStorage.setItem('token', token);
      setToken(token);
      setIsAdmin(true);
      toast.success('Успешный вход');
      setSecretKey('');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Ошибка входа');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const { data: dashboard } = useQuery(
    'adminDashboard',
    () => adminAPI.getDashboard(),
    {
      enabled: isAdmin,
      staleTime: 60 * 1000,
      retry: false,
      onError: () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('token');
        setIsAdmin(false);
      }
    }
  );

  const { data: clicks, isLoading: clicksLoading } = useQuery(
    'adminClicks',
    () => adminAPI.getAllClicks({ limit: 100 }),
    {
      enabled: isAdmin && selectedTab === 'clicks',
      staleTime: 30 * 1000,
      retry: false
    }
  );

  const { data: partners, isLoading: partnersLoading } = useQuery(
    'adminPartners',
    () => adminAPI.getPartners({ limit: 100 }),
    {
      enabled: isAdmin && selectedTab === 'partners',
      staleTime: 5 * 60 * 1000,
      retry: false
    }
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

  // Login form
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 md:p-8">
            <div className="text-center mb-6">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-zinc-800 rounded-xl flex items-center justify-center mx-auto mb-4">
                <FiLogIn className="w-6 h-6 md:w-7 md:h-7 text-zinc-400" />
              </div>
              <h1 className="text-lg md:text-xl font-semibold text-zinc-100">Админ панель</h1>
              <p className="text-sm text-zinc-500 mt-1">Введите секретный ключ</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="password"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="Секретный ключ"
                className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                autoFocus
              />
              <button
                type="submit"
                disabled={isLoggingIn || !secretKey}
                className="w-full py-3 bg-zinc-100 text-zinc-900 font-medium rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoggingIn ? 'Вход...' : 'Войти'}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
      >
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 md:p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-zinc-800 rounded-lg flex items-center justify-center">
              <FiUsers className="w-4 h-4 md:w-5 md:h-5 text-zinc-400" />
            </div>
          </div>
          <p className="text-xl md:text-2xl font-semibold text-zinc-100">
            {dashboard?.data?.totalPartners || 0}
          </p>
          <p className="text-xs md:text-sm text-zinc-500">Партнеров</p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 md:p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-zinc-800 rounded-lg flex items-center justify-center">
              <FiActivity className="w-4 h-4 md:w-5 md:h-5 text-zinc-400" />
            </div>
          </div>
          <p className="text-xl md:text-2xl font-semibold text-zinc-100">
            {dashboard?.data?.activePartners || 0}
          </p>
          <p className="text-xs md:text-sm text-zinc-500">Активных</p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 md:p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-zinc-800 rounded-lg flex items-center justify-center">
              <FiMousePointer className="w-4 h-4 md:w-5 md:h-5 text-zinc-400" />
            </div>
          </div>
          <p className="text-xl md:text-2xl font-semibold text-zinc-100">
            {dashboard?.data?.totalClicks || 0}
          </p>
          <p className="text-xs md:text-sm text-zinc-500">Всего кликов</p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 md:p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-zinc-800 rounded-lg flex items-center justify-center">
              <FiMousePointer className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />
            </div>
          </div>
          <p className="text-xl md:text-2xl font-semibold text-zinc-100">
            {dashboard?.data?.todayClicks || 0}
          </p>
          <p className="text-xs md:text-sm text-zinc-500">Сегодня</p>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 md:p-6"
      >
        <div className="flex gap-2 mb-4 md:mb-6">
          <button
            onClick={() => setSelectedTab('clicks')}
            className={`px-3 md:px-4 py-2 rounded-lg text-sm md:text-base font-medium transition-colors ${
              selectedTab === 'clicks'
                ? 'bg-zinc-100 text-zinc-900'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FiMousePointer className="inline mr-2" />
            Клики
          </button>
          <button
            onClick={() => setSelectedTab('partners')}
            className={`px-3 md:px-4 py-2 rounded-lg text-sm md:text-base font-medium transition-colors ${
              selectedTab === 'partners'
                ? 'bg-zinc-100 text-zinc-900'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FiUsers className="inline mr-2" />
            Партнеры
          </button>
        </div>

        {/* Clicks tab */}
        {selectedTab === 'clicks' && (
          <div>
            <h2 className="text-base md:text-lg font-semibold text-zinc-100 mb-4">
              Все клики ({clicks?.data?.total || 0})
            </h2>

            {clicksLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left py-3 px-2 text-zinc-500 font-medium">Дата</th>
                      <th className="text-left py-3 px-2 text-zinc-500 font-medium">Партнер</th>
                      <th className="text-left py-3 px-2 text-zinc-500 font-medium">Тип</th>
                      <th className="text-left py-3 px-2 text-zinc-500 font-medium hidden md:table-cell">Устройство</th>
                      <th className="text-left py-3 px-2 text-zinc-500 font-medium hidden md:table-cell">Страна</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clicks?.data?.clicks?.map((click) => (
                      <tr key={click.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                        <td className="py-3 px-2 text-zinc-300">
                          {format(new Date(click.clickedAt), 'dd.MM HH:mm')}
                        </td>
                        <td className="py-3 px-2">
                          <div className="text-zinc-100">
                            {click.partner?.firstName || 'Unknown'}
                          </div>
                          <div className="text-xs text-zinc-500">
                            {click.partner?.username ? `@${click.partner.username}` : click.partner?.uniqueCode}
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            click.redirectType === 'whatsapp'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : click.redirectType === 'telegram'
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-zinc-700 text-zinc-400'
                          }`}>
                            {click.redirectType || 'landing'}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-zinc-400 hidden md:table-cell">
                          {click.deviceType || '-'}
                        </td>
                        <td className="py-3 px-2 text-zinc-400 hidden md:table-cell">
                          {click.country || '-'}
                        </td>
                      </tr>
                    ))}
                    {(!clicks?.data?.clicks || clicks.data.clicks.length === 0) && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-zinc-500">
                          Нет данных
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Partners tab */}
        {selectedTab === 'partners' && (
          <div>
            <h2 className="text-base md:text-lg font-semibold text-zinc-100 mb-4">
              Партнеры ({partners?.data?.total || 0})
            </h2>

            {partnersLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left py-3 px-2 text-zinc-500 font-medium">Партнер</th>
                      <th className="text-center py-3 px-2 text-zinc-500 font-medium">Клики</th>
                      <th className="text-center py-3 px-2 text-zinc-500 font-medium hidden md:table-cell">Уник.</th>
                      <th className="text-center py-3 px-2 text-zinc-500 font-medium">Статус</th>
                      <th className="text-left py-3 px-2 text-zinc-500 font-medium hidden md:table-cell">Дата</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partners?.data?.partners?.map((partner) => (
                      <tr key={partner.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                        <td className="py-3 px-2">
                          <div className="text-zinc-100">
                            {partner.firstName} {partner.lastName}
                          </div>
                          <div className="text-xs text-zinc-500">
                            {partner.username ? `@${partner.username}` : partner.uniqueCode}
                          </div>
                        </td>
                        <td className="text-center py-3 px-2 text-zinc-100 font-medium">
                          {partner.totalClicks}
                        </td>
                        <td className="text-center py-3 px-2 text-zinc-400 hidden md:table-cell">
                          {partner.uniqueVisitors}
                        </td>
                        <td className="text-center py-3 px-2">
                          <button
                            onClick={() => handleTogglePartner(partner)}
                            className="inline-flex items-center"
                          >
                            {partner.isActive ? (
                              <FiToggleRight className="w-6 h-6 md:w-7 md:h-7 text-emerald-500" />
                            ) : (
                              <FiToggleLeft className="w-6 h-6 md:w-7 md:h-7 text-zinc-600" />
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-2 text-zinc-500 hidden md:table-cell">
                          {format(new Date(partner.createdAt), 'dd.MM.yyyy')}
                        </td>
                      </tr>
                    ))}
                    {(!partners?.data?.partners || partners.data.partners.length === 0) && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-zinc-500">
                          Нет партнеров
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AdminPanel;
