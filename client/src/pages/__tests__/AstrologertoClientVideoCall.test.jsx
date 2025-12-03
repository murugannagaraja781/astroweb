// AstrologertoClientVideoCall.test.jsx
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import AstrologertoClientVideoCall from '../AstrologertoClientVideoCall';

// Mock getUserMedia
global.navigator.mediaDevices = {
  getUserMedia: jest.fn(() =>
    Promise.resolve({
      getTracks: () => [],
      getVideoTracks: () => [],
      getAudioTracks: () => [],
    })
  ),
};

// Mock RTCPeerConnection
class MockPeerConnection {
  constructor() {
    this.onicecandidate = null;
    this.ontrack = null;
    this.onconnectionstatechange = null;
    this.connectionState = 'new';
    this.iceConnectionState = 'new';
  }
  addTrack() {}
  createOffer() { return Promise.resolve({ type: 'offer', sdp: '' }); }
  setLocalDescription() { return Promise.resolve(); }
  setRemoteDescription() { return Promise.resolve(); }
  addIceCandidate() { return Promise.resolve(); }
  close() {}
  getStats() { return Promise.resolve(new Map()); }
}
global.RTCPeerConnection = MockPeerConnection;

// Mock socket.io-client
jest.mock('socket.io-client', () => {
  return jest.fn(() => ({
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    disconnect: jest.fn(),
  }));
});

describe('AstrologertoClientVideoCall', () => {
  test('renders without crashing and shows loading state', async () => {
    await act(async () => {
      render(
        <AstrologertoClientVideoCall roomId="testRoom" peerSocketId="peer123" astrologerId="astro1" />
      );
    });
    expect(screen.getByText(/Video Call/i)).toBeInTheDocument();
    // Initially should show connecting status
    await waitFor(() => {
      expect(screen.getByText(/Connecting.../i)).toBeInTheDocument();
    });
  });
});
