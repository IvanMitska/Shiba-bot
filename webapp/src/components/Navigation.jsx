import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiHome, FiBarChart2, FiClock, FiSettings, FiMenu, FiX } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { useStore } from '../store/store';

const Navigation = () => {
  const location = useLocation();
  const { isAdmin } = useStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Главная', icon: FiHome, gradient: 'from-primary-500 to-primary-600' },
    { path: '/analytics', label: 'Аналитика', icon: FiBarChart2, gradient: 'from-accent-cyan to-primary-500' },
    { path: '/history', label: 'История', icon: FiClock, gradient: 'from-accent-purple to-accent-pink' },
    ...(isAdmin ? [{ path: '/admin', label: 'Админ', icon: FiSettings, gradient: 'from-accent-pink to-primary-600' }] : []),
  ];

  return (
    <nav className="relative">
      {/* Main Navigation */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-dark-900/80 backdrop-blur-lg border-b border-white/10 sticky top-0 z-50"
      >
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <motion.div 
              className="flex items-center gap-3"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="w-10 h-10 bg-gradient-to-r from-primary-500 via-accent-purple to-accent-pink rounded-lg flex items-center justify-center"
                >
                  <HiSparkles className="w-6 h-6 text-white" />
                </motion.div>
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-accent-purple rounded-lg blur opacity-50"></div>
              </div>
              <div className="text-2xl font-bold">
                <span className="gradient-text">PARTNER</span>
                <span className="text-white ml-1">PANEL</span>
              </div>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;

                return (
                  <motion.div key={item.path} className="relative">
                    <NavLink
                      to={item.path}
                      className="relative px-6 py-3 rounded-xl transition-all duration-300 flex items-center gap-3 group overflow-hidden"
                    >
                      {/* Background gradient on hover/active */}
                      <motion.div
                        className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-0 transition-opacity duration-300 ${
                          isActive ? 'opacity-100' : 'group-hover:opacity-20'
                        }`}
                      />
                      
                      {/* Icon */}
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className={`relative z-10 p-2 rounded-lg transition-colors ${
                          isActive 
                            ? 'bg-white/10 text-white' 
                            : 'text-dark-400 group-hover:text-white group-hover:bg-white/5'
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                      </motion.div>
                      
                      {/* Label */}
                      <span className={`relative z-10 font-medium transition-colors ${
                        isActive 
                          ? 'text-white' 
                          : 'text-dark-400 group-hover:text-white'
                      }`}>
                        {item.label}
                      </span>

                      {/* Active indicator */}
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-accent-purple rounded-full"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                    </NavLink>
                  </motion.div>
                );
              })}
            </div>

            {/* Mobile menu button */}
            <motion.button
              className="md:hidden p-2 text-dark-400 hover:text-white transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              whileTap={{ scale: 0.95 }}
            >
              {isMobileMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-dark-900/95 backdrop-blur-lg border-b border-white/10 overflow-hidden"
          >
            <div className="container mx-auto px-6 py-4 space-y-2">
              {navItems.map((item, index) => {
                const isActive = location.pathname === item.path;
                return (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <NavLink
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-300 ${
                        isActive 
                          ? 'bg-gradient-to-r ' + item.gradient + ' text-white' 
                          : 'text-dark-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </NavLink>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navigation;