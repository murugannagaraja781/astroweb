import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from "socket.io-client";

const SIGNALING_SERVER = import.meta.env.VITE_SIGNALING_SERVER || "https://astroweb-production.up.railway.app";
const ICE_SERVERS = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        ...(import.meta.env.VITE_TURN_URL ? [{
            urls: import.meta.env.VITE_TURN_URL,
            username: import.meta.env.VITE_TURN_USERNAME,
            credential: import.meta.env.VITE_TURN_CREDENTIAL,
        }] : []),
    ],
};

export const useVideoCall = (roomId) => {
    const [callStatus, setCallStatus] = useState("initializing"); // initializing, calling, connected, ended, failed
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [error, setError] = useState(null);
    const [debugLogs, setDebugLogs] = useState([]);

    // Track states
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);

    const socket = useRef(null);
    const pc = useRef(null);
    const localStreamRef = useRef(null);

    const addLog = useCallback((msg) => {
        const time = new Date().toLocaleTimeString();
        setDebugLogs(prev => [...prev.slice(-19), `[${time}] ${msg}`]);
        console.log(`[useVideoCall] ${msg}`);
    }, []);

    const cleanup = useCallback(() => {
        addLog("Cleaning up call...");
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                track.stop();
                addLog(`Stopped local track: ${track.kind}`);
            });
            localStreamRef.current = null;
        }
        if (pc.current) {
            pc.current.close();
            pc.current = null;
            addLog("PeerConnection closed");
        }
        if (socket.current) {
            socket.current.disconnect();
            socket.current = null;
            addLog("Socket disconnected");
        }
        setLocalStream(null);
        setRemoteStream(null);
    }, [addLog]);

    const initCall = useCallback(async () => {
        try {
            cleanup(); // Ensure fresh start
            addLog("Initializing call...");
            setCallStatus("initializing");

            // 1. Socket Connection
            socket.current = io(SIGNALING_SERVER);

            socket.current.on("connect", () => {
                addLog(`Socket connected: ${socket.current.id}`);
                // Join/Request automatically? Logic depends on component, usually we emit 'call:request' elsewhere,
                // but here we might just wait for 'call:accept' triggered by dashboard, or logic is handled by 'join'
                // This hook assumes logic similar to ClientcalltoAstrologerVideoCall
            });

            socket.current.on("connect_error", (err) => {
                addLog(`Socket error: ${err.message}`);
                setError("Socket connection failed");
            });

            // 2. Media Access
            addLog("Requesting camera/microphone...");
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            addLog("Media access granted");

            setLocalStream(stream);
            localStreamRef.current = stream;

            // 3. Create PeerConnection
            addLog("Creating RTCPeerConnection");
            const peer = new RTCPeerConnection(ICE_SERVERS);

            // Add Tracks
            stream.getTracks().forEach(track => {
                peer.addTrack(track, stream);
                addLog(`Added local track: ${track.kind}`);
            });

            // Handlers
            peer.ontrack = (event) => {
                addLog(`Received remote track: ${event.track.kind}`);
                if (event.streams && event.streams[0]) {
                    setRemoteStream(event.streams[0]);
                }
            };

            peer.onicecandidate = (event) => {
                if (event.candidate) {
                    addLog("Generated ICE candidate");
                    socket.current.emit("call:candidate", {
                        candidate: event.candidate,
                        roomId
                    });
                }
            };

            peer.onconnectionstatechange = () => {
                addLog(`Connection State: ${peer.connectionState}`);
                if (peer.connectionState === 'connected') setCallStatus("connected");
                if (peer.connectionState === 'failed') {
                    setCallStatus("failed");
                    setError("Connection failed");
                }
            };

            peer.oniceconnectionstatechange = () => {
                addLog(`ICE State: ${peer.iceConnectionState}`);
            };

            pc.current = peer;

            // Create Offer
            addLog("Creating Offer...");
            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);
            addLog("Local Description Set");

            socket.current.emit("call:offer", { roomId, offer });
            addLog(`Sent offer to room: ${roomId}`);
            setCallStatus("calling");

            // Socket Signal Listeners
            socket.current.on("call:answer", async ({ answer }) => {
                addLog("Received Answer");
                if (pc.current) {
                    await pc.current.setRemoteDescription(new RTCSessionDescription(answer));
                    addLog("Remote Description Set");
                }
            });

            socket.current.on("call:candidate", async ({ candidate }) => {
                addLog("Received ICE Candidate");
                if (pc.current && candidate) {
                    await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
                    addLog("Added ICE Candidate");
                }
            });

            socket.current.on("call:end", () => {
                addLog("Received call:end event");
                setCallStatus("ended");
                cleanup();
            });

        } catch (err) {
            addLog(`Error: ${err.message}`);
            setError(err.message);
            setCallStatus("failed");
        }
    }, [roomId, addLog, cleanup]);

    // Cleanup on unmount
    useEffect(() => {
        return () => cleanup();
    }, [cleanup]);

    // Initial mount if roomId exists
    useEffect(() => {
        if (roomId) {
            // Use setTimeout to avoid synchronous state update during render
            setTimeout(() => initCall(), 0);
        }
    }, [roomId, initCall]);

    const toggleVideo = useCallback(() => {
        if (localStreamRef.current) {
            localStreamRef.current.getVideoTracks().forEach(track => track.enabled = !track.enabled);
            setIsVideoEnabled(prev => !prev);
            addLog(`Video ${!isVideoEnabled ? 'enabled' : 'disabled'}`);
        }
    }, [isVideoEnabled, addLog]);

    const toggleAudio = useCallback(() => {
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(track => track.enabled = !track.enabled);
            setIsAudioEnabled(prev => !prev);
            addLog(`Audio ${!isAudioEnabled ? 'enabled' : 'disabled'}`);
        }
    }, [isAudioEnabled, addLog]);

    const endCall = useCallback(() => {
        addLog("Ending call manually");
        if (socket.current) {
            socket.current.emit("call:end", { roomId });
        }
        setCallStatus("ended");
        cleanup();
    }, [roomId, addLog, cleanup]);

    return {
        callStatus,
        localStream,
        remoteStream, // This is the MediaStream object for the video srcObject
        error,
        debugLogs,
        isVideoEnabled,
        isAudioEnabled,
        toggleVideo,
        toggleAudio,
        endCall,
        initCall // retry capability
    };
};
