import { Link, useLocation } from "react-router-dom";
import { Home, LayoutDashboard, MessageCircle, Video, LogOut, LogIn, User, UserPlus, Wallet, Moon, Star } from "lucide-react";
import { useContext, useState, useEffect } from "react";
import AuthContext from "../../context/AuthContext";
import ThemeContext from "../../context/ThemeContext";
import axios from "axios";

const DesktopHeader = () => {
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  const [walletBalance, setWalletBalance] = useState(null);

  useEffect(() => {
    if (user && user.role === 'client') {
      fetchWalletBalance();
    }
  }, [user]);

  const fetchWalletBalance = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/wallet/balance`);
      setWalletBalance(res.data.balance);
    } catch (err) {
      console.error('Error fetching wallet:', err);
    }
  };

  const getDashboardLink = () => {
    if (!user) return "/";
    if (user.role === "admin") return "/dashboard";
    if (user.role === "astrologer") return "/astrologer-dashboard";
    return "/dashboard";
  };

  const navItems = [
    { to: "/", icon: Home, label: "Home" },
    { to: getDashboardLink(), icon: LayoutDashboard, label: "Dashboard" },
    { to: "/chat/0", icon: MessageCircle, label: "Chat" },
    { to: "/call/0", icon: Video, label: "Call" },
  ];

  return (
    <header className="hidden md:block sticky top-0 z-50 border-b border-white/10" style={{
      background: `linear-gradient(135deg, #0a0015 0%, #1a0033 50%, ${theme.hex}20 100%)`,
      boxShadow: `0 4px 30px ${theme.hex}30, 0 0 20px ${theme.hex}20`
    }}>
      {/* Cosmic Stars Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-1 h-1 bg-yellow-300 rounded-full top-4 left-1/4 animate-pulse"></div>
        <div className="absolute w-1 h-1 bg-purple-300 rounded-full top-6 right-1/3 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute w-0.5 h-0.5 bg-white rounded-full top-8 left-2/3 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="container mx-auto px-6 py-4 relative">
        <div className="flex items-center justify-between">
          {/* Logo - Mystical Astrology Theme */}
          <Link to="/" className="flex items-center gap-3 group relative">
            <div className="relative">
              {/* Glowing orb effect */}
              <div className="absolute inset-0 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity" style={{ background: `linear-gradient(to right, #d4af37, ${theme.hex})` }}></div>

              {/* Main icon container */}
              <div className="relative w-12 h-12 rounded-full flex items-center justify-center" style={{
                background: `linear-gradient(135deg, #d4af37 0%, ${theme.hex} 100%)`,
                boxShadow: `0 0 20px #d4af3780, inset 0 0 20px ${theme.hex}50`
              }}>
                <Moon className="text-white w-6 h-6" />
                <Star className="absolute -top-1 -right-1 text-yellow-300 w-4 h-4 animate-pulse" />
              </div>
            </div>

            <div className="flex flex-col">
              <h1 className="text-2xl font-bold tracking-wide" style={{
                background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c2 50%, #d4af37 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 30px rgba(212, 175, 55, 0.5)'
              }}>
                AstroConnect
              </h1>
              <p className="text-xs text-purple-300 tracking-widest">✨ DIVINE GUIDANCE ✨</p>
            </div>
          </Link>

          {/* Navigation - Mystical Pills */}
          <nav className="flex items-center gap-2">
            {navItems.map(({ to, icon: Icon, label }) => {
              const isActive = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all duration-300 relative group ${
                    isActive
                      ? "text-gray-900 font-semibold"
                      : "text-purple-200 hover:text-white"
                  }`}
                  style={isActive ? {
                    background: `linear-gradient(135deg, #d4af37 0%, ${theme.hex} 100%)`,
                    boxShadow: `0 4px 15px #d4af3760, 0 0 20px ${theme.hex}40`
                  } : {
                    background: `${theme.hex}10`,
                    border: `1px solid ${theme.hex}30`
                  }}
                >
                  <Icon size={16} className={isActive ? "text-gray-900" : "group-hover:scale-110 transition-transform"} />
                  <span className="text-sm font-medium">{label}</span>

                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: theme.hex }}></div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Wallet Balance - Mystical Gold */}
                {user.role === 'client' && walletBalance !== null && (
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all duration-300 hover:scale-105"
                    style={{
                      background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c2 50%, #d4af37 100%)',
                      boxShadow: '0 4px 15px rgba(212, 175, 55, 0.4), 0 0 20px rgba(212, 175, 55, 0.3)',
                      color: '#2d1b4e'
                    }}
                  >
                    <Wallet size={16} />
                    <span>₹{Number(walletBalance).toFixed(2)}</span>
                  </Link>
                )}

                {/* User Info - Cosmic Card */}
                <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{
                  background: 'rgba(138, 43, 226, 0.2)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  backdropFilter: 'blur(10px)'
                }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{
                    background: 'linear-gradient(135deg, #8a2be2, #9370db)'
                  }}>
                    <User className="text-white" size={14} />
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium text-sm">{user.name || "User"}</p>
                    <p className="text-purple-300 text-xs capitalize">{user.role}</p>
                  </div>
                </div>

                {/* Logout - Mystical Red */}
                <button
                  onClick={() => {
                    logout();
                    window.location.href = "/";
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-red-200 hover:text-white transition-all duration-300 group"
                  style={{
                    background: 'rgba(220, 38, 38, 0.1)',
                    border: '1px solid rgba(220, 38, 38, 0.3)'
                  }}
                >
                  <LogOut size={16} className="group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </>
            ) : (
              <>
                {/* Login Button */}
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-5 py-2 rounded-full transition-all duration-300 group"
                  style={{
                    background: 'rgba(138, 43, 226, 0.2)',
                    border: '1px solid rgba(212, 175, 55, 0.4)'
                  }}
                >
                  <LogIn size={16} className="text-purple-300 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-purple-200 group-hover:text-white">Login</span>
                </Link>

                {/* Register Button - Prominent Gold */}
                <Link
                  to="/register"
                  className="flex items-center gap-2 px-5 py-2 rounded-full font-semibold transition-all duration-300 hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c2 100%)',
                    boxShadow: '0 4px 15px rgba(212, 175, 55, 0.4)',
                    color: '#2d1b4e'
                  }}
                >
                  <UserPlus size={16} />
                  <span className="text-sm">Register</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Mystical Border */}
      <div className="h-0.5 w-full" style={{
        background: 'linear-gradient(90deg, transparent 0%, #d4af37 50%, transparent 100%)',
        boxShadow: '0 0 10px rgba(212, 175, 55, 0.5)'
      }}></div>
    </header>
  );
};

export default DesktopHeader;