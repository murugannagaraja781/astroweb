 import { Link, useLocation } from 'react-router-dom';
import { Home, LayoutDashboard, MessageCircle, Video, User } from 'lucide-react';
import { useContext } from 'react';
import AuthContext from '../../context/AuthContext';
import ThemeContext from '../../context/ThemeContext';
import { motion } from 'framer-motion';

const MobileNav = () => {
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);

  const getDashboardLink = () => {
    if (!user) return '/';
    if (user.role === 'admin') return '/dashboard';
    if (user.role === 'astrologer') return '/astrologer-dashboard';
    return '/dashboard';
  };

  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: getDashboardLink(), icon: LayoutDashboard, label: 'Dash' },
    { to: '/chat/0', icon: MessageCircle, label: 'Chat' },
    { to: '/call/0', icon: Video, label: 'Call' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <motion.nav
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 z-50 pb-safe-bottom"
      style={{
        background: `linear-gradient(to top, #0a0015 0%, #1a0033 100%)`,
        borderTop: `1px solid ${theme.hex}30`,
        boxShadow: `0 -4px 20px ${theme.hex}20`
      }}
    >
      {/* Mystical Glow Line */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(to right, transparent, ${theme.hex}, transparent)` }}></div>

      <div className="flex justify-around items-center px-2 py-3 relative z-10">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;

          return (
            <Link
              key={to}
              to={to}
              className="relative flex flex-col items-center justify-center w-16 h-14"
            >
              <div className="relative">
                {/* Active Indicator Background */}
                {isActive && (
                  <motion.div
                    layoutId="mobileNavActive"
                    className="absolute inset-0 rounded-xl blur-sm opacity-50"
                    style={{ background: `linear-gradient(to top right, ${theme.hex}, #4f46e5)` }}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}

                {/* Icon */}
                <div className={`relative z-10 p-2 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'text-white shadow-lg transform -translate-y-2'
                    : 'text-gray-400 hover:text-white'
                }`} style={isActive ? {
                    background: `linear-gradient(to bottom right, #d4af37, ${theme.hex})`,
                    boxShadow: `0 4px 15px ${theme.hex}40`
                } : {}}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </div>
              </div>

              {/* Label */}
              <span className={`text-[10px] font-medium mt-1 transition-all duration-300 ${
                isActive
                  ? 'transform -translate-y-1'
                  : 'text-gray-500'
              }`} style={{ color: isActive ? '#d4af37' : undefined }}>
                {label}
              </span>

              {/* Active Dot */}
              {isActive && (
                <motion.div
                  layoutId="mobileNavDot"
                  className="absolute -bottom-1 w-1 h-1 rounded-full"
                  style={{ backgroundColor: theme.hex }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
};

export default MobileNav;