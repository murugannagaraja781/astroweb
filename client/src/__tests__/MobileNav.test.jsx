import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import MobileNav from '../components/mobile/MobileNav';

describe('MobileNav Component', () => {
  const mockLogout = jest.fn();

  const renderWithAuth = (user = null) => {
    return render(
      <AuthContext.Provider value={{ user, logout: mockLogout }}>
        <BrowserRouter>
          <MobileNav />
        </BrowserRouter>
      </AuthContext.Provider>
    );
  };

  beforeEach(() => {
    mockLogout.mockClear();
  });

  test('renders navigation items', () => {
    renderWithAuth();

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Chat')).toBeInTheDocument();
    expect(screen.getByText('Call')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  test('shows Login button when user is not logged in', () => {
    renderWithAuth(null);

    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();
  });

  test('shows Logout button when user is logged in', () => {
    const mockUser = { id: '1', name: 'Test User', role: 'client' };
    renderWithAuth(mockUser);

    expect(screen.getByText('Logout')).toBeInTheDocument();
    expect(screen.queryByText('Login')).not.toBeInTheDocument();
  });

  test('all navigation links are clickable', () => {
    renderWithAuth();

    const homeLink = screen.getByText('Home').closest('a');
    const dashboardLink = screen.getByText('Dashboard').closest('a');
    const chatLink = screen.getByText('Chat').closest('a');
    const callLink = screen.getByText('Call').closest('a');
    const profileLink = screen.getByText('Profile').closest('a');

    expect(homeLink).toHaveAttribute('href', '/');
    expect(dashboardLink).toHaveAttribute('href');
    expect(chatLink).toHaveAttribute('href', '/chat/0');
    expect(callLink).toHaveAttribute('href', '/call/0');
    expect(profileLink).toHaveAttribute('href', '/profile');
  });

  test('has correct dashboard link for client role', () => {
    const mockUser = { id: '1', name: 'Client User', role: 'client' };
    renderWithAuth(mockUser);

    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveAttribute('href', '/dashboard');
  });

  test('has correct dashboard link for astrologer role', () => {
    const mockUser = { id: '2', name: 'Astrologer User', role: 'astrologer' };
    renderWithAuth(mockUser);

    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveAttribute('href', '/astrologer-dashboard');
  });

  test('has correct dashboard link for admin role', () => {
    const mockUser = { id: '3', name: 'Admin User', role: 'admin' };
    renderWithAuth(mockUser);

    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveAttribute('href', '/dashboard');
  });
});
