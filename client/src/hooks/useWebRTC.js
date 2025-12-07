import { useState, useEffect, useRef, useCallback } from 'react';

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
    }, [connectionStatus]);

    // Handle specific errors
    const handleError = (err) => {
        console.error('[useWebRTC] Error:', err);
        let message = 'An unknown error occurred.';

        if (err.name === 'NotAllowedError') {
            message = 'Camera/Microphone permission denied. Please allow access in browser settings.';
        } else if (err.name === 'NotFoundError') {
            message = 'No camera or microphone found on this device.';
        } else if (err.name === 'NotReadableError') {
            message = 'Camera/Microphone is being used by another application on your system.'; // "if any file got error"
        } else if (err.message) {
            message = err.message;
        }

        setError(message);
        setConnectionStatus('failed');
    };

    const initCall = useCallback(async () => {
        try {
            if (!socket || !roomId) return;
            console.log('[useWebRTC] Initializing call... Attempt:', retryCount + 1);
            setError(null);
            setConnectionStatus('initializing');

            // 1. Get User Media - Optimized for Speed & Adaptation
            // Allow downgrading to 240p/10fps on poor networks
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { min: 240, ideal: 640, max: 640 },
                    height: { min: 180, ideal: 480, max: 480 },
                    frameRate: { min: 10, ideal: 24, max: 24 }
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            setLocalStream(stream);
            streamRef.current = stream;

            // 2. Create Peer Connection
            peerConnection.current = new RTCPeerConnection(ICE_SERVERS);

            // Add Tracks & Configure Low-Bandwidth Handling
            stream.getTracks().forEach(track => {
                const sender = peerConnection.current.addTrack(track, stream);
                if (track.kind === 'video') {
                    // Prefer keeping motion smooth (blurrier) over high-res (stuttery)
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

            peerConnection.current.onconnectionstatechange = () => {
                console.log('[useWebRTC] Connection State:', peerConnection.current.connectionState);
                if (peerConnection.current.connectionState === 'connected') {
                    setConnectionStatus('connected');
                } else if (peerConnection.current.connectionState === 'failed') {
                    setConnectionStatus('failed');
                    setError('Connection failed. Retrying...');
                    // Auto-retry logic could go here, but let's leave it to manual or explicit Effect
                }
            };

            // 3. Negotiate (Initiator logic)
            if (isInitiator) {
                console.log('[useWebRTC] Creating offer...');
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
    }, [socket, roomId, isInitiator, retryCount]); // Depend on retryCount to re-trigger

    // Retry Function
    const retryConnection = () => {
        cleanup();
        setRetryCount(prev => prev + 1);
        // initCall will run due to dependency change or we can call it directly if we refactor useEffect
    };

    // Initialize on mount or retry
    useEffect(() => {
        initCall();
        return () => cleanup();
    }, [initCall, cleanup]); // retryCount change triggers initCall regeneration -> runs useEffect


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
                    toSocketId: fromSocketId, // This comes from the offer event, so it's correct.
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
            if (onCallEnd) onCallEnd();
        };

        socket.on('call:offer', handleOffer);
        socket.on('call:answer', handleAnswer);
        socket.on('call:candidate', handleCandidate);
        socket.on('call:end', handleEnd);

        socket.on('connect_error', (err) => {
            console.error('[useWebRTC] Socket connect_error:', err);
            // Don't immediately fail call on minor transport glitches, but log it.
            // setConnectionStatus('failed'); // Removed immediate fail to allow retries
        });

        socket.on('disconnect', (reason) => {
            console.log('[useWebRTC] Socket disconnected:', reason);
            if (reason === 'io server disconnect') {
                setError('Disconnected by server.');
                setConnectionStatus('failed');
            }
            // Else it might be transport close (network), let reconnection handle it
        });

        return () => {
            socket.off('call:offer', handleOffer);
            socket.off('call:answer', handleAnswer);
            socket.off('call:candidate', handleCandidate);
            socket.off('call:end', handleEnd);
        };
    }, [socket, cleanup, onCallEnd]);

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
