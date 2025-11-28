import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AstrologerDashboard from '../pages/AstrologerDashboard';
import AuthContext from '../context/AuthContext';
import axios from 'axios';
import { io } from 'socket.io-client';

jest.mock('axios');
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
  })),
}));

describe('AstrologerDashboard', () => {
  const mockUser = { id: 'user123' };

  const renderWithContext = (ui) => {
    return render(
      <AuthContext.Provider value={{ user: mockUser }}>
        {ui}
      </AuthContext.Provider>
    );
  };

  test('renders without crashing when API returns non-array data', async () => {
    // Mock axios to return an object instead of an array
    (axios.get as jest.Mock).mockResolvedValue({ data: { sessions: [] } });

    renderWithContext(<AstrologerDashboard />);

    // Wait for loadSessions to finish
    await waitFor(() => expect(axios.get).toHaveBeenCalled());

    // Should display the heading
    expect(screen.getByText('Pending Chat Requests')).toBeInTheDocument();
    // Since sessions array is empty, show the no waiting users message
    expect(screen.getByText('No waiting users at the moment.')).toBeInTheDocument();
  });

  test('renders session list when API returns an array', async () => {
    const mockSessions = [
      { sessionId: 'sess1', status: 'requested' },
      { sessionId: 'sess2', status: 'pending' },
    ];
    (axios.get as jest.Mock).mockResolvedValue({ data: mockSessions });

    renderWithContext(<AstrologerDashboard />);

    await waitFor(() => expect(axios.get).toHaveBeenCalled());

    // Verify that session IDs appear in the document
    expect(screen.getByText('Session ID: sess1')).toBeInTheDocument();
    expect(screen.getByText('Session ID: sess2')).toBeInTheDocument();
  });
});
