import { Link, useLocation } from 'react-router-dom';
import { Home, LayoutDashboard, MessageCircle, Video } from 'lucide-react';
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';

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
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-md md:hidden">
      <ul className="flex justify-around items-center py-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <li key={to}>
            <Link
              to={to}
              className={`flex flex-col items-center text-sm ${location.pathname === to ? 'text-orange-600' : 'text-gray-600'}`}
            >
              <Icon size={20} />
              <span>{label}</span>
            </Link>
          </li>
        ))}
        {/* Auth Links */}
        {user ? (
          <li>
            <button
              onClick={() => {
                logout();
                window.location.href = '/';
              }}
              className="flex flex-col items-center text-sm text-red-600"
            >
              Logout
            </button>
          </li>
        ) : (
          <li>
            <Link
              to="/login"
              className="flex flex-col items-center text-sm text-green-600"
            >
              Login
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
};

export default MobileNav;
