 import { Link, useLocation } from "react-router-dom";
import { Home, LayoutDashboard, MessageCircle, Video, LogOut, LogIn, User, UserPlus, Sparkles } from "lucide-react";
import { useContext } from "react";
import AuthContext from "../context/AuthContext";

const DesktopHeader = () => {
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);

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
    <header className="hidden md:flex items-center justify-between bg-gradient-to-r from-purple-900 to-indigo-800 px-8 py-4 shadow-2xl sticky top-0 z-50 backdrop-blur-lg bg-white/5 border-b border-white/10">
      {/* Logo with enhanced design */}
      <Link
        to="/"
        className="flex items-center gap-3 group"
      >
        <div className="relative">
          <div className="p-2 bg-gradient-to-r from-orange-500 to-pink-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
            <Sparkles className="text-white" size={24} />
          </div>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
        </div>
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent">
            AstroConnect
          </h1>
          <p className="text-xs text-indigo-200 opacity-80">Divine Guidance</p>
        </div>
      </Link>

      {/* Navigation with modern design */}
      <nav className="flex items-center gap-1 bg-white/10 backdrop-blur-md rounded-2xl p-1 border border-white/20 shadow-lg">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-300 group relative ${
                isActive
                  ? "bg-white text-purple-700 shadow-lg font-semibold"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >
              <Icon
                size={18}
                className={isActive ? "text-purple-600" : "group-hover:scale-110 transition-transform"}
              />
              <span className="font-medium">{label}</span>

              {/* Active indicator */}
              {isActive && (
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-orange-400 rounded-full animate-pulse"></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Auth Section with enhanced design */}
      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-4">
            {/* User info */}
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-2xl px-4 py-2 border border-white/20">
              <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                <User className="text-white" size={16} />
              </div>
              <div className="text-right">
                <p className="text-white font-medium text-sm">{user.name || "User"}</p>
                <p className="text-indigo-200 text-xs capitalize">{user.role}</p>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={() => {
                logout();
                window.location.href = "/";
              }}
              className="flex items-center gap-2 px-4 py-3 text-red-200 hover:text-white hover:bg-red-500/20 rounded-xl transition-all duration-300 group border border-red-500/30 hover:border-red-500/50"
            >
              <LogOut size={18} className="group-hover:scale-110 transition-transform" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            {/* Login button */}
            <Link
              to="/login"
              className="flex items-center gap-2 px-6 py-3 text-white border border-green-500/50 hover:border-green-400 rounded-xl transition-all duration-300 group hover:bg-green-500/20 backdrop-blur-md"
            >
              <LogIn size={18} className="group-hover:scale-110 transition-transform" />
              <span className="font-medium">Login</span>
            </Link>

            {/* Register button with prominent style */}
            <Link
              to="/register"
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-cyan-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group hover:scale-105 font-semibold"
            >
              <UserPlus size={18} className="group-hover:scale-110 transition-transform" />
              <span>Register</span>
            </Link>
          </div>
        )}
      </div>

      {/* Decorative elements */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500"></div>
    </header>
  );
};

export default DesktopHeader;