// AudioCall.test.jsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AudioCall from '../AudioCall';

// Mock getUserMedia
global.navigator.mediaDevices = {
  getUserMedia: jest.fn(() =>
    Promise.resolve({
      getTracks: () => [],
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

describe('AudioCall component', () => {
  test('renders and shows connecting state', async () => {
    render(
      <AudioCall roomId="testRoom" socket={null} peerSocketId="peer123" isInitiator={true} />
    );
    expect(screen.getByText(/Audio Call/i)).toBeInTheDocument();
    await waitFor(() => {
      // Expect connecting status text to appear
      expect(screen.getByText(/Connecting.../i)).toBeInTheDocument();
    });
  });
});
