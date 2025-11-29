import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Chat from '../pages/Chat.jsx';
import AuthContext from '../context/AuthContext';

let handlers = {};
const mockSocket = {
  on: jest.fn((event, cb) => { handlers[event] = cb; }),
  off: jest.fn(),
  emit: jest.fn(),
};
mockSocket.trigger = (event, payload) => { if (handlers[event]) handlers[event](payload); };
jest.mock('socket.io-client', () => ({ io: jest.fn(() => mockSocket) }));

jest.mock('axios', () => ({
  get: jest.fn(async () => ({ data: { messages: [] } })),
  post: jest.fn(async () => ({ data: {} })),
}));

describe('Chat session events', () => {
  beforeEach(() => {
    handlers = {};
    mockSocket.on.mockClear();
    mockSocket.emit.mockClear();
  });

  test('appends messages on chat:message and shows typing', async () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/chat/sess_1' }]}>
        <AuthContext.Provider value={{ user: { id: 'client_1' } }}>
          <Routes>
            <Route path="/chat/:id" element={<Chat />} />
          </Routes>
        </AuthContext.Provider>
      </MemoryRouter>
    );

    // Simulate incoming message
    const incoming = { sessionId: 'sess_1', senderId: 'astro_1', text: 'Hello' };
    mockSocket.trigger('chat:message', incoming);

    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });

    // Simulate typing
    mockSocket.trigger('chat:typing', { sessionId: 'sess_1', userId: 'astro_1' });
    await waitFor(() => {
      expect(screen.getByText(/Typing/i)).toBeInTheDocument();
    });
  });
});

