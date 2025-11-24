import { Link, useLocation } from 'react-router-dom';
import { Home, LayoutDashboard, MessageCircle, Video } from 'lucide-react';
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
    { to: '/chat/0', icon: MessageCircle, label: 'Chat' },
    { to: '/call/0', icon: Video, label: 'Call' },
  ];

  return (
    <aside className="hidden md:block w-64 h-screen bg-white border-r border-gray-200 shadow-sm fixed left-0 top-0">
      <nav className="flex flex-col h-full p-4 space-y-4">
        {navItems.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            className={`flex items-center gap-2 p-2 rounded-md text-gray-700 hover:bg-gray-100 ${location.pathname === to ? 'bg-orange-100 text-orange-600' : ''}`}
          >
            <Icon size={20} />
            <span>{label}</span>
          </Link>
        ))}
        {/* Auth Links */}
        {user ? (
          <button
            onClick={() => {
              logout();
              window.location.href = '/';
            }}
            className="flex items-center gap-2 p-2 rounded-md text-red-600 hover:bg-red-100"
          >
            Logout
          </button>
        ) : (
          <Link
            to="/login"
            className="flex items-center gap-2 p-2 rounded-md text-green-600 hover:bg-green-100"
          >
            Login
          </Link>
        )}
      </nav>
    </aside>
  );
};

export default DesktopSidebar;

