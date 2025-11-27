import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { Sparkles, LogOut, User, LayoutDashboard } from 'lucide-react';

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    if (user.role === 'admin') return '/dashboard';
    if (user.role === 'astrologer') return '/astrologer-dashboard';
    return '/dashboard';
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-orange-600 hover:text-orange-700 transition-colors">
          <Sparkles className="w-7 h-7" />
          <span>AstroConnect</span>
        </Link>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {/* Language Switcher */}
          <div className="flex gap-2">
            <button
              onClick={() => changeLanguage('en')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                i18n.language === 'en'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => changeLanguage('ta')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                i18n.language === 'ta'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              தமிழ்
            </button>
          </div>

          {/* Auth Buttons */}
          {user ? (
            <div className="relative group">
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </button>

              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all transform origin-top-right z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email || user.mobile}</p>
                </div>

                <Link
                  to={getDashboardLink()}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-orange-600"
                >
                  <LayoutDashboard size={16} />
                  Dashboard
                </Link>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="space-x-4">
              <Link to="/login" style={{background:'red',color:'white'}}>{t('login')}</Link>
              <Link to="/register" >{t('register')}</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
