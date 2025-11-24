 import { Link, useLocation } from 'react-router-dom';
import { Home, LayoutDashboard, MessageCircle, Video, LogOut, LogIn, User, Sparkles } from 'lucide-react';
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';

const DesktopSidebar = () => {
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
    { to: '/chat/0', icon: MessageCircle, label: 'Chat with Astrologer' },
    { to: '/call/0', icon: Video, label: 'Video Call' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-80 h-screen bg-gradient-to-b from-purple-900 via-indigo-900 to-blue-900 shadow-2xl fixed left-0 top-0 z-50">
      {/* Header with Logo */}
      <div className="p-6 border-b border-indigo-700/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-orange-500 to-pink-500 rounded-xl shadow-lg">
            <Sparkles className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">AstroConnect</h1>
            <p className="text-indigo-200 text-sm">Divine Guidance</p>
          </div>
        </div>
      </div>

      {/* User Profile Section */}
      {user && (
        <div className="p-6 border-b border-indigo-700/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
              <User className="text-white" size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold truncate">{user.name || 'User'}</p>
              <p className="text-indigo-200 text-sm capitalize">{user.role}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Items */}
      <nav className="flex-1 p-6 space-y-2">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group ${
                isActive
                  ? 'bg-white/20 backdrop-blur-lg shadow-lg border border-white/30'
                  : 'text-indigo-100 hover:bg-white/10 hover:scale-105'
              }`}
            >
              <div
                className={`p-2 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg'
                    : 'bg-white/10 text-indigo-200 group-hover:bg-white/20'
                }`}
              >
                <Icon size={20} />
              </div>
              <span className={`font-medium ${isActive ? 'text-white' : 'group-hover:text-white'}`}>
                {label}
              </span>
              {isActive && (
                <div className="ml-auto w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Auth Section */}
      <div className="p-6 border-t border-indigo-700/50">
        {user ? (
          <button
            onClick={() => {
              logout();
              window.location.href = '/';
            }}
            className="flex items-center gap-4 w-full p-4 text-red-200 hover:text-white hover:bg-red-500/20 rounded-2xl transition-all duration-300 group"
          >
            <div className="p-2 bg-red-500/20 rounded-xl group-hover:bg-red-500/30 transition-all duration-300">
              <LogOut size={20} />
            </div>
            <span className="font-medium">Logout</span>
          </button>
        ) : (
          <Link
            to="/login"
            className="flex items-center gap-4 p-4 text-green-200 hover:text-white hover:bg-green-500/20 rounded-2xl transition-all duration-300 group"
          >
            <div className="p-2 bg-green-500/20 rounded-xl group-hover:bg-green-500/30 transition-all duration-300">
              <LogIn size={20} />
            </div>
            <span className="font-medium">Login</span>
          </Link>
        )}
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500"></div>
      <div className="absolute bottom-20 left-6 w-2 h-2 bg-cyan-400 rounded-full opacity-60 animate-bounce"></div>
      <div className="absolute bottom-40 right-6 w-1 h-1 bg-orange-400 rounded-full opacity-40 animate-pulse"></div>
    </aside>
  );
};

export default DesktopSidebar;