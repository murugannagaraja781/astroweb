import { Link, useLocation } from "react-router-dom";
import { Home, LayoutDashboard, MessageCircle, Video } from "lucide-react";
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
    <header className="hidden md:flex items-center justify-between bg-white border-b border-gray-200 px-4 py-2 shadow-sm">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-orange-600">
        AstroConnect
      </Link>

      {/* Nav items */}
      <nav className="flex gap-4">
        {navItems.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            className={`flex items-center gap-1 text-sm ${location.pathname === to ? "text-orange-600" : "text-gray-600"}`}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>

      {/* Auth links */}
      {user ? (
        <button
          onClick={() => {
            logout();
            window.location.href = "/";
          }}
          className="flex items-center gap-1 text-red-600 hover:text-red-800"
        >
          Logout
        </button>
      ) : (
        <div className="flex gap-2">
          <Link to="/login" className="text-green-600 hover:text-green-800">
            Login
          </Link>
          <Link to="/register" className="text-blue-600 hover:text-blue-800">
            Register
          </Link>
        </div>
      )}
    </header>
  );
};

export default DesktopHeader;
