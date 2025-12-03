import { useState, useEffect, useRef, useCallback } from 'react';

import { config } from '../config';

const { ICE_SERVERS } = config;

export const useWebRTCCall = ({ socket, roomId, peerSocketId, isInitiator, onCallEnd }) => {
    const [callStatus, setCallStatus] = useState("initializing"); // initializing, calling, waiting, connected, ended, failed
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [error, setError] = useState(null);

    const pc = useRef(null);
    const streamRef = useRef(null);

    const cleanup = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (pc.current) {
            pc.current.close();
            pc.current = null;
        }
        setLocalStream(null);
        setRemoteStream(null);
    }, []);

    const createPeerConnection = useCallback(() => {
        if (pc.current) return pc.current;

        const peer = new RTCPeerConnection(ICE_SERVERS);

        peer.onicecandidate = (event) => {
            if (event.candidate && peerSocketId) {
                socket.emit("audio:candidate", {
                    toSocketId: peerSocketId,
                    candidate: event.candidate
                });
            }
        };

        peer.ontrack = (event) => {
            setRemoteStream(event.streams[0]);
        };

        peer.onconnectionstatechange = () => {
            console.log("[useWebRTCCall] Connection state:", peer.connectionState);
            if (peer.connectionState === 'connected') {
                setCallStatus("connected");
            } else if (peer.connectionState === 'disconnected') {
                setCallStatus("disconnected");
            } else if (peer.connectionState === 'failed') {
                setCallStatus("failed");
                setError("Connection failed");
            }
        };

        pc.current = peer;
        return peer;
    }, [peerSocketId, socket]);

    const startCall = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            setLocalStream(stream);
            streamRef.current = stream;

            const peer = createPeerConnection();
            stream.getTracks().forEach(track => peer.addTrack(track, stream));

            if (isInitiator) {
                setCallStatus("calling");
                const offer = await peer.createOffer();
                await peer.setLocalDescription(offer);
                socket.emit("audio:offer", {
                    toSocketId: peerSocketId,
                    offer
                });
            } else {
                setCallStatus("waiting");
            }
        } catch (err) {
            console.error("Error starting call:", err);
            setError("Failed to access microphone");
            setCallStatus("failed");
        }
    }, [createPeerConnection, isInitiator, peerSocketId, socket]);

    const candidateQueue = useRef([]);

    useEffect(() => {
        if (!socket || !roomId) return;

        startCall();

        const handleOffer = async ({ fromSocketId, offer }) => {
            if (!pc.current) return;
            try {
                await pc.current.setRemoteDescription(new RTCSessionDescription(offer));
                // Process queued candidates
                while (candidateQueue.current.length > 0) {
                    const candidate = candidateQueue.current.shift();
                    await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
                }
                const answer = await pc.current.createAnswer();
                await pc.current.setLocalDescription(answer);
                socket.emit("audio:answer", {
                    toSocketId: fromSocketId,
                    answer
                });
                setCallStatus("connected"); // Optimistic update, actual connection state will confirm
            } catch (err) {
                console.error("Error handling offer:", err);
            }
        };

        const handleAnswer = async ({ answer }) => {
            if (!pc.current) return;
            try {
                await pc.current.setRemoteDescription(new RTCSessionDescription(answer));
                // Process queued candidates
                while (candidateQueue.current.length > 0) {
                    const candidate = candidateQueue.current.shift();
                    await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
                }
            } catch (err) {
                console.error("Error handling answer:", err);
            }
        };

        const handleCandidate = async ({ candidate }) => {
            if (!pc.current) return;
            try {
                if (pc.current.remoteDescription) {
                    await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
                } else {
                    candidateQueue.current.push(candidate);
                }
            } catch (err) {
                console.error("Error handling candidate:", err);
            }
        };

        const handleEnd = () => {
            setCallStatus("ended");
            cleanup();
            if (onCallEnd) onCallEnd();
        };

        socket.on("audio:offer", handleOffer);
        socket.on("audio:answer", handleAnswer);
        socket.on("audio:candidate", handleCandidate);
        socket.on("audio:end", handleEnd);

        return () => {
            cleanup();
            socket.off("audio:offer", handleOffer);
            socket.off("audio:answer", handleAnswer);
            socket.off("audio:candidate", handleCandidate);
            socket.off("audio:end", handleEnd);
        };
    }, [socket, roomId, startCall, cleanup, onCallEnd]);

    const endCall = useCallback(() => {
        if (socket && peerSocketId) {
            socket.emit("audio:end", { toSocketId: peerSocketId });
        }
        setCallStatus("ended");
        cleanup();
        if (onCallEnd) onCallEnd();
    }, [socket, peerSocketId, cleanup, onCallEnd]);

    const toggleMute = useCallback(() => {
        if (streamRef.current) {
            const track = streamRef.current.getAudioTracks()[0];
            track.enabled = !track.enabled;
            return track.enabled;
        }
        return false;
    }, []);

    return {
        callStatus,
        localStream,
        remoteStream,
        error,
        endCall,
        toggleMute,
        pc // Expose PeerConnection for stats
    };
};
