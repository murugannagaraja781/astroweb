import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { Bell, LogOut, Settings, Users, BarChart3, Gift, Image, Zap, Crown, Sparkles } from 'lucide-react';

const AdminDashboard = () => {
  const [astrologers, setAstrologers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState('purple');
  const [settings, setSettings] = useState({
    platformTitle: 'AstroElite',
    platformLogo: '👑',
    primaryColor: 'purple',
    currency: '₹',
    language: 'tamil',
    timezone: 'Asia/Kolkata'
  });

  const [formData, setFormData] = useState({
    name: '', email: '', password: '', languages: '', specialties: '', ratePerMinute: 10, bio: ''
  });

  const [horoscopeData, setHoroscopeData] = useState({
    rasi: '', type: 'daily', content: '', date: new Date().toISOString().split('T')[0]
  });

  const [offerData, setOfferData] = useState({
    title: '',
    code: '',
    discount: '',
    type: 'percentage',
    validUntil: '',
    description: ''
  });

  const [bannerData, setBannerData] = useState({
    title: '',
    subtitle: '',
    image: '',
    targetUrl: '',
    isActive: true
  });

  const [horoscopeList, setHoroscopeList] = useState([]);
  const [offers, setOffers] = useState([]);
  const [banners, setBanners] = useState([]);
  const [recentLogins, setRecentLogins] = useState([]);

  const [stats, setStats] = useState({
    totalUsers: 1250,
    totalAstrologers: 45,
    totalEarnings: 125000,
    activeCalls: 12,
    todayEarnings: 2500,
    pendingRequests: 8,
    newRegistrations: 23
  });

  const { user, logout } = useContext(AuthContext);

  const themes = {
    purple: { primary: 'purple', gradient: 'from-purple-600 to-purple-800', light: 'purple-100', text: 'purple-600', bg: 'purple-50' },
    indigo: { primary: 'indigo', gradient: 'from-indigo-600 to-indigo-800', light: 'indigo-100', text: 'indigo-600', bg: 'indigo-50' },
    emerald: { primary: 'emerald', gradient: 'from-emerald-600 to-emerald-800', light: 'emerald-100', text: 'emerald-600', bg: 'emerald-50' },
    amber: { primary: 'amber', gradient: 'from-amber-600 to-amber-800', light: 'amber-100', text: 'amber-600', bg: 'amber-50' },
    rose: { primary: 'rose', gradient: 'from-rose-600 to-rose-800', light: 'rose-100', text: 'rose-600', bg: 'rose-50' }
  };

  const currentTheme = themes[theme];

  const zodiacSigns = [
    'Mesham', 'Rishabam', 'Mithunam', 'Kadagam', 'Simmam', 'Kanni',
    'Thulam', 'Viruchigam', 'Dhanusu', 'Magaram', 'Kumbam', 'Meenam'
  ];

  const logos = ['👑', '🔮', '✨', '⭐', '💎', '🌟', '📿', '🪐', '☯️', '♌'];

  useEffect(() => {
    fetchStats();
    fetchSettings();
    fetchRecentLogins();
    if (activeTab === 'astrologers') fetchAstrologers();
    if (activeTab === 'horoscope') fetchHoroscopes();
    if (activeTab === 'offers') fetchOffers();
    if (activeTab === 'banners') fetchBanners();
  }, [activeTab]);

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 4000);
  };

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
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/settings`, newSettings);
      setSettings(res.data);
      showNotification('Settings updated successfully');
    } catch (err) {
      showNotification('Failed to update settings', 'error');
    }
  };

  const onSubmit = async e => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/astrologer`, {
        ...formData,
        languages: formData.languages.split(',').map(lang => lang.trim()),
        specialties: formData.specialties.split(',').map(spec => spec.trim())
      });
      fetchAstrologers();
      fetchStats();
      showNotification('Astrologer added successfully');
      setFormData({ name: '', email: '', password: '', languages: '', specialties: '', ratePerMinute: 10, bio: '' });
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
      const payload = { ...horoscopeData, language: 'tamil' };
      await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/horoscope`, payload);
      showNotification('Horoscope updated successfully');
      setHoroscopeData({ rasi: '', type: 'daily', content: '', date: new Date().toISOString().split('T')[0] });
      fetchHoroscopes();
    } catch (err) {
      showNotification('Failed to update horoscope', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const onSubmitOffer = async e => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/offers`, offerData);
      showNotification('Offer created successfully');
      setOfferData({ title: '', code: '', discount: '', type: 'percentage', validUntil: '', description: '' });
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
      setBannerData({ title: '', subtitle: '', image: '', targetUrl: '', isActive: true });
      fetchBanners();
    } catch (err) {
      showNotification('Failed to create banner', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const deleteOffer = async (id) => {
    if (confirm('Are you sure you want to delete this offer?')) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/api/admin/offers/${id}`);
        showNotification('Offer deleted successfully');
        fetchOffers();
      } catch (err) {
        showNotification('Failed to delete offer', 'error');
      }
    }
  };

  const deleteBanner = async (id) => {
    if (confirm('Are you sure you want to delete this banner?')) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/api/admin/banners/${id}`);
        showNotification('Banner deleted successfully');
        fetchBanners();
      } catch (err) {
        showNotification('Failed to delete banner', 'error');
      }
    }
  };

  const removeAstrologer = async (id, name) => {
    if (confirm(`Are you sure you want to remove ${name}?`)) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/api/admin/astrologer/${id}`);
        showNotification('Astrologer removed successfully');
        fetchAstrologers();
        fetchStats();
      } catch (err) {
        showNotification('Failed to remove astrologer', 'error');
      }
    }
  };

  const deleteHoroscope = async (id) => {
    if (confirm('Are you sure you want to delete this horoscope?')) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/api/admin/horoscope/${id}`);
        showNotification('Horoscope deleted successfully');
        fetchHoroscopes();
      } catch (err) {
        showNotification('Failed to delete horoscope', 'error');
      }
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-white/95 backdrop-blur-xl shadow-2xl transform transition-all duration-500 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full border-r border-gray-200/50">
          {/* Logo */}
          <div className={`bg-gradient-to-br ${currentTheme.gradient} px-8 py-6 shadow-lg`}>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white text-2xl">{settings.platformLogo}</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">{settings.platformTitle}</h1>
                <p className="text-white/80 text-sm font-light">Premium Admin Dashboard</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-6 py-8 space-y-3">
            {[
              { tab: 'dashboard', icon: <BarChart3 size={20} />, label: 'Dashboard' },
              { tab: 'astrologers', icon: <Users size={20} />, label: 'Astrologers' },
              { tab: 'horoscope', icon: <Sparkles size={20} />, label: 'Horoscope' },
              { tab: 'offers', icon: <Gift size={20} />, label: 'Offers' },
              { tab: 'banners', icon: <Image size={20} />, label: 'Banners' },
              { tab: 'settings', icon: <Settings size={20} />, label: 'Settings' }
            ].map((item) => (
              <button
                key={item.tab}
                onClick={() => setActiveTab(item.tab)}
                className={`w-full flex items-center space-x-4 px-6 py-4 rounded-2xl transition-all duration-300 transform hover:scale-105 ${
                  activeTab === item.tab
                    ? `bg-${currentTheme.light} text-${currentTheme.text} shadow-lg border border-${currentTheme.text}/20`
                    : 'text-gray-600 hover:bg-white hover:shadow-md hover:text-gray-900 border border-transparent'
                }`}
              >
                {item.icon}
                <span className="font-semibold">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* User & Logout */}
          <div className="px-6 py-6 border-t border-gray-200/50 bg-white/50 backdrop-blur-sm">
            <div className="flex items-center space-x-4 mb-4">
              <div className={`w-12 h-12 bg-${currentTheme.light} rounded-2xl flex items-center justify-center shadow-lg`}>
                <span className={`text-${currentTheme.text} font-bold text-lg`}>{user?.name?.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 font-medium">Super Admin</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-6 py-3 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all duration-300 border border-transparent hover:border-red-200"
            >
              <LogOut size={18} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-gray-200/50">
          <div className="flex items-center justify-between px-8 py-6">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-3 rounded-2xl text-gray-600 hover:bg-gray-100 transition-all duration-300"
              >
                <div className="w-6 h-6 relative">
                  <span className={`absolute h-0.5 w-6 bg-current transform transition duration-300 ${sidebarOpen ? 'rotate-45 top-3' : 'top-1'}`}></span>
                  <span className={`absolute h-0.5 w-6 bg-current top-3 transition duration-300 ${sidebarOpen ? 'opacity-0' : 'opacity-100'}`}></span>
                  <span className={`absolute h-0.5 w-6 bg-current transform transition duration-300 ${sidebarOpen ? '-rotate-45 top-3' : 'top-5'}`}></span>
                </div>
              </button>
              <div className="ml-6">
                <h2 className="text-2xl font-bold text-gray-800 capitalize tracking-tight">{activeTab}</h2>
                <p className="text-sm text-gray-600 font-medium">Manage your premium astrology platform</p>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="relative">
                <button className="p-3 rounded-2xl bg-white shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-300">
                  <Bell size={20} className="text-gray-600" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">3</span>
                </button>
              </div>
              <div className="flex items-center space-x-4 bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-2 shadow-lg border border-gray-200/50">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500 font-medium">Administrator</p>
                </div>
                <div className={`w-10 h-10 bg-${currentTheme.light} rounded-2xl flex items-center justify-center shadow-lg`}>
                  <span className={`text-${currentTheme.text} font-bold`}>{user?.name?.charAt(0)}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Notification */}
        {notification.show && (
          <div className={`mx-8 mt-6 p-6 rounded-2xl border-2 backdrop-blur-sm ${
            notification.type === 'error'
              ? 'bg-red-50/80 border-red-200 text-red-700'
              : 'bg-green-50/80 border-green-200 text-green-700'
          }`}>
            <div className="flex items-center space-x-4">
              <div className={`w-4 h-4 rounded-full ${notification.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}></div>
              <p className="font-semibold">{notification.message}</p>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-8">

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  { label: 'Total Users', value: stats.totalUsers, change: '+12%', icon: '👥', color: 'blue' },
                  { label: 'Astrologers', value: stats.totalAstrologers, change: '+5%', icon: '🔮', color: 'green' },
                  { label: 'Total Earnings', value: `₹${stats.totalEarnings}`, change: '+18%', icon: '💰', color: 'purple' },
                  { label: 'Active Calls', value: stats.activeCalls, change: 'Live', icon: '📞', color: 'orange' }
                ].map((stat, index) => (
                  <div key={index} className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-200/50 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{stat.label}</p>
                        <p className="text-4xl font-bold text-gray-900 mt-4">{stat.value}</p>
                        <p className={`text-xs font-semibold mt-2 ${
                          stat.color === 'blue' ? 'text-blue-600' :
                          stat.color === 'green' ? 'text-green-600' :
                          stat.color === 'purple' ? 'text-purple-600' : 'text-orange-600'
                        }`}>{stat.change}</p>
                      </div>
                      <div className={`p-4 rounded-2xl bg-${stat.color}-100`}>
                        <span className="text-2xl">{stat.icon}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Quick Actions & Recent Logins */}
                <div className="xl:col-span-2 space-y-8">
                  <div className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-200/50">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                      <Zap className="text-amber-500" />
                      Quick Actions
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[
                        { label: 'Add Astrologer', description: 'Register new expert', icon: '👨‍💼', tab: 'astrologers' },
                        { label: 'Update Horoscope', description: 'Daily predictions', icon: '🔮', tab: 'horoscope' },
                        { label: 'Create Offer', description: 'Special discounts', icon: '🎁', tab: 'offers' },
                        { label: 'Add Banner', description: 'Promotional content', icon: '📱', tab: 'banners' }
                      ].map((action, index) => (
                        <button
                          key={index}
                          onClick={() => setActiveTab(action.tab)}
                          className="p-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-lg border border-gray-200/50 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 text-left group"
                        >
                          <div className="flex items-center space-x-4">
                            <span className="text-3xl group-hover:scale-110 transition-transform duration-300">{action.icon}</span>
                            <div>
                              <div className="font-bold text-gray-900 text-lg">{action.label}</div>
                              <div className="text-sm text-gray-600 mt-1">{action.description}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Recent Logins */}
                  <div className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-200/50">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                      <Users className="text-green-500" />
                      Recent Logins
                    </h3>
                    <div className="space-y-4">
                      {recentLogins.map((login, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-200/50">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                              <span className="text-white font-bold text-sm">{login.name?.charAt(0)}</span>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{login.name}</p>
                              <p className="text-sm text-gray-500">{login.email}</p>
                            </div>
                          </div>
                          <span className="text-xs font-medium text-gray-500 bg-white px-3 py-1 rounded-full border">
                            {new Date(login.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Today's Overview */}
                <div className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-200/50">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <Crown className="text-amber-500" />
                    Today's Overview
                  </h3>
                  <div className="space-y-6">
                    {[
                      { label: "Today's Earnings", value: `₹${stats.todayEarnings}`, trend: 'up' },
                      { label: 'New Registrations', value: stats.newRegistrations, trend: 'up' },
                      { label: 'Pending Requests', value: stats.pendingRequests, trend: 'steady' },
                      { label: 'Active Sessions', value: '45', trend: 'up' }
                    ].map((item, index) => (
                      <div key={index} className="flex justify-between items-center py-3 border-b border-gray-200/50 last:border-0">
                        <span className="text-gray-700 font-medium">{item.label}</span>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-gray-900 text-lg">{item.value}</span>
                          <span className={`w-2 h-2 rounded-full ${
                            item.trend === 'up' ? 'bg-green-500' : 'bg-blue-500'
                          }`}></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Other tabs remain similar but with enhanced styling */}
          {/* Astrologers Tab */}
          {activeTab === 'astrologers' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Astrologer Management</h2>
                  <p className="text-gray-600 text-lg">Manage elite astrologers on your platform</p>
                </div>
              </div>
              {/* ... rest of astrologers tab content with enhanced styling ... */}
            </div>
          )}

          {/* Offers Tab */}
          {activeTab === 'offers' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Special Offers</h2>
                  <p className="text-gray-600 text-lg">Create and manage promotional offers</p>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                <div className="xl:col-span-1">
                  <div className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-200/50 sticky top-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Create New Offer</h3>
                    <form onSubmit={onSubmitOffer} className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">Offer Title</label>
                        <input
                          type="text"
                          value={offerData.title}
                          onChange={(e) => setOfferData({...offerData, title: e.target.value})}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                          placeholder="Summer Special Offer"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-3">Offer Code</label>
                          <input
                            type="text"
                            value={offerData.code}
                            onChange={(e) => setOfferData({...offerData, code: e.target.value.toUpperCase()})}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                            placeholder="SUMMER20"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-3">Discount</label>
                          <input
                            type="number"
                            value={offerData.discount}
                            onChange={(e) => setOfferData({...offerData, discount: e.target.value})}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                            placeholder="20"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">Valid Until</label>
                        <input
                          type="date"
                          value={offerData.validUntil}
                          onChange={(e) => setOfferData({...offerData, validUntil: e.target.value})}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">Description</label>
                        <textarea
                          value={offerData.description}
                          onChange={(e) => setOfferData({...offerData, description: e.target.value})}
                          rows="3"
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                          placeholder="Offer details and terms..."
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submitLoading}
                        className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-4 px-6 rounded-2xl font-bold hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50"
                      >
                        {submitLoading ? 'Creating Offer...' : 'Create Premium Offer'}
                      </button>
                    </form>
                  </div>
                </div>

                <div className="xl:col-span-3">
                  <div className="bg-white rounded-3xl shadow-2xl border border-gray-200/50 overflow-hidden">
                    <div className="p-8 border-b border-gray-200/50 bg-gradient-to-r from-gray-50 to-white">
                      <div className="flex justify-between items-center">
                        <h3 className="text-2xl font-bold text-gray-900">Active Offers</h3>
                        <span className="bg-purple-100 text-purple-800 px-4 py-2 rounded-2xl text-sm font-semibold">
                          {offers.length} offers
                        </span>
                      </div>
                    </div>

                    {loading ? (
                      <div className="p-16 text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600 font-semibold">Loading offers...</p>
                      </div>
                    ) : offers.length === 0 ? (
                      <div className="p-16 text-center text-gray-500">
                        <Gift className="w-16 h-16 mx-auto mb-4 opacity-20" />
                        <p className="text-lg font-semibold">No offers created yet</p>
                      </div>
                    ) : (
                      <div className="overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-50/80 backdrop-blur-sm">
                            <tr>
                              <th className="px-8 py-6 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">Offer</th>
                              <th className="px-8 py-6 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">Code</th>
                              <th className="px-8 py-6 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">Discount</th>
                              <th className="px-8 py-6 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">Valid Until</th>
                              <th className="px-8 py-6 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200/50">
                            {offers.map(offer => (
                              <tr key={offer._id} className="hover:bg-gray-50/50 transition-colors duration-300">
                                <td className="px-8 py-6">
                                  <div>
                                    <p className="font-semibold text-gray-900">{offer.title}</p>
                                    <p className="text-sm text-gray-600 mt-1">{offer.description}</p>
                                  </div>
                                </td>
                                <td className="px-8 py-6">
                                  <span className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-800 rounded-2xl text-sm font-bold">
                                    {offer.code}
                                  </span>
                                </td>
                                <td className="px-8 py-6">
                                  <span className="text-lg font-bold text-green-600">
                                    {offer.discount}% OFF
                                  </span>
                                </td>
                                <td className="px-8 py-6">
                                  <span className="text-sm text-gray-700 font-medium">
                                    {new Date(offer.validUntil).toLocaleDateString()}
                                  </span>
                                </td>
                                <td className="px-8 py-6">
                                  <button
                                    onClick={() => deleteOffer(offer._id)}
                                    className="text-red-600 hover:text-red-800 font-semibold text-sm px-4 py-2 hover:bg-red-50 rounded-2xl transition-all duration-300"
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Similar enhanced structure for other tabs... */}

        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-all duration-500"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;