import { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import './DesktopSidebar.css';

const DesktopSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);

  const menuItems = [
    {
      section: 'Main',
      items: [
        { name: 'Home', path: '/', icon: '🏠', roles: ['client', 'astrologer', 'admin'] },
        { name: 'Dashboard', path: user?.role === 'astrologer' ? '/astrologer-dashboard' : user?.role === 'admin' ? '/admin-dashboard' : '/dashboard', icon: '📊', roles: ['client', 'astrologer', 'admin'], requiresAuth: true },
      ],
    },
    {
      section: 'Communication',
      items: [
        { name: 'Chat', path: '/chat', icon: '💬', roles: ['client', 'astrologer'], requiresAuth: true },
        { name: 'Video Call', path: '/video-call', icon: '📹', roles: ['client', 'astrologer'], requiresAuth: true },
      ],
    },
    {
      section: 'Account',
      items: [
        { name: 'Profile', path: '/profile', icon: '👤', roles: ['client', 'astrologer', 'admin'], requiresAuth: true },
        { name: 'Wallet', path: '/wallet', icon: '💰', roles: ['client'], requiresAuth: true },
      ],
    },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside className="desktop-sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-logo">🔮 AstroWeb</h2>
      </div>

      <div className="sidebar-menu">
        {menuItems.map((section) => (
          <div key={section.section} className="sidebar-section">
            <h3 className="sidebar-section-title">{section.section}</h3>
            {section.items
              .filter(item => {
                if (item.requiresAuth && !user) return false;
                if (user && !item.roles.includes(user.role)) return false;
                return true;
              })
              .map((item) => (
                <button
                  key={item.path}
                  className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
                  onClick={() => navigate(item.path)}
                >
                  <span className="sidebar-icon">{item.icon}</span>
                  <span className="sidebar-label">{item.name}</span>
                </button>
              ))}
          </div>
        ))}
      </div>

      {user && (
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="sidebar-user-info">
              <p className="sidebar-user-name">{user.name}</p>
              <p className="sidebar-user-role">{user.role}</p>
            </div>
          </div>
          <button className="sidebar-logout" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      )}
    </aside>
  );
};

export default DesktopSidebar;
