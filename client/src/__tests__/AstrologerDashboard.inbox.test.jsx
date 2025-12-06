import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AstrologerDashboard from '../pages/AstrologerDashboard.jsx';
import AuthContext from '../context/AuthContext';

// Mock navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/' }),
  Link: ({ children, to, onClick }) => (
    <a href={to} onClick={(e) => { if (onClick) onClick(e); }}>
      {children}
    </a>
  ),
  NavLink: ({ children, to, onClick }) => (
    <a href={to} onClick={(e) => { if (onClick) onClick(e); }}>
      {children}
    </a>
  ),
}));

// Mock socket.io-client
let handlers = {};
const mockSocket = {
  on: jest.fn((event, cb) => { handlers[event] = cb; }),
  off: jest.fn(),
  emit: jest.fn(),
};
mockSocket.trigger = (event, payload) => {
  if (handlers[event]) handlers[event](payload);
};
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => mockSocket),
}));

// Mock axios
jest.mock('axios', () => ({
  get: jest.fn(async (url) => {
    if (url.includes('/api/astrologer/profile')) {
      return { data: { userId: 'astro_1', name: 'Astro One', isOnline: true, ratePerMinute: 10 } };
    }
    if (url.includes('/api/astrologer/call-history')) { return { data: [] }; }
    if (url.includes('/api/astrologer/earnings')) { return { data: { today: 0, weekly: 0, monthly: 0 } }; }
    if (url.includes('/api/astrologer/reviews')) { return { data: [] }; }
    if (url.includes('/api/astrologer/analytics')) { return { data: { totalCalls: 0, avgRating: 0, totalEarnings: 0 } }; }
    if (url.includes('/api/astrologer/schedule')) { return { data: [] }; }
    if (url.includes('/api/chat/sessions/pending')) { return { data: [] }; }
    return { data: {} };
  }),
  put: jest.fn(async () => ({ data: {} })),
}));

describe('AstrologerDashboard Inbox flow', () => {
  beforeEach(() => {
    handlers = {};
    mockSocket.on.mockClear();
    mockSocket.off.mockClear();
    mockSocket.emit.mockClear();
    mockNavigate.mockClear();
  });

  test('shows pending request in Inbox and navigates only on chat:joined', async () => {
    const mockAuthContext = { user: { id: 'astro_1', name: 'Astro One', role: 'astrologer' } };
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <AstrologerDashboard />
      </AuthContext.Provider>
    );

    // Simulate incoming chat request from client
    const payload = { clientId: 'client_1', sessionId: 'sess_123' };
    mockSocket.trigger('chat:request', payload);

    // Open Inbox tab
    const inboxTab = await screen.findByText(/inbox/i);
    fireEvent.click(inboxTab);

    // Pending item visible
    await waitFor(() => {
      expect(screen.getByText('Inbox - Waiting Users')).toBeInTheDocument();
      expect(screen.getByText(/requested/i)).toBeInTheDocument();
    });

    // Click Chat Now
    const chatNowButtons = screen.getAllByText(/Chat/i);
    fireEvent.click(chatNowButtons[0]);

    // Should emit accept but NOT navigate yet
    expect(mockSocket.emit).toHaveBeenCalledWith('chat:accept', { sessionId: 'sess_123' });
    expect(mockNavigate).not.toHaveBeenCalled();

    // Navigate only after server confirms join
    mockSocket.trigger('chat:joined', { sessionId: 'sess_123' });
    expect(mockNavigate).toHaveBeenCalledWith('/chat/sess_123');
  });
});

