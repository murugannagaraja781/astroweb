// VideoCall component unit tests
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import VideoCall from './VideoCall';
import { AuthContext } from '../context/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from '../context/ToastContext';

// Mock socket.io-client
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

// Mock Agora SDK
jest.mock('agora-rtc-sdk-ng', () => {
    return {
        createClient: jest.fn(() => {
            return {
                join: jest.fn(),
                publish: jest.fn(),
                leave: jest.fn(),
                on: jest.fn(),
                off: jest.fn(),
                unsubscribe: jest.fn(),
                subscribe: jest.fn(),
            };
        }),
        createMicrophoneAudioTrack: jest.fn(() => Promise.resolve({})),
        createCameraVideoTrack: jest.fn(() => Promise.resolve({})),
    };
});

// Mock axios
jest.mock('axios', () => {
    return {
        get: jest.fn(() => Promise.resolve({ data: { balance: 100 } })),
        post: jest.fn(() => Promise.resolve({ data: { token: 'dummy-token' } })),
    };
});

// Helper to render with context
const renderWithProviders = (ui, { user }) => {
    return render(
        <AuthContext.Provider value={{ user }}>
            <ToastProvider>
                <BrowserRouter>{ui}</BrowserRouter>
            </ToastProvider>
        </AuthContext.Provider>
    );
};

describe('VideoCall Component', () => {
    const mockUser = { id: 'client1', name: 'Client One', role: 'client' };

    test('renders loading state initially', () => {
        renderWithProviders(<VideoCall />, { user: mockUser });
        expect(screen.getByText(/Initializing Call.../i)).toBeInTheDocument();
    });

    test('handles callAccepted socket event and displays duration', async () => {
        const { default: socket } = require('socket.io-client');
        const mockOn = socket().on;

        renderWithProviders(<VideoCall />, { user: mockUser });

        // Simulate callAccepted event
        const callAcceptedCallback = mockOn.mock.calls.find(c => c[0] === 'callAccepted')[1];
        act(() => {
            callAcceptedCallback({ callId: 'test-call-id' });
        });

        // Wait for UI to update with duration display
        await waitFor(() => {
            expect(screen.getByText(/Time:/i)).toBeInTheDocument();
        });
    });

    test('updates billing info on billingUpdate event', async () => {
        const { default: socket } = require('socket.io-client');
        const mockOn = socket().on;

        renderWithProviders(<VideoCall />, { user: mockUser });

        const billingCallback = mockOn.mock.calls.find(c => c[0] === 'billingUpdate')[1];
        act(() => {
            billingCallback({ duration: 120, cost: 2, balance: 98 });
        });

        await waitFor(() => {
            expect(screen.getByText(/Cost: ₹2/i)).toBeInTheDocument();
            expect(screen.getByText(/Balance: ₹98/i)).toBeInTheDocument();
        });
    });
});
