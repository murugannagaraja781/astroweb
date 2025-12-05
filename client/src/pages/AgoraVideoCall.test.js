import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import AgoraVideoCall from './AgoraVideoCall';
import { BrowserRouter } from 'react-router-dom';

// 1. Mock socket.io-client
jest.mock('socket.io-client', () => {
    const mSocket = {
        on: jest.fn(),
        emit: jest.fn(),
        off: jest.fn(),
        connect: jest.fn(),
        disconnect: jest.fn(),
    };
    return jest.fn(() => mSocket);
});

// 2. Mock axios
jest.mock('axios', () => {
    return {
        get: jest.fn((url) => {
            if (url.includes('/api/agora/token')) {
                return Promise.resolve({ data: { token: 'mock-agora-token' } });
            }
            return Promise.reject(new Error('not found'));
        }),
        post: jest.fn((url) => {
            if (url.includes('/api/call/initiate')) {
                return Promise.resolve({ data: { callId: 'mock-call-id', balance: 100 } });
            }
            return Promise.resolve({});
        }),
    };
});

// 3. Mock agora-rtc-react
jest.mock('agora-rtc-react', () => ({
    AgoraRTCProvider: ({ children }) => <div>{children}</div>,
    useRTCClient: jest.fn(() => ({})),
    useJoin: jest.fn(),
    useLocalCameraTrack: jest.fn(() => ({ isLoading: false, localCameraTrack: { setEnabled: jest.fn(), play: jest.fn() } })),
    useLocalMicrophoneTrack: jest.fn(() => ({ isLoading: false, localMicrophoneTrack: { setEnabled: jest.fn() } })),
    usePublish: jest.fn(),
    useRemoteUsers: jest.fn(() => []), // Start with no remote users
    useRemoteAudioTracks: jest.fn(() => ({ audioTracks: [] })),
    RemoteUser: () => <div>Remote User Video</div>,
}));

// 4. Mock agora-rtc-sdk-ng
jest.mock('agora-rtc-sdk-ng', () => ({
    createClient: jest.fn(() => ({})),
}));

// Helper to render
const renderComponent = () => {
    return render(
        <BrowserRouter>
            <AgoraVideoCall />
        </BrowserRouter>
    );
};

describe('AgoraVideoCall Component', () => {
    // Mock user in localStorage
    beforeAll(() => {
        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: jest.fn((key) => {
                    if (key === 'token') return 'mock-auth-token';
                    if (key === 'user') return JSON.stringify({ id: 'user1', name: 'Test User' });
                    return null;
                }),
                setItem: jest.fn(),
            },
            writable: true,
        });
    });

    test('initiates call on mount', async () => {
        const { default: axios } = require('axios');
        renderComponent();

        expect(screen.getByText(/Calling Astrologer.../i)).toBeInTheDocument();

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith(
                expect.stringContaining('/api/call/initiate'),
                expect.anything(),
                expect.anything()
            );
        });
    });

    test('connects when call is accepted', async () => {
        const { default: socket } = require('socket.io-client');
        const mockOn = socket().on;

        renderComponent();

        // Simulate callAccepted
        await waitFor(() => {
            const acceptCallback = mockOn.mock.calls.find(c => c[0] === 'call:accepted');
            if (acceptCallback) {
                act(() => {
                    acceptCallback[1]({ roomId: 'test-room' });
                });
            }
        });

        // Should show "Astrology Session" which is in VideoCallInterface
        // Note: The text might be hidden if loading, but our mock sets isLoading: false
        await waitFor(() => {
            expect(screen.getByText(/Astrology Session/i)).toBeInTheDocument();
        });
    });

    test('updates billing info', async () => {
        const { default: socket } = require('socket.io-client');
        const mockOn = socket().on;

        renderComponent();

        // Simulate call initiation response first to set callId
        // This naturally happens in the component effect, but in test we might need to wait
        await waitFor(() => expect(screen.getByText(/Calling Astrologer.../i)).toBeInTheDocument());

        // Trigger billing update
        await waitFor(() => {
            const billingCallback = mockOn.mock.calls.find(c => c[0] === 'billingUpdate');
            if (billingCallback) {
                act(() => {
                    billingCallback[1]({ callId: 'mock-call-id', duration: 125, cost: 5, balance: 95 });
                });
            }
        });

        // 125 seconds = 2:05
        await waitFor(() => {
            expect(screen.getByText(/2:05/i)).toBeInTheDocument();
            expect(screen.getByText(/Cost: ₹5/i)).toBeInTheDocument();
            expect(screen.getByText(/Bal: ₹95/i)).toBeInTheDocument();
        });
    });
});
