import { renderHook, act, waitFor } from '@testing-library/react';
import { useWebRTCCall } from '../useWebRTCCall';

jest.mock('../../config', () => ({
    config: {
        ICE_SERVERS: { iceServers: [] },
        SIGNALING_SERVER: 'http://localhost:3000'
    }
}));

// Mock RTCPeerConnection
global.RTCPeerConnection = jest.fn().mockImplementation(() => ({
    createOffer: jest.fn().mockResolvedValue({ type: 'offer', sdp: 'offer-sdp' }),
    createAnswer: jest.fn().mockResolvedValue({ type: 'answer', sdp: 'answer-sdp' }),
    setLocalDescription: jest.fn().mockResolvedValue(),
    setRemoteDescription: jest.fn().mockResolvedValue(),
    addIceCandidate: jest.fn().mockResolvedValue(),
    addTrack: jest.fn(),
    close: jest.fn(),
    onicecandidate: null,
    ontrack: null,
    onconnectionstatechange: null,
    connectionState: 'new'
}));

global.RTCSessionDescription = jest.fn();
global.RTCIceCandidate = jest.fn();

// Mock navigator.mediaDevices
global.navigator.mediaDevices = {
    getUserMedia: jest.fn().mockResolvedValue({
        getTracks: () => [{ stop: jest.fn(), enabled: true }],
        getAudioTracks: () => [{ stop: jest.fn(), enabled: true }]
    })
};

describe('useWebRTCCall Hook', () => {
    let mockSocket;

    beforeEach(() => {
        mockSocket = {
            emit: jest.fn(),
            on: jest.fn(),
            off: jest.fn()
        };
        jest.clearAllMocks();
    });

    test('should initialize with default state', () => {
        const { result } = renderHook(() => useWebRTCCall({
            socket: mockSocket,
            roomId: 'test-room',
            peerSocketId: 'peer-id',
            isInitiator: false
        }));

        expect(result.current.callStatus).toBe('initializing');
        expect(result.current.localStream).toBeNull();
        expect(result.current.remoteStream).toBeNull();
    });

    test('should start call as initiator', async () => {
        const { result } = renderHook(() => useWebRTCCall({
            socket: mockSocket,
            roomId: 'test-room',
            peerSocketId: 'peer-id',
            isInitiator: true
        }));

        await waitFor(() => {
            expect(result.current.callStatus).toBe('calling');
        });

        expect(mockSocket.emit).toHaveBeenCalledWith('audio:offer', expect.objectContaining({
            toSocketId: 'peer-id',
            offer: expect.any(Object)
        }));
    });

    test('should wait for offer as receiver', async () => {
        const { result } = renderHook(() => useWebRTCCall({
            socket: mockSocket,
            roomId: 'test-room',
            peerSocketId: 'peer-id',
            isInitiator: false
        }));

        await waitFor(() => {
            expect(result.current.callStatus).toBe('waiting');
        });

        expect(mockSocket.emit).not.toHaveBeenCalledWith('audio:offer', expect.anything());
    });

    test('should handle incoming offer', async () => {
        let offerHandler;
        mockSocket.on.mockImplementation((event, handler) => {
            if (event === 'audio:offer') offerHandler = handler;
        });

        const { result } = renderHook(() => useWebRTCCall({
            socket: mockSocket,
            roomId: 'test-room',
            peerSocketId: 'peer-id',
            isInitiator: false
        }));

        await waitFor(() => {
            expect(result.current.callStatus).toBe('waiting');
        });

        await act(async () => {
            await offerHandler({ fromSocketId: 'peer-id', offer: { type: 'offer', sdp: 'offer-sdp' } });
        });

        await waitFor(() => {
            expect(mockSocket.emit).toHaveBeenCalledWith('audio:answer', expect.objectContaining({
                toSocketId: 'peer-id',
                answer: expect.any(Object)
            }));
            expect(result.current.callStatus).toBe('connected');
        });
    });

    test('should handle incoming answer', async () => {
        let answerHandler;
        mockSocket.on.mockImplementation((event, handler) => {
            if (event === 'audio:answer') answerHandler = handler;
        });

        const { result } = renderHook(() => useWebRTCCall({
            socket: mockSocket,
            roomId: 'test-room',
            peerSocketId: 'peer-id',
            isInitiator: true
        }));

        await waitFor(() => {
            expect(result.current.callStatus).toBe('calling');
        });

        await act(async () => {
            await answerHandler({ answer: { type: 'answer', sdp: 'answer-sdp' } });
        });

        // Verification is implicit via no errors
    });

    test('should end call', async () => {
        const { result } = renderHook(() => useWebRTCCall({
            socket: mockSocket,
            roomId: 'test-room',
            peerSocketId: 'peer-id',
            isInitiator: true
        }));

        await waitFor(() => {
            expect(result.current.callStatus).toBe('calling');
        });

        act(() => {
            result.current.endCall();
        });

        expect(mockSocket.emit).toHaveBeenCalledWith('audio:end', { toSocketId: 'peer-id' });
        expect(result.current.callStatus).toBe('ended');
    });
});
