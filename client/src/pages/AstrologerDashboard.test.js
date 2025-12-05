import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';


import AstrologerDashboard from './AstrologerDashboard';
import { BrowserRouter } from 'react-router-dom';

import axios from 'axios';

// 1. Mock socket.io-client
jest.mock('socket.io-client', () => {
    const mSocket = {
        on: jest.fn(),
        emit: jest.fn(),
        off: jest.fn(),
        connect: jest.fn(),
        disconnect: jest.fn(),
        id: 'mock-socket-id',
    };
    return {
        io: jest.fn(() => mSocket),
    };
});

// 2. Mock axios
jest.mock('axios', () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
        post: jest.fn(),
    }
}));

// 3. Mock Child Components
jest.mock('./ClientcalltoAstrologerVideoCall', () => () => <div data-testid="video-call-component">Video Call Interface</div>);
jest.mock('./AudioCall', () => () => <div data-testid="audio-call-component">Audio Call Interface</div>);
jest.mock('../components/ChartModal', () => ({ isOpen }) => isOpen ? <div data-testid="chart-modal">Chart Modal</div> : null);
jest.mock('../components/AstrologyQuickMenu', () => () => <div data-testid="quick-menu">Quick Menu</div>);

// 4. Mock navigation
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}));

// 5. Mock Audio
const mockAudio = {
    play: jest.fn().mockResolvedValue(undefined),
    pause: jest.fn(),
    load: jest.fn(),
    addEventListener: jest.fn((event, callback) => {
        if (event === 'canplaythrough') {
            // Simulate immediate load
            callback();
        }
    }),
    removeEventListener: jest.fn(),
};
window.Audio = jest.fn(() => mockAudio);

const renderComponent = () => {
    return render(
        <BrowserRouter>
            <AstrologerDashboard />
        </BrowserRouter>
    );
};

describe('AstrologerDashboard Component', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        // Setup default local storage
        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: jest.fn((key) => {
                    if (key === 'token') return 'mock-token';
                    return null;
                }),
                setItem: jest.fn(),
            },
            writable: true,
        });
    });

    test('renders loading state initially', async () => {
        // Mock profile fetch to hang or take time
        axios.get.mockImplementation(() => new Promise(() => { }));

        renderComponent();
        expect(screen.getByText(/Connecting to cosmic energies/i)).toBeInTheDocument();
    });

    test('fetches and displays profile successfully', async () => {
        const mockProfile = {
            id: 'astro123',
            name: 'Star Gazer',
            isOnline: true,
            earnings: 5000,
        };

        axios.get.mockImplementation((url) => {
            if (url.includes('/profile')) return Promise.resolve({ data: mockProfile });
            if (url.includes('/pending')) return Promise.resolve({ data: [] });
            return Promise.resolve({ data: {} });
        });

        renderComponent();

        try {
            await waitFor(() => {
                expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
            });
        } catch (e) {
            console.log("DOM content:", screen.debug());
            throw e;
        }

        expect(screen.getByText(/Online & Available/i)).toBeInTheDocument();
        // Check formatted earnings
        expect(screen.getByText(/₹5,000/i)).toBeInTheDocument();
    });

    test('handles 403 error by redirecting', async () => {
        const error = {
            response: {
                status: 403
            }
        };
        axios.get.mockRejectedValue(error);

        renderComponent();

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
        });
    });

    test('handles 404/Profile Not Found', async () => {
        const error = {
            response: {
                status: 404
            }
        };
        axios.get.mockRejectedValue(error);

        renderComponent();

        await waitFor(() => {
            expect(screen.getByText(/Profile Not Found/i)).toBeInTheDocument();
        });
    });

    test('navigates tabs correctly', async () => {
        const mockProfile = {
            id: 'astro123',
            name: 'Star Gazer',
            isOnline: true,
        };
        axios.get.mockResolvedValue({ data: mockProfile });

        renderComponent();

        // Wait for load
        await waitFor(() => screen.getByText(/Welcome back/i));

        // Default tab is inbox
        expect(screen.getByText(/Pending Requests/i)).toBeInTheDocument();

        // Switch to Calls
        const callsTab = screen.getByText('Calls');
        fireEvent.click(callsTab);

        await waitFor(() => {
            expect(screen.getByText(/Call Studio/i)).toBeInTheDocument();
        });
    });
});
