import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AstrologerDetail from '../pages/AstrologerDetail.jsx';
import AstrologerDashboard from '../pages/AstrologerDashboard.jsx';
import AuthContext from '../context/AuthContext';
import axios from 'axios';
import { io } from 'socket.io-client';

// Mock navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: 'astro_1' }),
  };
});

// Mock socket.io-client
jest.mock('socket.io-client', () => {
  const handlers = {};
  const mockSocket = {
    on: jest.fn((event, cb) => { handlers[event] = cb; }),
    off: jest.fn(),
    emit: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    // Helper to trigger events from tests
    trigger: (event, payload) => {
      if (handlers[event]) handlers[event](payload);
    }
  };
  return {
    io: jest.fn(() => mockSocket),
  };
});

// Mock axios
jest.mock('axios');

// Setup common mocks
const mockUserClient = { id: 'client_1', role: 'client', name: 'Test Client' };
const mockUserAstro = { id: 'astro_1', role: 'astrologer', name: 'Test Astro' };
const mockAstroProfile = {
  _id: 'astro_1',
  name: 'Astro One',
  isOnline: true,
  ratePerMinute: 10,
  profile: { bio: 'Test Bio' }
};

describe('Chat Flow Integration Tests', () => {
  let mockSocket;

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();

    // Get the mock socket instance
    mockSocket = io();

    // Default axios mocks
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/astrologers/astro_1')) return Promise.resolve({ data: mockAstroProfile });
      if (url.includes('/api/wallet/balance')) return Promise.resolve({ data: { balance: 100 } });
      if (url.includes('/api/chat/sessions/pending')) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: {} });
    });
    axios.post.mockResolvedValue({ data: { success: true } });
  });

  describe('AstrologerDetail (Client Side)', () => {
    test('successfully requests chat via API and waits for socket join', async () => {
      render(
        <BrowserRouter>
          <AuthContext.Provider value={{ user: mockUserClient }}>
            <AstrologerDetail />
          </AuthContext.Provider>
        </BrowserRouter>
      );

      // Wait for profile load
      await screen.findByText('Astro One');

      // Click Chat
      const chatBtn = screen.getByText('Start Chat');
      fireEvent.click(chatBtn);

      // Verify API call
      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          expect.stringContaining('/api/chat/request'),
          expect.objectContaining({ astrologerId: 'astro_1' }),
          expect.any(Object)
        );
      });

      // Verify Waiting UI
      expect(screen.getByText(/Waiting for astrologer/i)).toBeInTheDocument();

      // Simulate Socket Join (Astrologer accepted)
      act(() => {
        mockSocket.trigger('chat:joined', { sessionId: 'sess_123' });
      });

      // Verify Navigation
      expect(mockNavigate).toHaveBeenCalledWith('/chat/sess_123');
    });

    test('shows error popup on API failure', async () => {
      axios.post.mockRejectedValue({ response: { data: { msg: 'Server Error' } } });

      render(
        <BrowserRouter>
          <AuthContext.Provider value={{ user: mockUserClient }}>
            <AstrologerDetail />
          </AuthContext.Provider>
        </BrowserRouter>
      );

      await screen.findByText('Astro One');
      fireEvent.click(screen.getByText('Start Chat'));

      // Verify Error Popup
      await waitFor(() => {
        expect(screen.getByText('Server Error')).toBeInTheDocument();
        expect(screen.getByText('Connection Error')).toBeInTheDocument();
      });
    });

    test('shows error popup on timeout', async () => {
      jest.useFakeTimers();

      render(
        <BrowserRouter>
          <AuthContext.Provider value={{ user: mockUserClient }}>
            <AstrologerDetail />
          </AuthContext.Provider>
        </BrowserRouter>
      );

      await screen.findByText('Astro One');
      fireEvent.click(screen.getByText('Start Chat'));

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(16000);
      });

      // Verify Timeout Error
      await waitFor(() => {
        expect(screen.getByText(/Connection timed out/i)).toBeInTheDocument();
      });

      jest.useRealTimers();
    });
  });

  describe('AstrologerDashboard (Astrologer Side)', () => {
    test('loads pending sessions and accepts chat via API', async () => {
      const pendingSessions = [{
        sessionId: 'sess_123',
        clientId: 'client_1',
        status: 'requested',
        client: { name: 'Test Client' }
      }];

      axios.get.mockImplementation((url) => {
        if (url.includes('/api/chat/sessions/pending')) return Promise.resolve({ data: pendingSessions });
        return Promise.resolve({ data: {} });
      });

      render(
        <BrowserRouter>
          <AuthContext.Provider value={{ user: mockUserAstro }}>
            <AstrologerDashboard />
          </AuthContext.Provider>
        </BrowserRouter>
      );

      // Verify Pending Session Display
      await waitFor(() => {
        expect(screen.getByText('Session ID: sess_123')).toBeInTheDocument();
      });

      // Click Accept
      const acceptBtn = screen.getByText('Chat');
      fireEvent.click(acceptBtn);

      // Verify API Call
      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          expect.stringContaining('/api/chat/accept'),
          { sessionId: 'sess_123' },
          expect.any(Object)
        );
      });
    });
  });
});
