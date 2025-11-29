import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AstrologerDetail from '../pages/AstrologerDetail.jsx';
import AuthContext from '../context/AuthContext';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

let handlers = {};
const mockSocket = {
  on: jest.fn((event, cb) => { handlers[event] = cb; }),
  off: jest.fn(),
  emit: jest.fn(),
};
mockSocket.trigger = (event, payload) => { if (handlers[event]) handlers[event](payload); };
jest.mock('socket.io-client', () => ({ io: jest.fn(() => mockSocket) }));

jest.mock('axios', () => ({
  get: jest.fn(async (url) => {
    if (url.includes('/api/public/astrologers')) {
      return { data: [{ _id: 'astro_1', name: 'Astro One', isOnline: true, profile: { ratePerMinute: 5, languages: [], specialties: [] } }] };
    }
    if (url.includes('/api/wallet/balance')) { return { data: { balance: 10 } }; }
    return { data: {} };
  })
}));

describe('AstrologerDetail chat request flow', () => {
  beforeEach(() => {
    handlers = {};
    mockSocket.on.mockClear();
    mockSocket.emit.mockClear();
    mockNavigate.mockClear();
  });

  test('requests chat, shows waiting, navigates on chat:joined', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ user: { id: 'client_1', role: 'client' } }}>
          <AstrologerDetail />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Wait for astrologer details
    await screen.findByText('Astro One');

    // Click Chat
    const chatBtn = screen.getByText('Chat');
    fireEvent.click(chatBtn);

    // Emits chat:request
    expect(mockSocket.emit).toHaveBeenCalledWith('user_online', { userId: 'client_1' });
    expect(mockSocket.emit).toHaveBeenCalledWith('chat:request', {
      clientId: 'client_1', astrologerId: 'astro_1', ratePerMinute: 5
    });

    // Waiting overlay visible
    await waitFor(() => {
      expect(screen.getByText(/Waiting for astrologer to accept/i)).toBeInTheDocument();
    });

    // No navigation yet
    expect(mockNavigate).not.toHaveBeenCalled();

    // After chat:joined, navigate
    mockSocket.trigger('chat:joined', { sessionId: 'sess_9' });
    expect(mockNavigate).toHaveBeenCalledWith('/chat/sess_9');
  });
});

