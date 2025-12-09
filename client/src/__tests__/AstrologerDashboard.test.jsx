
import { TextEncoder, TextDecoder } from 'util';
Object.assign(global, { TextEncoder, TextDecoder });
global.alert = jest.fn();

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import AstrologerDashboard from '../pages/AstrologerDashboard';
import AuthContext from '../context/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import socketManager from '../utils/socketManager';
import axios from 'axios';

// --- Mocks ---

// Mock Navigation
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  BrowserRouter: ({children}) => <div>{children}</div>,
  Link: ({children, to}) => <a href={to}>{children}</a>
}));

// Mock Socket
const mockSocket = {
  id: 'socket_123',
  connected: true,
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
};

jest.mock('../utils/socketManager', () => ({
  __esModule: true,
  default: {
    connect: jest.fn(() => mockSocket),
  }
}));

// Mock Axios
jest.mock('axios');

// Mock Child Components
jest.mock('../components/Modal', () => ({
  __esModule: true,
  default: ({ children, isOpen }) => (isOpen ? <div data-testid="generic-modal">{children}</div> : null)
}));
jest.mock('../components/VideoCall', () => ({
  __esModule: true,
  default: () => <div data-testid="video-call-component">VideoCall Component</div>
}));
jest.mock('../components/ChartModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose }) => (
  isOpen ? <div data-testid="chart-modal">Chart Modal <button onClick={onClose}>Close</button></div> : null
)}));
jest.mock('../components/AstrologyQuickMenu', () => ({
  __esModule: true,
  default: () => <div data-testid="quick-menu">Quick Menu</div>
}));

// Mock AuthContext
jest.mock('../context/AuthContext', () => {
  const React = require('react');
  const MockContext = React.createContext({ user: null });
  return {
    __esModule: true,
    default: MockContext,
    AuthProvider: ({children}) => <div>{children}</div>
  };
});

// Mock Lucide Icons
const iconMock = () => <div data-testid="icon" />;
jest.mock('lucide-react', () => ({
  __esModule: true,
  Home: iconMock,
  MessageCircle: iconMock,
  Phone: iconMock,
  DollarSign: iconMock,
  User: iconMock,
  Star: iconMock,
  Zap: iconMock,
  Sparkles: iconMock,
  Users: iconMock,
  Calendar: iconMock,
  BarChart3: iconMock,
  Bell: iconMock,
  X: iconMock,
  Video: iconMock
}));

// Mock HTMLMediaElement.prototype.play
Object.defineProperty(global.window.HTMLMediaElement.prototype, 'play', {
  configurable: true,
  get() {
    return () => Promise.resolve();
  },
});

Object.defineProperty(global.window.HTMLMediaElement.prototype, 'load', {
  configurable: true,
  get() {
    return () => {};
  },
});
Object.defineProperty(global.window.HTMLMediaElement.prototype, 'pause', {
  configurable: true,
  get() {
    return () => {};
  },
});

// --- Tests ---

describe('AstrologerDashboard', () => {
  const mockUser = { id: 'user_1', name: 'Astro User', role: 'astrologer' };
  const mockProfile = {
    userId: { _id: 'user_1', name: 'Astro User' },
    name: 'Astro User',
    isOnline: true
  };

  const renderDashboard = () => {
    return render(
      <AuthContext.Provider value={{ user: mockUser }}>
        <BrowserRouter>
          <AstrologerDashboard />
        </BrowserRouter>
      </AuthContext.Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default Axios mocks
    axios.get.mockImplementation((url) => {
      if (url.includes('/profile')) return Promise.resolve({ data: mockProfile });
      if (url.includes('/earnings')) return Promise.resolve({ data: { totalEarnings: 5000 } });
      if (url.includes('/sessions/pending')) return Promise.resolve({ data: [] });
      if (url.includes('/chat/history')) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: {} });
    });

    axios.put.mockImplementation((url) => {
      return Promise.resolve({ data: { success: true } });
    });

    // Setup Socket.on to capture handlers
    mockSocket.on.mockImplementation((event, handler) => {
      // Store handlers if we need to trigger them
      if (!mockSocket.handlers) mockSocket.handlers = {};
      mockSocket.handlers[event] = handler;
    });
  });

  test('renders dashboard with user info', async () => {
    await act(async () => {
      renderDashboard();
    });

    // Header name check
    expect(screen.getByText('Astro User')).toBeInTheDocument();
  });

  test('connects to socket on mount', async () => {
    await act(async () => {
      renderDashboard();
    });

    expect(socketManager.connect).toHaveBeenCalled();
  });

  test('shows incoming chat request popup and allows acceptance', async () => {
    await act(async () => {
      renderDashboard();
    });

    // Simulate chat:request
    await act(async () => {
      const chatHandler = mockSocket.handlers['chat:request'];
      if (chatHandler) {
        chatHandler({
          type: 'chat',
          sessionId: 'session_1',
          userId: { _id: 'client_1', name: 'Client Alice' },
          fromName: 'Client Alice',
          socketId: 'socket_client_1'
        });
      }
    });

    // Check for popup header
    expect(screen.getByText(/INCOMING CHAT/i)).toBeInTheDocument();
    expect(screen.getByText('Client Alice')).toBeInTheDocument();

    // Click Accept
    const acceptBtn = screen.getByText(/Accept/i);
    fireEvent.click(acceptBtn);

    // Verify emit and navigation
    expect(mockSocket.emit).toHaveBeenCalledWith('chat:accept', { sessionId: 'session_1' });
    expect(mockNavigate).toHaveBeenCalledWith('/chat/session_1');

    // Popup should close
    expect(screen.queryByText(/INCOMING CHAT/i)).not.toBeInTheDocument();
  });

  test('offline status toggle works', async () => {
    await act(async () => {
      renderDashboard();
    });

    // Initial state: Online (from mockProfile)
    // Check status indicator text in header
    expect(screen.getByText('Online')).toBeInTheDocument();

    // Find the toggle checkbox
    // It's inside a label with aria-label or just by input type
    // Since there are multiple checkboxes, we need to find the specific one for 'Your Availability'
    const statusCheckbox = screen.getAllByRole('checkbox')[0]; // First one is the main status toggle

    // Mock toggle API response
    axios.put.mockResolvedValueOnce({ data: { ...mockProfile, isOnline: false } });

    // Toggle
    fireEvent.click(statusCheckbox);

    await waitFor(() => {
        expect(axios.put).toHaveBeenCalledWith(
            expect.stringContaining('/api/astrologer/status'),
            expect.anything(),
            expect.anything()
        );
    });

    // UI should update to offline (mock response handling)
    // Header should change to Offline
    await waitFor(() => {
         expect(screen.getByText('Offline')).toBeInTheDocument();
    });
  });

  test('Switching tabs changes view', async () => {
     await act(async () => {
      renderDashboard();
    });

    // Click tabs in bottom nav
    const requestsTab = screen.getByText(/Requests/i);
    fireEvent.click(requestsTab);

    // Should see "Incoming Requests" header
    await waitFor(() => {
        expect(screen.getByText(/Incoming Requests/i)).toBeInTheDocument();
    });

    // Switch to Earnings/Profile
    const profileTab = screen.getByText(/Profile/i);
    fireEvent.click(profileTab);

    // Check for something specific to Profile/Earnings tab
    await waitFor(() => {
         expect(screen.getByText(/Total Earnings/i)).toBeInTheDocument();
    });
  });
});
