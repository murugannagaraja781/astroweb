    // ClientcalltoAstrologerVideoCall.jsx
    import React, { useEffect, useRef, useState } from "react";
    import { io } from "socket.io-client";
    import { FiVideo, FiVideoOff, FiMic, FiMicOff, FiPhone } from "react-icons/fi";

    const SIGNALING_SERVER = import.meta.env.VITE_SIGNALING_SERVER || "https://astroweb-production.up.railway.app";

    const ICE_SERVERS = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        ...(import.meta.env.VITE_TURN_URL ? [{
            urls: import.meta.env.VITE_TURN_URL,
            username: import.meta.env.VITE_TURN_USERNAME,
            credential: import.meta.env.VITE_TURN_CREDENTIAL,
        }] : []),
    ],
    };

    export default function ClientcalltoAstrologerVideoCall({ roomId }) {
    const localRef = useRef(null);
    const remoteRef = useRef(null);
    const socket = useRef(null);
    const pc = useRef(null);
    const localStream = useRef(null);

    const [callStatus, setCallStatus] = useState("waiting");
    const [isLocalVideoEnabled, setIsLocalVideoEnabled] = useState(true);
    const [isLocalAudioEnabled, setIsLocalAudioEnabled] = useState(true);
    const [error, setError] = useState(null);
    const [peerSocketId, setPeerSocketId] = useState(null);
    const candidateQueue = useRef([]);

    useEffect(() => {
        console.log("[AstroVideoCall] Props:", { roomId });

        if (!roomId) {
          console.error("[AstroVideoCall] Missing roomId");
          return;
        }

        console.log("[AstroVideoCall] Creating socket connection");
        socket.current = io(SIGNALING_SERVER);

        const initCall = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                localStream.current = stream;
                if (localRef.current) localRef.current.srcObject = stream;

                pc.current = new RTCPeerConnection(ICE_SERVERS);

                stream.getTracks().forEach(track => pc.current.addTrack(track, stream));

                pc.current.onicecandidate = (event) => {
                    if (event.candidate && peerSocketId) {
                        socket.current.emit("call:candidate", {
                            toSocketId: peerSocketId,
                            candidate: event.candidate
                        });
                    }
                };

                pc.current.ontrack = (event) => {
                    if (remoteRef.current) remoteRef.current.srcObject = event.streams[0];
                };

                pc.current.onconnectionstatechange = () => {
                    console.log("[ClientVideoCall] Connection state:", pc.current.connectionState);
                    switch (pc.current.connectionState) {
                        case 'connected':
                            setCallStatus("connected");
                            setError(null);
                            break;
                        case 'disconnected':
                            setError("⚠️ Connection lost. Reconnecting...");
                            break;
                        case 'failed':
                            setCallStatus("failed");
                            setError("❌ Connection failed. Please check your internet and try again.");
                            break;
                        case 'closed':
                            setCallStatus("ended");
                            break;
                    }
                };

                pc.current.oniceconnectionstatechange = () => {
                    console.log("[ClientVideoCall] ICE state:", pc.current.iceConnectionState);
                    if (pc.current.iceConnectionState === "failed") {
                        setError("❌ Network connection failed. This may be due to firewall restrictions.");
                    }
                };

            } catch (err) {
                console.error("Error initializing call:", err);
                let errorMessage = "Failed to access camera/microphone. ";
                if (err.name === "NotAllowedError") {
                    errorMessage = "❌ Camera/Microphone permission denied. Please allow access in browser settings.";
                } else if (err.name === "NotFoundError") {
                    errorMessage = "❌ No camera or microphone found. Please connect a device.";
                } else if (err.name === "NotReadableError") {
                    errorMessage = "❌ Camera/Microphone is already in use by another application.";
                } else {
                    errorMessage = `❌ ${err.message}`;
                }
                setError(errorMessage);
            }
        };

        initCall();

        const handleOffer = async ({ fromSocketId, offer }) => {
            setPeerSocketId(fromSocketId);
            if (pc.current) {
                try {
                    await pc.current.setRemoteDescription(new RTCSessionDescription(offer));

                    // Process queued candidates
                    while (candidateQueue.current.length > 0) {
                        const candidate = candidateQueue.current.shift();
                        await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
                    }

                    const answer = await pc.current.createAnswer();
                    await pc.current.setLocalDescription(answer);

                    socket.current.emit("call:answer", {
                        toSocketId: fromSocketId,
                        answer
                    });
                    setCallStatus("connected");
                } catch (err) {
                    console.error("[ClientVideoCall] Error handling offer:", err);
                    setError("Failed to establish connection: " + err.message);
                }
            }
        };

        const handleCandidate = async ({ candidate }) => {
            if (pc.current) {
                try {
                    if (pc.current.remoteDescription) {
                        await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
                    } else {
                        // Queue candidates until remote description is set
                        candidateQueue.current.push(candidate);
                    }
                } catch (err) {
                    console.error("[ClientVideoCall] Error handling candidate:", err);
                }
            }
        };

        const handleEnd = () => {
            setCallStatus("ended");
            cleanup();
        };

        socket.current.on("call:offer", handleOffer);
        socket.current.on("call:candidate", handleCandidate);
        socket.current.on("call:end", handleEnd);

        return () => {
            cleanup();
            socket.current.off("call:offer");
            socket.current.off("call:candidate");
            socket.current.off("call:end");
        };
    }, [roomId, peerSocketId]);

    const cleanup = () => {
        if (localStream.current) {
            localStream.current.getTracks().forEach(track => track.stop());
        }
        if (pc.current) pc.current.close();
    };

    const toggleVideo = () => {
        if (localStream.current) {
            const track = localStream.current.getVideoTracks()[0];
            track.enabled = !track.enabled;
            setIsLocalVideoEnabled(track.enabled);
        }
    };

    const toggleAudio = () => {
        if (localStream.current) {
            const track = localStream.current.getAudioTracks()[0];
            track.enabled = !track.enabled;
            setIsLocalAudioEnabled(track.enabled);
        }
    };

    const endCall = () => {
        if (socket.current && peerSocketId) {
            socket.current.emit("call:end", { toSocketId: peerSocketId });
        }
        setCallStatus("ended");
        cleanup();
    };

    return (
        <div className="flex flex-col items-center justify-center h-full bg-gray-900 text-white p-4 rounded-xl">
            <h2 className="text-xl mb-4">Video Call</h2>
            {error && <div className="text-red-500 mb-4">{error}</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
                <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video">
                    <video ref={localRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                    <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-sm">You</div>
                </div>
                <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video">
                    <video ref={remoteRef} autoPlay playsInline className="w-full h-full object-cover" />
                    <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-sm">Client</div>
                    {callStatus !== "connected" && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                            <span className="animate-pulse">{callStatus === "waiting" ? "Waiting for client..." : "Connecting..."}</span>
                        </div>
                    )}
                </div>
            </div>
            <div className="flex gap-4 mt-6">
                <button onClick={toggleVideo} className={`p-4 rounded-full ${isLocalVideoEnabled ? 'bg-gray-700' : 'bg-red-600'}`}>
                    {isLocalVideoEnabled ? <FiVideo /> : <FiVideoOff />}
                </button>
                <button onClick={toggleAudio} className={`p-4 rounded-full ${isLocalAudioEnabled ? 'bg-gray-700' : 'bg-red-600'}`}>
                    {isLocalAudioEnabled ? <FiMic /> : <FiMicOff />}
                </button>
                <button onClick={endCall} className="p-4 rounded-full bg-red-600 hover:bg-red-700">
                    <FiPhone className="transform rotate-135" />
                </button>
            </div>
        </div>
    );
    }