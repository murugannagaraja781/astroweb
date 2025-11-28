import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

// Mock socket - must be defined before the mock
const mockSocket = {
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  once: jest.fn(),
};

// Mock socket.io-client
jest.mock('socket.io-client', () => {
  const actual = jest.requireActual('socket.io-client');
  return {
    ...actual,
    io: jest.fn(() => mockSocket),
  };
});

// Mock axios
jest.mock('axios');

// Mock useParams
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'test-session-id' }),
  };
});

// Now import Chat
const Chat = require('./Chat').default;
const axios = require('axios');

const mockUser = {
  id: 'user123',
  name: 'Test User',
  role: 'client',
};

describe('Chat Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    axios.get = jest.fn(() => Promise.resolve({ data: { messages: [] } }));
  });

  it('renders chat interface', () => {
    render(
      <AuthContext.Provider value={{ user: mockUser }}>
        <BrowserRouter>
          <Chat />
        </BrowserRouter>
      </AuthContext.Provider>
    );

    // Check that the component renders - just verify it doesn't crash
    expect(document.body).toBeTruthy();
  });

  it('emits join_chat on mount', () => {
    render(
      <AuthContext.Provider value={{ user: mockUser }}>
        <BrowserRouter>
          <Chat />
        </BrowserRouter>
      </AuthContext.Provider>
    );

    // Verify socket emitted join_chat event
    expect(mockSocket.emit).toHaveBeenCalledWith('join_chat', {
      sessionId: 'test-session-id',
    });
  });
});
