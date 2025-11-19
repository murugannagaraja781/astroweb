import React from 'react';
import { render, screen } from '@testing-library/react';
import Chat from './Chat';
import { BrowserRouter } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

// Mock socket.io-client
jest.mock('socket.io-client', () => {
  return {
    io: () => ({
      emit: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
    }),
  };
});

// Mock axios
jest.mock('axios', () => ({
  get: jest.fn(() => Promise.resolve({ data: { balance: 1000 } })),
  post: jest.fn(() => Promise.resolve({ data: { callId: '123' } })),
}));

const mockUser = {
  _id: 'user123',
  name: 'Test User',
  role: 'client',
};

describe('Chat Component', () => {
  it('renders chat session header', () => {
    render(
      <AuthContext.Provider value={{ user: mockUser }}>
        <BrowserRouter>
          <Chat />
        </BrowserRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText(/Chat Session/i)).toBeInTheDocument();
    expect(screen.getByText(/End Chat/i)).toBeInTheDocument();
  });
});
