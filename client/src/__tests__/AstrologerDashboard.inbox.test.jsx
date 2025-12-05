import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import AstrologerDashboard from '../pages/AstrologerDashboard.jsx';
import AuthContext from '../context/AuthContext';

// Mock navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock socket.io-client
let handlers = {};
const mockSocket = {
  on: jest.fn((event, cb) => { handlers[event] = cb; }),
  off: jest.fn(),
  emit: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
};
mockSocket.trigger = (event, payload) => {
  if (handlers[event]) handlers[event](payload);
};
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => mockSocket),
}));

// Mock API Client
jest.mock('../utils/apiClient', () => {
  const mockInstance = {
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
      if (url.includes('/api/chatcallrequest')) { return { data: [] }; }
      return { data: {} };
    }),
    put: jest.fn(async () => ({ data: {} })),
    post: jest.fn(async () => ({ data: {} })),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  };
  return mockInstance;
});

// Mock ChartModal and other components to simplify test
jest.mock('../components/ChartModal', () => () => <div data-testid="chart-modal">ChartModal</div>);

// Mock Audio methods which are not implemented in JSDOM
beforeAll(() => {
  window.HTMLMediaElement.prototype.load = jest.fn();
  window.HTMLMediaElement.prototype.play = jest.fn(() => Promise.resolve());
  window.HTMLMediaElement.prototype.pause = jest.fn();
});

describe('AstrologerDashboard Inbox flow', () => {
  const mockUser = { _id: 'astro_1', name: 'Astro One', role: 'astrologer' };
  const mockAuthContext = {
    user: mockUser,
    loading: false,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
  };

  beforeEach(() => {
    handlers = {};
    mockSocket.on.mockClear();
    mockSocket.off.mockClear();
    mockSocket.emit.mockClear();
    mockNavigate.mockClear();
  });

  test('shows pending request in Inbox and navigates only on chat:joined', async () => {
    await act(async () => {
      render(
        <AuthContext.Provider value={mockAuthContext}>
          <AstrologerDashboard />
        </AuthContext.Provider>
      );
    });

    // Simulate incoming chat request from client
    const payload = {
      sessionId: 'sess_123',
      client: { id: 'client_1', name: 'Client A' },
      status: 'requested',
      ratePerMinute: 10,
      createdAt: new Date().toISOString()
    };

    // Trigger socket event
    await act(async () => {
      mockSocket.trigger('chat:request', payload);
    });

    // Wait for "Inbox" to be visible and click it
    // There might be multiple "Inbox" texts (tab, header, empty state). select the Tab.
    const inboxTabs = screen.getAllByText(/Inbox/i);
    const inboxTab = inboxTabs.find(el => el.tagName === 'BUTTON');
    fireEvent.click(inboxTab || inboxTabs[0]);


    // Verify pending item is visible
    // Note: The structure of pending item depends on the component.
    // Assuming text matching client name or ID appears.
    await waitFor(() => {
       expect(screen.getByText(/Client A/i)).toBeInTheDocument();
    });

    // Find and Click "Accept" or "Chat"
    // Button might say "Accept" based on new UI
    const acceptButton = screen.getByRole('button', { name: /Accept/i });

    await act(async () => {
      fireEvent.click(acceptButton);
    });

    // Expect API call
    expect(require('../utils/apiClient').post).toHaveBeenCalledWith(
       '/api/chat/accept',
       expect.objectContaining({ sessionId: 'sess_123' })
    );

    // Expect Navigation
    expect(mockNavigate).toHaveBeenCalledWith('/chat/sess_123');
  });
});

