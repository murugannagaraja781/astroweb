import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import {
  Bell, LogOut, Settings, Users, BarChart3, Gift, Image, Zap,
  Crown, Sparkles, Edit, Trash2, Eye, Star, Calendar, Clock,
  DollarSign, UserPlus, Search, Filter, ChevronRight, Menu, X, MessageCircle
} from 'lucide-react';

import ThemeContext from '../context/ThemeContext';

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const { theme, activeThemeName, updateTheme, ZODIAC_THEMES } = useContext(ThemeContext);
  const [astrologers, setAstrologers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ZODIAC_THEMES removed (imported from context)
  // activeTheme state removed (using context)

  // Settings State
  const [settings, setSettings] = useState({
    platformTitle: 'AstroElite',
    platformLogo: '👑',
    primaryColor: 'purple',
    currency: '₹',
    language: 'tamil',
    timezone: 'Asia/Kolkata'
  });

  // Forms State
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', languages: '', specialties: '',
    ratePerMinute: 10, bio: '', experience: '', phone: ''
  });

  const [horoscopeData, setHoroscopeData] = useState({
    rasi: '', type: 'daily', content: '', date: new Date().toISOString().split('T')[0]
  });

  const [offerData, setOfferData] = useState({
    title: '', code: '', discount: '', type: 'percentage',
    validUntil: '', description: '', minAmount: '', maxDiscount: ''
  });

  const [bannerData, setBannerData] = useState({
    title: '', subtitle: '', image: '', targetUrl: '',
    isActive: true, position: 'home_top'
  });

  // Data Lists
  const [users, setUsers] = useState([]);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [walletAmount, setWalletAmount] = useState('');

  // Stats and Activity
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAstrologers: 0,
    totalEarnings: 0,
    activeCalls: 0
  });
  const [recentLogins, setRecentLogins] = useState([]);

  // Tab Data
  const [offers, setOffers] = useState([]);
  const [banners, setBanners] = useState([]);
  const [horoscopes, setHoroscopes] = useState([]);
  const [pendingSessions, setPendingSessions] = useState([]);
  const [horoscopeList, setHoroscopeList] = useState([]);

  const zodiacSigns = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];

  useEffect(() => {
    fetchStats();
    fetchSettings();
    fetchRecentLogins();
    if (activeTab === 'astrologers') fetchAstrologers();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'horoscope') fetchHoroscopes();
    if (activeTab === 'offers') fetchOffers();
    if (activeTab === 'banners') fetchBanners();
    if (activeTab === 'inbox') fetchPending();
  }, [activeTab]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/users`);
      setUsers(res.data);
    } catch (err) {
      showNotification('Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMoney = async (e) => {
    e.preventDefault();
    if (!walletAmount || walletAmount <= 0) return;

    setSubmitLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/wallet/add`, {
        userId: selectedUser._id,
        amount: walletAmount
      });
      showNotification(`Added ${settings.currency}${walletAmount} to ${selectedUser.name}'s wallet`);
      setShowWalletModal(false);
      fetchUsers(); // Refresh list
    } catch (err) {
      showNotification('Failed to add money', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;

    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/admin/users/role`, {
        userId,
        role: newRole
      });
      showNotification('User role updated successfully');
      fetchUsers(); // Refresh list
    } catch (err) {
      showNotification(err.response?.data?.msg || 'Failed to update role', 'error');
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 4000);
  };

  // API Functions
  const fetchStats = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/stats`);
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchRecentLogins = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/recent-logins`);
      setRecentLogins(res.data);
    } catch (err) {
      console.error('Failed to fetch recent logins:', err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/settings`);
      setSettings(res.data);
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  };

  const fetchAstrologers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/astrologers`);
      setAstrologers(res.data);
    } catch (err) {
      showNotification('Failed to fetch astrologers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchHoroscopes = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/horoscopes`);
      setHoroscopeList(res.data);
    } catch (err) {
      showNotification('Failed to fetch horoscopes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/offers`);
      setOffers(res.data);
    } catch (err) {
      showNotification('Failed to fetch offers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/banners`);
      setBanners(res.data);
    } catch (err) {
      showNotification('Failed to fetch banners', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      try {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/logout`);
        logout();
      } catch (err) {
        console.error('Logout error:', err);
        logout();
      }
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/admin/settings`, newSettings);
      setSettings(res.data);
      showNotification('Settings updated successfully');
    } catch (err) {
      showNotification('Failed to update settings', 'error');
    }
  };

  // CRUD Operations
  const onSubmitAstrologer = async e => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const payload = {
        ...formData,
        languages: formData.languages.split(',').map(lang => lang.trim()),
        specialties: formData.specialties.split(',').map(spec => spec.trim()),
        role: 'astrologer'
      };
      await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/astrologers`, payload);
      fetchAstrologers();
      fetchStats();
      showNotification('Astrologer added successfully');
      setFormData({
        name: '', email: '', password: '', languages: '', specialties: '',
        ratePerMinute: 10, bio: '', experience: '', phone: ''
      });
    } catch (err) {
      showNotification('Failed to add astrologer', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const onSubmitHoroscope = async e => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const payload = { ...horoscopeData, language: settings.language };
      await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/horoscopes`, payload);
      showNotification('Horoscope added successfully');
      setHoroscopeData({ rasi: '', type: 'daily', content: '', date: new Date().toISOString().split('T')[0] });
      fetchHoroscopes();
    } catch (err) {
      showNotification('Failed to add horoscope', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const onSubmitOffer = async e => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const payload = {
        ...offerData,
        discount: parseInt(offerData.discount),
        minAmount: offerData.minAmount ? parseInt(offerData.minAmount) : 0,
        maxDiscount: offerData.maxDiscount ? parseInt(offerData.maxDiscount) : null
      };
      await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/offers`, payload);
      showNotification('Offer created successfully');
      setOfferData({
        title: '', code: '', discount: '', type: 'percentage',
        validUntil: '', description: '', minAmount: '', maxDiscount: ''
      });
      fetchOffers();
    } catch (err) {
      showNotification('Failed to create offer', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const onSubmitBanner = async e => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/banners`, bannerData);
      showNotification('Banner created successfully');
      setBannerData({ title: '', subtitle: '', image: '', targetUrl: '', isActive: true, position: 'home_top' });
      fetchBanners();
    } catch (err) {
      showNotification('Failed to create banner', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const deleteItem = async (type, id) => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/admin/${type}s/${id}`);
      showNotification(`${type} deleted successfully`);
      if (type === 'offer') fetchOffers();
      if (type === 'banner') fetchBanners();
      if (type === 'horoscope') fetchHoroscopes();
      if (type === 'astrologer') { fetchAstrologers(); fetchStats(); }
    } catch (err) {
      showNotification(`Failed to delete ${type}`, 'error');
    }
  };

  const toggleAstrologerStatus = async (id, currentStatus) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/astrologer/status`, {
        astrologerId: id, status: !currentStatus
      });
      showNotification('Astrologer status updated');
      fetchAstrologers();
    } catch (err) {
      showNotification('Failed to update status', 'error');
    }
  };

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/chatcallrequest`);
      setPendingSessions(res.data);
    } catch (err) {
      showNotification('Failed to fetch inbox', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptSession = async (sessionId, clientId, ratePerMinute) => {
    try {
      setSubmitLoading(true);
      // Accept the chat session and deduct wallet balance
      await axios.post(`${import.meta.env.VITE_API_URL}/api/chat/accept`, {
        sessionId,
        clientId,
        ratePerMinute
      });

      showNotification('Chat session accepted! Wallet deducted.');
      fetchPending(); // Refresh the list
    } catch (err) {
      showNotification(err.response?.data?.msg || 'Failed to accept session', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  // --- UI Components ---

  const SidebarItem = ({ id, icon: Icon, label }) => (
    <button
      onClick={() => { setActiveTab(id); setSidebarOpen(false); }}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 mb-1 relative overflow-hidden group ${
        activeTab === id
          ? 'text-white shadow-lg'
          : 'text-gray-400 hover:text-white hover:bg-white/5'
      }`}
    >
      {activeTab === id && (
        <div className="absolute inset-0 opacity-20" style={{ backgroundColor: theme.hex }}></div>
      )}
      <Icon size={20} className={`relative z-10 ${activeTab === id ? 'animate-pulse' : ''}`} style={{ color: activeTab === id ? theme.hex : 'inherit' }} />
      <span className="font-medium relative z-10">{label}</span>
      {activeTab === id && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-l-full" style={{ backgroundColor: theme.hex }}></div>
      )}
    </button>
  );

  const StatCard = ({ label, value, icon: Icon, trend }) => (
    <div className="bg-gray-800/50 backdrop-blur-md p-6 rounded-2xl border border-white/5 shadow-xl hover:border-white/10 transition-all duration-300 group relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>

      <div className="flex justify-between items-start relative z-10">
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{label}</p>
          <h3 className="text-3xl font-bold text-white mb-1">{value}</h3>
          {trend && (
            <div className={`flex items-center mt-2 text-xs font-medium ${
              trend.startsWith('+') ? 'text-emerald-400' : 'text-gray-400'
            }`}>
              <span className={`px-1.5 py-0.5 rounded bg-white/5 border border-white/5`}>{trend}</span>
              <span className="ml-2 text-gray-500">vs last month</span>
            </div>
          )}
        </div>
        <div className={`p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`} style={{ backgroundColor: `${theme.hex}20`, color: theme.hex }}>
          <Icon size={28} />
        </div>
      </div>

      {/* Bottom Glow */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ backgroundImage: `linear-gradient(to right, transparent, ${theme.hex}, transparent)` }}></div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#0a0015] text-gray-100 overflow-hidden relative">
      {/* Cosmic Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
        <div className="absolute w-96 h-96 bg-purple-900/20 rounded-full blur-3xl -top-20 -left-20 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-indigo-900/20 rounded-full blur-3xl bottom-0 right-0 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900/80 backdrop-blur-xl border-r border-white/10 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full relative z-10">
          {/* Logo */}
          <div className="h-20 flex items-center px-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-${theme.color}-500/20`} style={{ background: `linear-gradient(135deg, ${theme.hex}, #1e1b4b)` }}>
                <span className="text-xl">{theme.icon}</span>
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">AstroElite</span>
                <p className="text-[10px] text-gray-400 tracking-widest uppercase">Admin Panel</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto custom-scrollbar">
            <p className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Main</p>
            <SidebarItem id="dashboard" icon={BarChart3} label="Dashboard" />
            <SidebarItem id="users" icon={Users} label="Users" />
            <SidebarItem id="astrologers" icon={Crown} label="Astrologers" />
            <SidebarItem id="horoscope" icon={Sparkles} label="Horoscope" />
            <SidebarItem id="inbox" icon={MessageCircle} label="Inbox" />

            <p className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mt-8 mb-4">Marketing</p>
            <SidebarItem id="offers" icon={Gift} label="Offers" />
            <SidebarItem id="banners" icon={Image} label="Banners" />

            <p className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mt-8 mb-4">System</p>
            <SidebarItem id="settings" icon={Settings} label="Settings" />
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-white/10 bg-black/20">
            <div className="flex items-center gap-3 px-2 mb-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-lg`} style={{ backgroundColor: theme.hex }}>
                {user?.name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-white">{user?.name}</p>
                <p className="text-xs text-gray-400 truncate">Super Admin</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-red-500/20 hover:border-red-500/50"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        {/* Header */}
        <header className="bg-gray-900/50 backdrop-blur-md border-b border-white/5 h-20 flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 text-gray-400 hover:bg-white/5 rounded-lg"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-2xl font-bold text-white capitalize tracking-wide">
              {activeTab.replace('-', ' ')}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Selector */}
            <div className="hidden md:flex items-center gap-2 bg-black/30 p-1.5 rounded-full border border-white/10">
              {Object.keys(ZODIAC_THEMES).map((sign) => (
                <button
                  key={sign}
                  onClick={() => updateTheme(sign)}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] transition-all duration-300 ${
                    activeThemeName === sign ? 'scale-125 shadow-lg ring-2 ring-white/50' : 'opacity-50 hover:opacity-100 hover:scale-110'
                  }`}
                  style={{ backgroundColor: ZODIAC_THEMES[sign].hex }}
                  title={sign}
                >
                  {ZODIAC_THEMES[sign].icon}
                </button>
              ))}
            </div>

            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 bg-black/30 border border-white/10 rounded-full text-sm focus:ring-2 focus:ring-white/20 text-white w-64 placeholder-gray-600"
              />
            </div>
            <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full relative transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {notification.show && (
            <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              notification.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              <div className={`w-2 h-2 rounded-full ${notification.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
              <p className="text-sm font-medium">{notification.message}</p>
            </div>
          )}

          {/* Dashboard View */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Total Users" value={stats.totalUsers} icon={Users} trend="+12%" />
                <StatCard label="Astrologers" value={stats.totalAstrologers} icon={Crown} trend="+5%" />
                <StatCard label="Earnings" value={`${settings.currency}${stats.totalEarnings}`} icon={DollarSign} trend="+18%" />
                <StatCard label="Active Calls" value={stats.activeCalls} icon={Zap} trend="Live" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-gray-800/50 backdrop-blur-md rounded-2xl border border-white/5 shadow-xl">
                  <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center">
                    <h3 className="font-bold text-white">Recent Logins</h3>
                    <button className="text-sm font-medium hover:text-white transition-colors" style={{ color: theme.hex }}>View All</button>
                  </div>
                  <div className="divide-y divide-white/5">
                    {recentLogins.slice(0, 5).map((login, i) => (
                      <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-black/30 flex items-center justify-center font-bold text-xs text-gray-300 border border-white/5">
                            {login.name?.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{login.name}</p>
                            <p className="text-xs text-gray-500">{login.email}</p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 font-mono">
                          {new Date(login.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-6">
                  <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl border border-white/5 shadow-xl p-6">
                    <h3 className="font-bold text-white mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                      <button onClick={() => setActiveTab('astrologers')} className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/5 hover:bg-white/5 transition-all group">
                        <div className="p-2 rounded-lg transition-colors" style={{ backgroundColor: `${theme.hex}20`, color: theme.hex }}>
                          <UserPlus size={18} />
                        </div>
                        <span className="text-sm font-medium text-gray-300 group-hover:text-white">Add Astrologer</span>
                      </button>
                      <button onClick={() => setActiveTab('horoscope')} className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/5 hover:bg-white/5 transition-all group">
                        <div className="p-2 rounded-lg transition-colors" style={{ backgroundColor: `${theme.hex}20`, color: theme.hex }}>
                          <Sparkles size={18} />
                        </div>
                        <span className="text-sm font-medium text-gray-300 group-hover:text-white">Update Horoscope</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'inbox' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white">Inbox</h2>
                  <p className="text-gray-400">Pending and active chat requests</p>
                </div>
                <button onClick={fetchPending} className="px-4 py-2 bg-white/5 border border-white/10 text-gray-300 rounded-lg text-sm font-medium hover:bg-white/10">Refresh</button>
              </div>
              <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl border border-white/5 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-black/20 text-gray-400 font-medium border-b border-white/5">
                      <tr>
                        <th className="px-6 py-4 whitespace-nowrap">Session</th>
                        <th className="px-6 py-4 whitespace-nowrap">Client</th>
                        <th className="px-6 py-4 whitespace-nowrap">Astrologer</th>
                        <th className="px-6 py-4 whitespace-nowrap">Status</th>
                        <th className="px-6 py-4 whitespace-nowrap">Rate</th>
                        <th className="px-6 py-4 whitespace-nowrap">Created</th>
                        <th className="px-6 py-4 whitespace-nowrap text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {pendingSessions.map((s) => (
                        <tr key={s.sessionId} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 text-gray-300 font-mono text-xs">{s.sessionId}</td>
                          <td className="px-6 py-4 text-white">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-300">
                                {(s.clientId?.name || s.client?.name || 'U')?.charAt(0)}
                              </div>
                              <span>{s.clientId?.name || s.client?.name || s.client?.id || 'Unknown'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-white">{s.astrologerId?.name || s.astrologer?.name || s.astrologer?.id || 'N/A'}</td>
                          <td className="px-6 py-4">
                            {s.status === 'requested' ? (
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-300 border border-yellow-500/30 flex items-center gap-1 w-fit">
                                <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse"></span>
                                Waiting for Accept
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">{s.status}</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-white font-semibold">₹{s.ratePerMinute}/min</td>
                          <td className="px-6 py-4 text-gray-400 text-xs">{new Date(s.createdAt).toLocaleString()}</td>
                          <td className="px-6 py-4 text-right">
                            {s.status === 'requested' && (
                              <button
                                onClick={() => handleAcceptSession(s.sessionId, s.clientId?._id || s.clientId, s.ratePerMinute)}
                                disabled={submitLoading}
                                className="px-4 py-2 rounded-lg text-xs font-semibold transition-all shadow-sm disabled:opacity-50 bg-emerald-600 hover:bg-emerald-700 text-white"
                              >
                                Accept & Deduct
                              </button>
                            )}
                            {s.status === 'active' && (
                              <span className="text-xs text-emerald-400 font-medium">Active</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {pendingSessions.length === 0 && (
                        <tr>
                          <td colSpan="7" className="px-6 py-12 text-center text-gray-500">No pending chat sessions</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white">User Management</h2>
                  <p className="text-gray-400">Manage client accounts and wallets</p>
                </div>
                <div className="bg-gray-800/50 px-4 py-2 rounded-lg border border-white/10 shadow-sm">
                  <span className="text-sm font-medium text-gray-400">Total Users: </span>
                  <span className="text-lg font-bold" style={{ color: theme.hex }}>{users.length}</span>
                </div>
              </div>

              <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl border border-white/5 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-black/20 text-gray-400 font-medium border-b border-white/5">
                      <tr>
                        <th className="px-6 py-4 whitespace-nowrap">User</th>
                        <th className="px-6 py-4 whitespace-nowrap">Email</th>
                        <th className="px-6 py-4 whitespace-nowrap">Wallet Balance</th>
                        <th className="px-6 py-4 whitespace-nowrap">Role</th>
                        <th className="px-6 py-4 whitespace-nowrap">Joined Date</th>
                        <th className="px-6 py-4 whitespace-nowrap text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {users.map((user) => (
                        <tr key={user._id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-black/30 flex items-center justify-center font-bold text-gray-300 border border-white/5">
                                {user.name?.charAt(0)}
                              </div>
                              <span className="font-medium text-white">{user.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-400">{user.email}</td>
                          <td className="px-6 py-4 font-bold text-emerald-400">{settings.currency}{user.walletBalance}</td>
                          <td className="px-6 py-4">
                            <select
                              value={user.role}
                              onChange={(e) => handleRoleChange(user._id, e.target.value)}
                              className="bg-white/20 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-white/30"
                            >
                              <option value="client">Client</option>
                              <option value="astrologer">Astrologer</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>

                          <td className="px-6 py-4 text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setWalletAmount('');
                                setShowWalletModal(true);
                              }}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors bg-white/5 hover:bg-white/10 text-white"
                              style={{ border: `1px solid ${theme.hex}40` }}
                            >
                              Add Money
                            </button>
                          </td>
                        </tr>
                      ))}
                      {users.length === 0 && (
                        <tr>
                          <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                            No users found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Astrologers View */}
          {activeTab === 'astrologers' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Astrologer Management</h2>
                  <p className="text-sm text-gray-400">Manage your platform's experts</p>
                </div>
                <div className="flex gap-3">
                  <button className="px-4 py-2 bg-white/5 border border-white/10 text-gray-300 rounded-lg text-sm font-medium hover:bg-white/10">
                    Export List
                  </button>
                  <button
                    onClick={() => document.getElementById('add-astro-form').scrollIntoView({ behavior: 'smooth' })}
                    className="px-4 py-2 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: theme.hex }}
                  >
                    <UserPlus size={16} />
                    Add New
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl border border-white/5 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-black/20 text-gray-400 font-medium border-b border-white/5">
                      <tr>
                        <th className="px-6 py-4 whitespace-nowrap">Astrologer</th>
                        <th className="px-6 py-4 whitespace-nowrap">Contact</th>
                        <th className="px-6 py-4 whitespace-nowrap">Rate</th>
                        <th className="px-6 py-4 whitespace-nowrap">Status</th>
                        <th className="px-6 py-4 whitespace-nowrap text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {astrologers.map((astro) => (
                        <tr key={astro._id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-black/30 flex items-center justify-center font-bold text-gray-300 border border-white/5">
                                {astro.name?.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium text-white">{astro.name}</p>
                                <p className="text-xs text-gray-500">{astro.specialties?.slice(0, 2).join(', ')}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-400">{astro.email}</td>
                          <td className="px-6 py-4 font-medium text-white">{settings.currency}{astro.profile?.ratePerMinute}/min</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              astro.isOnline ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                            }`}>
                              {astro.isOnline ? 'Online' : 'Offline'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => toggleAstrologerStatus(astro._id, astro.isOnline)}
                                className={`p-1.5 rounded-md transition-colors ${
                                  astro.isOnline ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-gray-400 hover:bg-white/10'
                                }`}
                                title="Toggle Status"
                              >
                                <Zap size={16} />
                              </button>
                              <button
                                onClick={() => deleteItem('astrologer', astro._id)}
                                className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md transition-colors"
                                title="Remove"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {astrologers.length === 0 && (
                        <tr>
                          <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                            No astrologers found. Add one to get started.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Add Form */}
              <div id="add-astro-form" className="bg-gray-800/50 backdrop-blur-md rounded-2xl border border-white/5 shadow-xl p-6 lg:p-8">
                <h3 className="text-lg font-bold text-white mb-6">Register New Astrologer</h3>
                <form onSubmit={onSubmitAstrologer} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-400">Full Name</label>
                    <input type="text" required className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:border-transparent outline-none transition-all text-white"
                      style={{ '--tw-ring-color': theme.hex }}
                      value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-400">Email Address</label>
                    <input type="email" required className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:border-transparent outline-none transition-all text-white"
                      style={{ '--tw-ring-color': theme.hex }}
                      value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-400">Password</label>
                    <input type="password" required className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:border-transparent outline-none transition-all text-white"
                      style={{ '--tw-ring-color': theme.hex }}
                      value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-400">Phone Number</label>
                    <input type="tel" className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:border-transparent outline-none transition-all text-white"
                      style={{ '--tw-ring-color': theme.hex }}
                      value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-400">Rate per Minute ({settings.currency})</label>
                    <input type="number" required min="1" className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:border-transparent outline-none transition-all text-white"
                      style={{ '--tw-ring-color': theme.hex }}
                      value={formData.ratePerMinute} onChange={e => setFormData({...formData, ratePerMinute: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-400">Experience (Years)</label>
                    <input type="number" className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:border-transparent outline-none transition-all text-white"
                      style={{ '--tw-ring-color': theme.hex }}
                      value={formData.experience} onChange={e => setFormData({...formData, experience: e.target.value})} />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-sm font-medium text-gray-400">Languages (comma separated)</label>
                    <input type="text" placeholder="English, Tamil, Hindi" className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:border-transparent outline-none transition-all text-white placeholder-gray-600"
                      style={{ '--tw-ring-color': theme.hex }}
                      value={formData.languages} onChange={e => setFormData({...formData, languages: e.target.value})} />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-sm font-medium text-gray-400">Specialties (comma separated)</label>
                    <input type="text" placeholder="Vedic, Numerology, Tarot" className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:border-transparent outline-none transition-all text-white placeholder-gray-600"
                      style={{ '--tw-ring-color': theme.hex }}
                      value={formData.specialties} onChange={e => setFormData({...formData, specialties: e.target.value})} />
                  </div>
                  <div className="md:col-span-2 pt-4">
                    <button type="submit" disabled={submitLoading} className="w-full text-white py-3 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg disabled:opacity-50"
                      style={{ backgroundColor: theme.hex }}>
                      {submitLoading ? 'Creating Account...' : 'Create Astrologer Account'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Horoscope View */}
          {activeTab === 'horoscope' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-6">Publish Daily Horoscope</h2>
                <form onSubmit={onSubmitHoroscope} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-700">Zodiac Sign</label>
                      <select required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={horoscopeData.rasi} onChange={e => setHoroscopeData({...horoscopeData, rasi: e.target.value})}>
                        <option value="">Select Sign</option>
                        {zodiacSigns.map(sign => <option key={sign} value={sign}>{sign}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-700">Date</label>
                      <input type="date" required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={horoscopeData.date} onChange={e => setHoroscopeData({...horoscopeData, date: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Prediction Content</label>
                    <textarea required rows="6" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="Enter daily prediction here..."
                      value={horoscopeData.content} onChange={e => setHoroscopeData({...horoscopeData, content: e.target.value})} />
                  </div>
                  <button type="submit" disabled={submitLoading} className="w-full bg-purple-600 text-white py-2.5 rounded-lg font-medium hover:bg-purple-700 transition-colors">
                    {submitLoading ? 'Publishing...' : 'Publish Horoscope'}
                  </button>
                </form>
              </div>

              {/* Recent Horoscopes List */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200">
                  <h3 className="font-semibold text-slate-800">Recent Publications</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {horoscopeList.map(item => (
                    <div key={item._id} className="px-6 py-4 flex justify-between items-center hover:bg-slate-50">
                      <div>
                        <p className="font-medium text-slate-900">{item.rasi}</p>
                        <p className="text-xs text-slate-500">{new Date(item.date).toLocaleDateString()}</p>
                      </div>
                      <button onClick={() => deleteItem('horoscope', item._id)} className="text-red-400 hover:text-red-600 p-2">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {horoscopeList.length === 0 && <p className="px-6 py-8 text-center text-slate-500 text-sm">No horoscopes found.</p>}
                </div>
              </div>
            </div>
          )}

          {/* Offers View */}
          {activeTab === 'offers' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-6">Create New Offer</h2>
                <form onSubmit={onSubmitOffer} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Offer Title</label>
                    <input type="text" required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={offerData.title} onChange={e => setOfferData({...offerData, title: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Coupon Code</label>
                    <input type="text" required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none uppercase"
                      value={offerData.code} onChange={e => setOfferData({...offerData, code: e.target.value.toUpperCase()})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Discount (%)</label>
                    <input type="number" required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={offerData.discount} onChange={e => setOfferData({...offerData, discount: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Valid Until</label>
                    <input type="date" required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={offerData.validUntil} onChange={e => setOfferData({...offerData, validUntil: e.target.value})} />
                  </div>
                  <div className="md:col-span-2">
                    <button type="submit" disabled={submitLoading} className="w-full bg-emerald-600 text-white py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition-colors">
                      Create Offer
                    </button>
                  </div>
                </form>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {offers.map(offer => (
                  <div key={offer._id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 relative group">
                    <button onClick={() => deleteItem('offer', offer._id)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <Gift size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{offer.code}</h3>
                        <p className="text-xs text-slate-500">{offer.discount}% OFF</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 mb-3">{offer.title}</p>
                    <div className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock size={12} />
                      Valid until {new Date(offer.validUntil).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Banners View */}
          {activeTab === 'banners' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-6">Manage Banners</h2>
                <form onSubmit={onSubmitBanner} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-700">Banner Title</label>
                      <input type="text" required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={bannerData.title} onChange={e => setBannerData({...bannerData, title: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-700">Subtitle</label>
                      <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={bannerData.subtitle} onChange={e => setBannerData({...bannerData, subtitle: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Image URL</label>
                    <input type="url" required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="https://example.com/banner.jpg"
                      value={bannerData.image} onChange={e => setBannerData({...bannerData, image: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Target URL (Optional)</label>
                    <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="/astrologer/123"
                      value={bannerData.targetUrl} onChange={e => setBannerData({...bannerData, targetUrl: e.target.value})} />
                  </div>
                  <button type="submit" disabled={submitLoading} className="w-full bg-pink-600 text-white py-2.5 rounded-lg font-medium hover:bg-pink-700 transition-colors">
                    Create Banner
                  </button>
                </form>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {banners.map(banner => (
                  <div key={banner._id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group relative">
                    <img src={banner.image} alt={banner.title} className="w-full h-40 object-cover" />
                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => deleteItem('banner', banner._id)} className="p-2 bg-white/90 text-red-600 rounded-full hover:bg-red-50 shadow-sm">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-slate-900">{banner.title}</h3>
                      <p className="text-sm text-slate-500">{banner.subtitle}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className={`text-xs px-2 py-1 rounded-full ${banner.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                          {banner.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className="text-xs text-slate-400">{banner.position}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Settings View */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-6">Platform Settings</h2>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Platform Name</label>
                    <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={settings.platformTitle} onChange={e => setSettings({...settings, platformTitle: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Currency Symbol</label>
                    <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={settings.currency} onChange={e => setSettings({...settings, currency: e.target.value})} />
                  </div>
                  <button onClick={() => updateSettings(settings)} className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
      {/* Wallet Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-900">Add Money to Wallet</h3>
              <button onClick={() => setShowWalletModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddMoney} className="p-6 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg text-indigo-700 mb-2">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center font-bold">
                  {selectedUser?.name?.charAt(0)}
                </div>
                <div>
                  <p className="font-medium">{selectedUser?.name}</p>
                  <p className="text-xs opacity-80">{selectedUser?.email}</p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Amount ({settings.currency})</label>
                <input
                  type="number"
                  required
                  min="1"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-lg font-semibold"
                  placeholder="Enter amount"
                  value={walletAmount}
                  onChange={(e) => setWalletAmount(e.target.value)}
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowWalletModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50"
                >
                  {submitLoading ? 'Adding...' : 'Add Money'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
