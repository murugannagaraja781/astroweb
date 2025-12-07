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
    audioOnly = false,
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

    // Handle specific errors
    const handleError = (err) => {
        console.error('[useWebRTC] Error:', err);
        let message = 'An unknown error occurred.';

        if (err.name === 'NotAllowedError') {
            message = 'Camera/Microphone permission denied. Please allow access in browser settings.';
        } else if (err.name === 'NotFoundError') {
            message = 'No camera or microphone found on this device.';
        } else if (err.name === 'NotReadableError') {
            message = 'Camera/Microphone is being used by another application on your system.';
        } else if (err.message) {
            message = err.message;
        }

        setError(message);
        setConnectionStatus('failed');
        window.alert(`Call Error: ${message}`); // Explicit alert as requested

        const initCall = useCallback(async () => {
            try {
                if (!socket || !roomId) return;
                console.log('[useWebRTC] Initializing call... Attempt:', retryCount + 1);
                setError(null);
                setConnectionStatus('initializing');

                // 1. Get User Media - Optimized for Speed & Adaptation
                // If audioOnly is true, video is false. Otherwise use constraints.
                const videoConstraints = {
                    width: { min: 240, ideal: 640, max: 640 },
                    height: { min: 180, ideal: 480, max: 480 },
                    frameRate: { min: 10, ideal: 24, max: 24 }
                };

                const stream = await navigator.mediaDevices.getUserMedia({
                    video: audioOnly ? false : videoConstraints,
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    }
                });

                console.log('[useWebRTC] Stream acquired:', stream.id, 'Tracks:', stream.getTracks().map(t => t.kind));
                setLocalStream(stream);
                streamRef.current = stream;

                // 2. Create Peer Connection
                peerConnection.current = new RTCPeerConnection(ICE_SERVERS);

                // Add Tracks
                stream.getTracks().forEach(track => {
                    const sender = peerConnection.current.addTrack(track, stream);
                    if (track.kind === 'video') {
                        try {
                            const parameters = sender.getParameters();
                            if (!parameters.encodings) parameters.encodings = [{}];
                            parameters.degradationPreference = 'maintain-framerate';
                            sender.setParameters(parameters).catch(e => console.warn('Degradation pref error:', e));
                        } catch (e) {
                            console.warn('Sender params error:', e);
                        }
                    }
                });

                // Handle Incoming Tracks
                peerConnection.current.ontrack = (event) => {
                    console.log('[useWebRTC] Received remote track');
                    if (event.streams && event.streams[0]) {
                        setRemoteStream(event.streams[0]);
                        setConnectionStatus('connected');
                    }
                };

                // Handle ICE Candidates
                peerConnection.current.onicecandidate = (event) => {
                    if (event.candidate) {
                        socket.emit('call:candidate', {
                            toSocketId: targetId,
                            candidate: event.candidate
                        });
                    }
                };

                const offer = await peerConnection.current.createOffer();
                await peerConnection.current.setLocalDescription(offer);
                socket.emit('call:offer', {
                    toSocketId: targetId,
                    offer
                });
                setConnectionStatus('offering');
            }

            } catch (err) {
            handleError(err);
        }
    }, [socket, roomId, isInitiator, retryCount, targetId, audioOnly]);

    // Retry Function
    const retryConnection = () => {
        cleanup();
        setRetryCount(prev => prev + 1);
    };

    // Initialize on mount or retry
    useEffect(() => {
        initCall();
        return () => cleanup();
    }, [initCall, cleanup]);

    // Socket Event Listeners
    useEffect(() => {
        if (!socket) return;
        const handleOffer = async ({ fromSocketId, offer }) => {
            if (!peerConnection.current) return;
            try {
                await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
                const answer = await peerConnection.current.createAnswer();
                await peerConnection.current.setLocalDescription(answer);

                setConnectionStatus('answering');
                socket.emit('call:answer', {
                    toSocketId: fromSocketId,
                    answer
                });
            } catch (err) {
                console.error('[useWebRTC] Offer handling failed', err);
            }
        };

        const handleAnswer = async ({ answer }) => {
            if (!peerConnection.current) return;
            try {
                await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
            } catch (err) {
                console.error('[useWebRTC] Answer handling failed', err);
            }
        };

        const handleCandidate = async ({ candidate }) => {
            if (!peerConnection.current) return;
            try {
                await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
                console.error('[useWebRTC] Candidate handling failed', err);
            }
        };
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
