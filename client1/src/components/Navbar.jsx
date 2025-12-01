import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useContext, useState, useEffect, useRef } from 'react';
import AuthContext from '../context/AuthContext';
import { Sparkles, LogOut, User, LayoutDashboard, MessageCircle, Video, Menu, X } from 'lucide-react';
import { io } from 'socket.io-client';
import axios from 'axios';
import ChatHistoryList from './ChatHistoryList';
import CallHistoryList from './CallHistoryList';

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const socket = io(import.meta.env.VITE_API_URL);

  const [activeDropdown, setActiveDropdown] = useState(null); // 'chat', 'call', 'profile', null
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [chatSessions, setChatSessions] = useState([]);
  const [callHistory, setCallHistory] = useState([]);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchChatSessions = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/chat/sessions`);
      setChatSessions(res.data);
    } catch (err) {
      console.error('Error fetching chat sessions:', err);
    }
  };

  const fetchCallHistory = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/call/history`);
      setCallHistory(res.data);
    } catch (err) {
      console.error('Error fetching call history:', err);
    }
  };

  const toggleDropdown = (name) => {
    if (activeDropdown === name) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(name);
      if (name === 'chat') fetchChatSessions();
      if (name === 'call') fetchCallHistory();
    }
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const handleLogout = () => {
    if (user) {
      socket.emit('user_offline', { userId: user.id });
    }
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

        {/* Right Side - Desktop */}
        <div className="hidden md:flex items-center gap-4">
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
            <div className="flex items-center gap-2" ref={dropdownRef}>
              {/* Chat Icon */}
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('chat')}
                  className={`p-2 rounded-full transition-colors ${activeDropdown === 'chat' ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-100 text-gray-600'}`}
                >
                  <MessageCircle size={22} />
                </button>
                {activeDropdown === 'chat' && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden">
                    <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                      <h3 className="font-semibold text-gray-800">Messages</h3>
                      <Link to="/dashboard" className="text-xs text-purple-600 font-medium hover:underline">View All</Link>
                    </div>
                    <div className="max-h-96 overflow-y-auto p-2">
                      <ChatHistoryList sessions={chatSessions} compact={true} />
                    </div>
                  </div>
                )}
              </div>

              {/* Video Call Icon */}
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('call')}
                  className={`p-2 rounded-full transition-colors ${activeDropdown === 'call' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-600'}`}
                >
                  <Video size={22} />
                </button>
                {activeDropdown === 'call' && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden">
                    <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                      <h3 className="font-semibold text-gray-800">Call History</h3>
                      <Link to="/dashboard" className="text-xs text-blue-600 font-medium hover:underline">View All</Link>
                    </div>
                    <div className="max-h-96 overflow-y-auto p-2">
                      <CallHistoryList calls={callHistory} userRole={user.role} compact={true} />
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('profile')}
                  className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                </button>

                {activeDropdown === 'profile' && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                      <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email || user.mobile}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] rounded-full font-bold uppercase tracking-wider">
                        {user.role}
                      </span>
                    </div>

                    <div className="py-1">
                      <Link
                        to={getDashboardLink()}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-orange-600 transition-colors"
                        onClick={() => setActiveDropdown(null)}
                      >
                        <LayoutDashboard size={16} />
                        Dashboard
                      </Link>
                    </div>

                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={16} />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
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

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <Menu size={24} />
        </button>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-white animate-in slide-in-from-right duration-200">
            <div className="flex flex-col h-full">
              {/* Mobile Header */}
              <div className="px-4 py-4 border-b border-gray-100 flex justify-between items-center">
                <Link to="/" className="flex items-center gap-2 text-xl font-bold text-orange-600" onClick={() => setIsMobileMenuOpen(false)}>
                  <Sparkles className="w-6 h-6" />
                  <span>AstroConnect</span>
                </Link>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Mobile Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* User Info */}
                {user ? (
                  <div className="bg-orange-50 rounded-xl p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xl">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email || user.mobile}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-white text-orange-700 text-xs rounded-full font-bold uppercase border border-orange-100">
                        {user.role}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-6 text-center">
                    <h3 className="font-semibold text-gray-800 mb-2">Welcome to AstroConnect</h3>
                    <p className="text-sm text-gray-500 mb-4">Sign in to consult with astrologers</p>
                    <div className="grid grid-cols-2 gap-3">
                      <Link
                        to="/login"
                        className="bg-white border border-gray-200 text-gray-700 py-2 rounded-lg font-medium text-center"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {t('login')}
                      </Link>
                      <Link
                        to="/register"
                        className="bg-orange-600 text-white py-2 rounded-lg font-medium text-center"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {t('register')}
                      </Link>
                    </div>
                  </div>
                )}

                {/* Navigation Links */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Menu</h4>

                  {user && (
                    <>
                      <Link
                        to={getDashboardLink()}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-gray-700"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <LayoutDashboard size={20} className="text-gray-400" />
                        <span className="font-medium">Dashboard</span>
                      </Link>

                      <Link
                        to="/dashboard"
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-gray-700"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <MessageCircle size={20} className="text-gray-400" />
                        <span className="font-medium">Messages</span>
                      </Link>

                      <Link
                        to="/dashboard"
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-gray-700"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Video size={20} className="text-gray-400" />
                        <span className="font-medium">Call History</span>
                      </Link>
                    </>
                  )}
                </div>

                {/* Language Settings */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Language</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => changeLanguage('en')}
                      className={`p-3 rounded-xl border flex items-center justify-center gap-2 ${
                        i18n.language === 'en' ? 'border-orange-600 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-600'
                      }`}
                    >
                      <span className="font-medium">English</span>
                    </button>
                    <button
                      onClick={() => changeLanguage('ta')}
                      className={`p-3 rounded-xl border flex items-center justify-center gap-2 ${
                        i18n.language === 'ta' ? 'border-orange-600 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-600'
                      }`}
                    >
                      <span className="font-medium">தமிழ்</span>
                    </button>
                  </div>
                </div>

                {/* Logout */}
                {user && (
                  <div className="pt-4 border-t border-gray-100">
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 p-3 text-red-600 bg-red-50 rounded-xl font-medium"
                    >
                      <LogOut size={20} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
