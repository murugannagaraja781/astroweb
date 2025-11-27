import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Chat from './Chat';
import { BrowserRouter } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { act } from 'react-dom/test-utils';

// Mock socket.io-client
const mockEmit = jest.fn();
const mockOn = jest.fn();
const mockOff = jest.fn();

jest.mock('socket.io-client', () => {
  return {
    io: () => ({
      emit: mockEmit,
      on: mockOn,
      off: mockOff,
    }),
  };
});

// Mock axios
jest.mock('axios', () => ({
  get: jest.fn(() => Promise.resolve({ data: { messages: [] } })),
  post: jest.fn(() => Promise.resolve({ data: { success: true } })),
}));

// Mock useParams
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: 'test-session-id' }),
}));

const mockUser = {
  id: 'user123',
  name: 'Test User',
  role: 'client',
};

describe('Chat Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders chat interface and joins session', async () => {
    await act(async () => {
      render(
        <AuthContext.Provider value={{ user: mockUser }}>
          <BrowserRouter>
            <Chat />
          </BrowserRouter>
        </AuthContext.Provider>
      );
    });

    // Check if join_chat was emitted
    expect(mockEmit).toHaveBeenCalledWith('join_chat', { sessionId: 'test-session-id' });

    // Check for UI elements
    expect(screen.getByPlaceholderText(/Type your message/i)).toBeInTheDocument();
  });

  it('sends a message', async () => {
    await act(async () => {
      render(
        <AuthContext.Provider value={{ user: mockUser }}>
          <BrowserRouter>
            <Chat />
          </BrowserRouter>
        </AuthContext.Provider>
      );
    });

    const input = screen.getByPlaceholderText(/Type your message/i);
    const sendButton = screen.getByRole('button', { name: '' }); // Send button usually has icon only

    // Type message
    fireEvent.change(input, { target: { value: 'Hello World' } });

    // Send message
    fireEvent.submit(input.closest('form'));

    // Check if chat:message was emitted
    expect(mockEmit).toHaveBeenCalledWith('chat:message', expect.objectContaining({
      sessionId: 'test-session-id',
      senderId: 'user123',
      text: 'Hello World'
    }));
  });
});
