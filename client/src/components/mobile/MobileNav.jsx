 import { Link, useLocation } from 'react-router-dom';
import { Home, LayoutDashboard, MessageCircle, Video, User, Sparkles, LogOut } from 'lucide-react';
import { useContext } from 'react';
import AuthContext from '../../context/AuthContext';
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
      className="fixed bottom-4 left-4 right-4 bg-gradient-to-br from-purple-900/90 to-space-900/90 backdrop-blur-2xl border border-purple-500/30 rounded-3xl shadow-2xl z-50"
      style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
    >
      {/* Floating Stars Background */}
      <div className="absolute inset-0 overflow-hidden rounded-3xl">
        <motion.div
          className="absolute top-2 left-6 w-1 h-1 bg-gold-400 rounded-full"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-4 right-8 w-1 h-1 bg-purple-300 rounded-full"
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
        />
      </div>

      <div className="relative flex justify-around items-center px-2 py-3">
        <AnimatePresence>
          {navItems.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to;

            return (
              <motion.div
                key={to}
                className="relative"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Link
                  to={to}
                  className={`relative flex flex-col items-center p-2 rounded-2xl transition-all duration-300 ${
                    isActive
                      ? 'text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {/* Active Background Glow */}
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-purple-600/30 to-gold-500/20 rounded-2xl border border-purple-400/50"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      layoutId="activeNav"
                    />
                  )}

                  {/* Icon Container */}
                  <div className={`relative z-10 p-2 rounded-xl transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-br from-purple-600 to-purple-700 shadow-lg shadow-purple-500/25'
                      : 'bg-space-700/50 hover:bg-space-600/50'
                  }`}>
                    <Icon
                      size={20}
                      className={isActive ? 'text-white' : 'text-gray-400'}
                    />

                    {/* Active Pulse Dot */}
                    {isActive && (
                      <motion.div
                        className="absolute -top-1 -right-1 w-2 h-2 bg-gold-400 rounded-full border-2 border-space-900"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 15 }}
                      />
                    )}
                  </div>

                  {/* Label */}
                  <motion.span
                    className={`text-xs mt-1 font-medium z-10 ${
                      isActive ? 'text-white' : 'text-gray-400'
                    }`}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    {label}
                  </motion.span>

                  {/* Hover Effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-gold-500/10 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-300"
                    whileHover={{ opacity: 1 }}
                  />
                </Link>
              </motion.div>
            );
          })}

          {/* Auth Button */}
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="relative"
          >
            {user ? (
              <button
                onClick={handleLogout}
                className="flex flex-col items-center p-2 text-red-400 hover:text-red-300 transition-colors duration-300"
              >
                <div className="relative p-2 rounded-xl bg-space-700/50 hover:bg-red-500/20 transition-all duration-300">
                  <LogOut size={20} />
                </div>
                <span className="text-xs mt-1 font-medium">Logout</span>
              </button>
            ) : (
              <Link
                to="/login"
                className="flex flex-col items-center p-2 text-green-400 hover:text-green-300 transition-colors duration-300"
              >
                <div className="relative p-2 rounded-xl bg-space-700/50 hover:bg-green-500/20 transition-all duration-300">
                  <Sparkles size={20} />
                </div>
                <span className="text-xs mt-1 font-medium">Login</span>
              </Link>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Top Border Glow */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent" />
    </motion.nav>
  );
};

export default MobileNav;