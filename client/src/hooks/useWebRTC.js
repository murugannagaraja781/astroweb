import { useState, useEffect, useRef, useCallback } from 'react';

const ICE_SERVERS = {
    iceServers: [
        // 1. Primary STUN (Necessary for NAT traversal)
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },

        // 2. TURN Server (Mandatory for strict firewalls - Fill credentials below)
        /*
        {
            urls: 'turn:YOUR_TURN_SERVER.com:3478',
            username: 'user',
            credential: 'password'
        }
        */

        { urls: 'stun:stun.services.mozilla.com' }
    ],
    iceCandidatePoolSize: 10 // Pre-gather candidates for faster connection
};

export const useWebRTC = ({
    socket,
    user,
    roomId,
    peerSocketId, // Receive peerSocketId
    isInitiator = false,
    onCallEnd
}) => {
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState('initializing');
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);

    const peerConnection = useRef(null);
    const streamRef = useRef(null);

    // Use peerSocketId for signaling if available, otherwise fallback to roomId (legacy/chat room behavior)
    // But for 1:1 calling via socket.id, peerSocketId is critical.
    const targetId = peerSocketId || roomId;

    // Keep onCallEnd fresh without triggering re-effects
    const onCallEndRef = useRef(onCallEnd);
    useEffect(() => {
        onCallEndRef.current = onCallEnd;
    }, [onCallEnd]);

    // Cleanup function
    const cleanup = useCallback(() => {
        console.log('[useWebRTC] Cleaning up...');
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
            setLocalStream(null);
        }
        if (peerConnection.current) {
            peerConnection.current.ontrack = null;
            peerConnection.current.onicecandidate = null;
            peerConnection.current.onconnectionstatechange = null;
            peerConnection.current.close();
            peerConnection.current = null;
        }
        setRemoteStream(null);
        if (connectionStatus !== 'failed') {
            setConnectionStatus('disconnected');
        }
    }, [connectionStatus]); // onCallEnd removed from dep

    // ... (initCall, retryConnection, etc.)

    // Initialize on mount or retry
    useEffect(() => {
        initCall();
        return () => cleanup();
    }, [initCall, cleanup]);

    // Socket Event Listeners
    useEffect(() => {
        if (!socket) return;
        // ... handlers ...
        const handleEnd = () => {
            cleanup();
            if (onCallEndRef.current) onCallEndRef.current();
        };

        socket.on('call:offer', handleOffer);
        socket.on('call:answer', handleAnswer);
        socket.on('call:candidate', handleCandidate);
        socket.on('call:end', handleEnd);

        // ...

        return () => {
            socket.off('call:offer', handleOffer);
            socket.off('call:answer', handleAnswer);
            socket.off('call:candidate', handleCandidate);
            socket.off('call:end', handleEnd);
        };
    }, [socket, cleanup]); // Removed onCallEnd


    // Helpers
    const toggleAudio = (enabled) => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => track.enabled = enabled);
        }
    };

    const toggleVideo = (enabled) => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => track.enabled = enabled);
        }
    };

    return {
        localStream,
        remoteStream,
        connectionStatus,
        error,
        retryConnection,
        endCall: () => {
            if (socket && targetId) {
                socket.emit('call:end', { toSocketId: targetId });
            }
            cleanup();
            if (onCallEnd) onCallEnd();
        },
        toggleAudio,
        toggleVideo
    };
};
