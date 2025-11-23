import { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import './MobileNav.css';

const MobileNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);

  const navItems = [
    {
      name: 'Home',
      path: '/',
      icon: '🏠',
      roles: ['client', 'astrologer', 'admin'],
    },
    {
      name: 'Dashboard',
      path: user?.role === 'astrologer' ? '/astrologer-dashboard' :
            user?.role === 'admin' ? '/admin-dashboard' : '/dashboard',
      icon: '📊',
      roles: ['client', 'astrologer', 'admin'],
      requiresAuth: true,
    },
    {
      name: 'Chat',
      path: '/chat',
      icon: '💬',
      roles: ['client', 'astrologer'],
      requiresAuth: true,
    },
    {
      name: 'Profile',
      path: '/profile',
      icon: '👤',
      roles: ['client', 'astrologer', 'admin'],
      requiresAuth: true,
    },
  ];

  const filteredItems = navItems.filter(item => {
    if (item.requiresAuth && !user) return false;
    if (user && !item.roles.includes(user.role)) return false;
    return true;
  });

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="mobile-nav">
      {filteredItems.map((item) => (
        <button
          key={item.path}
          className={`mobile-nav-item ${isActive(item.path) ? 'active' : ''}`}
          onClick={() => navigate(item.path)}
        >
          <span className="mobile-nav-icon">{item.icon}</span>
          <span className="mobile-nav-label">{item.name}</span>
        </button>
      ))}
    </nav>
  );
};

export default MobileNav;
