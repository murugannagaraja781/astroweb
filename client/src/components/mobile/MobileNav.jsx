import { Link, useLocation } from "react-router-dom";
import {
  Home,
  LayoutDashboard,
  MessageCircle,
  Video,
  User,
  LogOut,
} from "lucide-react";
import { useContext, useState } from "react";
import AuthContext from "../../context/AuthContext";
import ThemeContext from "../../context/ThemeContext";
import { motion } from "framer-motion";

const MobileNav = () => {
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  const [profileOpen, setProfileOpen] = useState(false);

  const getDashboardLink = () => {
    if (!user) return "/";
    if (user.role === "admin") return "/dashboard";
    if (user.role === "astrologer") return "/astrologer-dashboard";
    return "/dashboard";
  };

  const navItems = [
    { to: "/", icon: Home, label: "Home" },
    { to: getDashboardLink(), icon: LayoutDashboard, label: "Dash" },
    { to: "/chat/0", icon: MessageCircle, label: "Chat" },
    { to: "/call/0", icon: Video, label: "Call" },
    { to: "/profile", icon: User, label: "Profile" },
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
        boxShadow: `0 -4px 20px ${theme.hex}20`,
      }}
    >
      {/* Mystical Glow Line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: `linear-gradient(to right, transparent, ${theme.hex}, transparent)`,
        }}
      ></div>

      <div className="flex justify-around items-center px-2 py-3 relative z-10">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;

          if (label === "Profile") {
            return (
              <div
                key={to}
                className="relative flex flex-col items-center justify-center w-16 h-14"
              >
                <button
                  type="button"
                  onClick={() => setProfileOpen((v) => !v)}
                  className={`relative z-10 p-2 rounded-xl transition-all duration-300 ${
                    isActive
                      ? "text-white shadow-lg transform -translate-y-2"
                      : "text-gray-400 hover:text-white"
                  }`}
                  style={
                    isActive
                      ? {
                          background: `linear-gradient(to bottom right, #d4af37, ${theme.hex})`,
                          boxShadow: `0 4px 15px ${theme.hex}40`,
                        }
                      : {}
                  }
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </button>
                <Link
                  to="/profile"
                  className={`text-[10px] font-medium mt-1 transition-all duration-300 ${
                    isActive ? "transform -translate-y-1" : "text-gray-500"
                  }`}
                  style={{ color: isActive ? "#d4af37" : undefined }}
                >
                  Profile
                </Link>
                {profileOpen && user && (
                  <div
                    className="absolute bottom-16 left-1/2 -translate-x-1/2 w-40 rounded-xl border shadow-xl p-3"
                    style={{
                      background: `linear-gradient(to bottom, #0a0015, #1a0033)`,
                      borderColor: `${theme.hex}30`,
                      boxShadow: `0 8px 20px ${theme.hex}30`,
                    }}
                  >
                    <div className="text-xs font-medium text-white truncate mb-2 text-center">
                      {user.name}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        logout();
                        window.location.href = "/";
                      }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-red-200 hover:text-white transition-colors"
                      style={{
                        background: "rgba(220, 38, 38, 0.12)",
                        border: "1px solid rgba(220, 38, 38, 0.35)",
                      }}
                    >
                      <LogOut size={14} />
                      <span className="text-xs">Logout</span>
                    </button>
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={to}
              to={to}
              className="relative flex flex-col items-center justify-center w-16 h-14"
            >
              {isActive && (
                <motion.div
                  layoutId="mobileNavActive"
                  className="absolute inset-0 rounded-xl blur-sm opacity-50"
                  style={{
                    background: `linear-gradient(to top right, ${theme.hex}, #4f46e5)`,
                  }}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 0.5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <div
                className={`relative z-10 p-2 rounded-xl transition-all duration-300 ${
                  isActive
                    ? "text-white shadow-lg transform -translate-y-2"
                    : "text-gray-400 hover:text-white"
                }`}
                style={
                  isActive
                    ? {
                        background: `linear-gradient(to bottom right, #d4af37, ${theme.hex})`,
                        boxShadow: `0 4px 15px ${theme.hex}40`,
                      }
                    : {}
                }
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span
                className={`text-[10px] font-medium mt-1 transition-all duration-300 ${
                  isActive ? "transform -translate-y-1" : "text-gray-500"
                }`}
                style={{ color: isActive ? "#d4af37" : undefined }}
              >
                {label}
              </span>
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
