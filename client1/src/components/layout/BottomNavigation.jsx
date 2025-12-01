// components/layout/BottomNavigation.jsx - Premium Bottom Nav
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home,
  MessageCircle,
  PieChart,
  Wallet,
  User,
  Sparkles
} from 'lucide-react';

const BottomNavigation = () => {
  const location = useLocation();

  const navItems = [
    { path: '/home', icon: Home, label: 'Home' },
    { path: '/chat', icon: MessageCircle, label: 'Chat' },
    { path: '/charts', icon: PieChart, label: 'Charts' },
    { path: '/wallet', icon: Wallet, label: 'Wallet' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <motion.nav
      className="fixed bottom-0 left-0 right-0 bg-space-800/90 backdrop-blur-xl border-t border-purple-500/20 safe-area-bottom z-40"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="flex justify-around items-center px-2 py-3">
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center flex-1 min-w-0"
            >
              <motion.div
                className={`relative p-3 rounded-2xl transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/25'
                    : 'text-gray-400 hover:text-white'
                }`}
                whileTap={{ scale: 0.9 }}
              >
                <Icon size={20} />

                {/* Active Indicator */}
                {isActive && (
                  <motion.div
                    className="absolute -top-1 -right-1 w-2 h-2 bg-gold-400 rounded-full"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  />
                )}
              </motion.div>

              <span className={`text-xs mt-1 font-medium transition-colors ${
                isActive ? 'text-white' : 'text-gray-400'
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
};

export default BottomNavigation;
