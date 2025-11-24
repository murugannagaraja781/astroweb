 import { Link, useLocation } from 'react-router-dom';
import { Home, LayoutDashboard, MessageCircle, Video, User, Sparkles, LogOut } from 'lucide-react';
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const MobileNav = () => {
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);

  const getDashboardLink = () => {
    if (!user) return '/';
    if (user.role === 'admin') return '/dashboard';
    if (user.role === 'astrologer') return '/astrologer-dashboard';
    return '/dashboard';
  };

  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: getDashboardLink(), icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/chat/0', icon: MessageCircle, label: 'Chat' },
    { to: '/call/0', icon: Video, label: 'Call' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <motion.nav
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border-t border-gray-200/80 dark:border-gray-700/80 z-50 safe-area-bottom"
      style={{
        // React Native-like shadow
        boxShadow: '0 -2px 20px rgba(0, 0, 0, 0.08), 0 -1px 4px rgba(0, 0, 0, 0.04)',
      }}
    >
      <div className="relative flex justify-around items-center px-1 py-2">
        <AnimatePresence>
          {navItems.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to ||
                            (location.pathname.startsWith('/chat') && to === '/chat/0') ||
                            (location.pathname.startsWith('/call') && to === '/call/0');

            return (
              <motion.div
                key={to}
                className="relative flex-1 mx-1"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to={to}
                  className={`relative flex flex-col items-center p-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'text-purple-600 dark:text-purple-400'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {/* React Native-style active indicator */}
                  {isActive && (
                    <motion.div
                      className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-purple-500 dark:bg-purple-400 rounded-full"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 15 }}
                    />
                  )}

                  {/* Icon Container - React Native style */}
                  <div className={`relative flex items-center justify-center w-12 h-10 rounded-2xl transition-all duration-200 ${
                    isActive
                      ? 'bg-purple-50 dark:bg-purple-900/30'
                      : 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800/50'
                  }`}>
                    <Icon
                      size={22}
                      strokeWidth={isActive ? 2.5 : 2}
                      className={
                        isActive
                          ? 'text-purple-600 dark:text-purple-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }
                    />

                    {/* Notification Badge - React Native style */}
                    {(to === '/chat/0' || to === '/call/0') && (
                      <motion.div
                        className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-gray-900"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 15 }}
                      />
                    )}
                  </div>

                  {/* Label - React Native style typography */}
                  <motion.span
                    className={`text-[11px] font-semibold mt-1 tracking-tight ${
                      isActive
                        ? 'text-purple-600 dark:text-purple-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                    initial={{ opacity: 0, y: 2 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                    }}
                  >
                    {label}
                  </motion.span>

                  {/* Ripple effect on tap */}
                  <motion.div
                    className="absolute inset-0 bg-purple-100 dark:bg-purple-800/30 rounded-xl opacity-0"
                    whileTap={{ opacity: 1 }}
                    transition={{ duration: 0.1 }}
                  />
                </Link>
              </motion.div>
            );
          })}

          {/* Auth Button - React Native style */}
          <motion.div
            className="relative flex-1 mx-1"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
          >
            {user ? (
              <button
                onClick={handleLogout}
                className="relative w-full flex flex-col items-center p-3 rounded-xl text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-all duration-200"
              >
                <div className="relative flex items-center justify-center w-12 h-10 rounded-2xl bg-transparent hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200">
                  <LogOut size={22} strokeWidth={2} />
                </div>
                <span
                  className="text-[11px] font-semibold mt-1 tracking-tight"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                  }}
                >
                  Logout
                </span>

                {/* Ripple effect */}
                <motion.div
                  className="absolute inset-0 bg-red-100 dark:bg-red-800/30 rounded-xl opacity-0"
                  whileTap={{ opacity: 1 }}
                  transition={{ duration: 0.1 }}
                />
              </button>
            ) : (
              <Link
                to="/login"
                className="relative flex flex-col items-center p-3 rounded-xl text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-all duration-200"
              >
                <div className="relative flex items-center justify-center w-12 h-10 rounded-2xl bg-transparent hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200">
                  <Sparkles size={22} strokeWidth={2} />
                </div>
                <span
                  className="text-[11px] font-semibold mt-1 tracking-tight"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                  }}
                >
                  Login
                </span>

                {/* Ripple effect */}
                <motion.div
                  className="absolute inset-0 bg-green-100 dark:bg-green-800/30 rounded-xl opacity-0"
                  whileTap={{ opacity: 1 }}
                  transition={{ duration: 0.1 }}
                />
              </Link>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* iOS-style home indicator */}
      <div className="w-full pb-1 flex justify-center">
        <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
      </div>
    </motion.nav>
  );
};

export default MobileNav;