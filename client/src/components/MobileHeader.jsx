import { Link, useLocation } from "react-router-dom";
import { useContext } from "react";
import AuthContext from "../context/AuthContext";

const MobileHeader = () => {
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);

  return (
    <header className="flex md:hidden items-center justify-between bg-white border-b border-gray-200 px-3 py-2 shadow-sm">
      {/* Logo */}
      <Link to="/" className="text-xl font-bold text-orange-600">
        AstroConnect
      </Link>

      {/* Auth links */}
      {user ? (
        <button
          onClick={() => {
            logout();
            window.location.href = "/";
          }}
          className="text-red-600"
        >
          Logout
        </button>
      ) : (
        <div className="flex gap-2">
          <Link to="/login" className="text-green-600">
            Login
          </Link>
          <Link to="/register" className="text-blue-600">
            Register
          </Link>
        </div>
      )}
    </header>
  );
};

export default MobileHeader;
