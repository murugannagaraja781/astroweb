    // ClientcalltoAstrologerVideoCall.jsx
    import React, { useEffect, useRef, useState } from "react";
    import { io } from "socket.io-client";
    import { FiVideo, FiVideoOff, FiMic, FiMicOff, FiPhone, FiInfo, FiX } from "react-icons/fi";

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

    // DEBUGGING STATE
    const [debugLogs, setDebugLogs] = useState([]);
    const [showDebug, setShowDebug] = useState(true);

    const addLog = (msg) => {
        const time = new Date().toLocaleTimeString();
        setDebugLogs(prev => [`[${time}] ${msg}`, ...prev]);
        console.log(`[AstroVideoCall] ${msg}`);
    };

    useEffect(() => {
        addLog(`Component mounted with roomId: ${roomId}`);

        if (!roomId) {
          addLog("❌ Error: Missing roomId");
          return;
        }

        addLog(`Connecting to Socket Server: ${SIGNALING_SERVER}`);

        socket.current = io(SIGNALING_SERVER);

        socket.current.on('connect', () => {
            addLog(`✅ Socket Connected! ID: ${socket.current.id}`);
        });

        socket.current.on('connect_error', (err) => {
            addLog(`❌ Socket Connection Failed: ${err.message}`);
        });

        const initCall = async () => {
            try {
                addLog("Requesting Camera & Microphone access...");
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                addLog("✅ Media Access Granted");

                localStream.current = stream;
                if (localRef.current) localRef.current.srcObject = stream;

                addLog("Creating RTCPeerConnection...");
                pc.current = new RTCPeerConnection(ICE_SERVERS);
                addLog("✅ RTCPeerConnection Created");

                stream.getTracks().forEach(track => {
                    pc.current.addTrack(track, stream);
                    addLog(`Added local track: ${track.kind}`);
                });

                pc.current.onicecandidate = (event) => {
                    if (event.candidate && peerSocketId) {
                        addLog(`Sending ICE Candidate to ${peerSocketId}`);
                        socket.current.emit("call:candidate", {
                            toSocketId: peerSocketId,
                            candidate: event.candidate
                        });
                    } else if (event.candidate) {
                         addLog(`Generated ICE Candidate (buffered)`);
                    } else {
                        addLog("End of ICE Candidates");
                    }
                };

                pc.current.ontrack = (event) => {
                    addLog("✅ Received Remote Stream Track!");
                    if (remoteRef.current) remoteRef.current.srcObject = event.streams[0];
                };

                pc.current.onconnectionstatechange = () => {
                    addLog(`Connection State Changed: ${pc.current.connectionState}`);
                    console.log("[ClientVideoCall] Connection state:", pc.current.connectionState);
                    switch (pc.current.connectionState) {
                        case 'connected':
                            setCallStatus("connected");
                            setError(null);
                            addLog("🎉 PEER CONNECTION ESTABLISHED!");
                            break;
                        case 'disconnected':
                            setError("⚠️ Connection lost. Reconnecting...");
                            break;
                        case 'failed':
                            setCallStatus("failed");
                            setError("❌ Connection failed. Please check your internet and try again.");
                            addLog("❌ CRTICAL: Peer Connection FAILED");
                            break;
                        case 'closed':
                            setCallStatus("ended");
                            break;
                    }
                };

                pc.current.oniceconnectionstatechange = () => {
                    addLog(`ICE Connection State: ${pc.current.iceConnectionState}`);
                    if (pc.current.iceConnectionState === "failed") {
                        setError("❌ Network connection failed. This may be due to firewall restrictions.");
                    }
                };

            } catch (err) {
                console.error("Error initializing call:", err);
                addLog(`❌ INIT ERROR: ${err.message}`);
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
            addLog(`📩 Received OFFER from ${fromSocketId}`);
            setPeerSocketId(fromSocketId);
            if (pc.current) {
                try {
                    addLog("Setting Remote Description (Offer)...");
                    await pc.current.setRemoteDescription(new RTCSessionDescription(offer));
                    addLog("✅ Remote Description Set");

                    // Process queued candidates
                    if (candidateQueue.current.length > 0) {
                        addLog(`Processing ${candidateQueue.current.length} queued ICE candidates...`);
                        while (candidateQueue.current.length > 0) {
                            const candidate = candidateQueue.current.shift();
                            await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
                        }
                    }

                    addLog("Creating Answer...");
                    const answer = await pc.current.createAnswer();
                    await pc.current.setLocalDescription(answer);
                    addLog("✅ Local Description Set (Answer)");

                    addLog(`Sending ANSWER to ${fromSocketId}`);
                    socket.current.emit("call:answer", {
                        toSocketId: fromSocketId,
                        answer
                    });
                    setCallStatus("connected");
                } catch (err) {
                    console.error("[ClientVideoCall] Error handling offer:", err);
                    addLog(`❌ Error handling offer: ${err.message}`);
                    setError("Failed to establish connection: " + err.message);
                }
            }
        };

        const handleCandidate = async ({ candidate }) => {
            // addLog("📩 Received ICE Candidate");
            if (pc.current) {
                try {
                    if (pc.current.remoteDescription) {
                        await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
                        // addLog("✅ Added ICE Candidate");
                    } else {
                        // Queue candidates until remote description is set
                        candidateQueue.current.push(candidate);
                        addLog("Queued ICE Candidate (Remote desc not set)");
                    }
                } catch (err) {
                    console.error("[ClientVideoCall] Error handling candidate:", err);
                    addLog(`❌ Error adding ICE candidate: ${err.message}`);
                }
            }
        };

        const handleEnd = () => {
            addLog("📩 Received Call End Signal");
            setCallStatus("ended");
            cleanup();
        };

        socket.current.on("call:offer", handleOffer);
        socket.current.on("call:candidate", handleCandidate);
        socket.current.on("call:end", handleEnd);

        return () => {
            cleanup();
            if (socket.current) {
                socket.current.off("call:offer");
                socket.current.off("call:candidate");
                socket.current.off("call:end");
                socket.current.disconnect();
            }
        };
    }, [roomId, peerSocketId]);

    const cleanup = () => {
        addLog("Cleaning up resources...");
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
            addLog(`Video ${track.enabled ? 'Enabled' : 'Disabled'}`);
        }
    };

    const toggleAudio = () => {
        if (localStream.current) {
            const track = localStream.current.getAudioTracks()[0];
            track.enabled = !track.enabled;
            setIsLocalAudioEnabled(track.enabled);
            addLog(`Audio ${track.enabled ? 'Enabled' : 'Disabled'}`);
        }
    };

    const endCall = () => {
        addLog("Ending call manually...");
        if (socket.current && peerSocketId) {
            socket.current.emit("call:end", { toSocketId: peerSocketId });
        }
        setCallStatus("ended");
        cleanup();
    };

    return (
        <div className="flex flex-col items-center justify-center h-full bg-gray-900 text-white p-4 rounded-xl relative">

            {/* DEBUG OVERLAY */}
            <div className={`absolute top-4 right-4 z-50 bg-black/80 rounded-lg p-2 max-w-sm w-full transition-all ${showDebug ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                 <div className="flex justify-between items-center mb-2 border-b border-white/20 pb-1">
                    <h3 className="text-xs font-bold text-green-400 flex items-center gap-1">
                        <FiInfo /> Connection Debug
                    </h3>
                    <button onClick={() => setShowDebug(!showDebug)} className="text-white/60 hover:text-white text-xs">
                        {showDebug ? <FiX /> : 'Show'}
                    </button>
                 </div>
                 {showDebug && (
                     <div className="h-48 overflow-y-auto font-mono text-[10px] space-y-1">
                        {debugLogs.length === 0 && <p className="text-gray-500 italic">Initializing...</p>}
                        {debugLogs.map((log, i) => (
                            <div key={i} className="break-words border-b border-white/5 pb-0.5">
                                {log.includes("❌") ? <span className="text-red-400">{log}</span> :
                                 log.includes("✅") ? <span className="text-green-400">{log}</span> :
                                 log.includes("📩") ? <span className="text-blue-400">{log}</span> :
                                 <span className="text-gray-300">{log}</span>}
                            </div>
                        ))}
                     </div>
                 )}
            </div>

            <h2 className="text-xl mb-4">Video Call</h2>
            {error && <div className="text-red-500 mb-4 font-bold bg-red-900/50 p-3 rounded">{error}</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
                <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video">
                    <video ref={localRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                    <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-sm flex items-center gap-2">
                        <span>You</span>
                        {callStatus !== "connected" && <span className="text-xs text-yellow-400 animate-pulse">({callStatus})</span>}
                    </div>
                </div>
                <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video">
                    <video ref={remoteRef} autoPlay playsInline className="w-full h-full object-cover" />
                    <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-sm">Client</div>
                    {callStatus !== "connected" && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
                            <span className="animate-pulse font-bold text-lg mb-2">{callStatus === "waiting" ? "Waiting for response..." : "Connecting..."}</span>
                            <div className="text-xs text-gray-400 max-w-[200px] text-center">
                                Check debug logs in top right for details
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className="flex gap-4 mt-6">
                <button onClick={toggleVideo} className={`p-4 rounded-full transition-all ${isLocalVideoEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'}`}>
                    {isLocalVideoEnabled ? <FiVideo /> : <FiVideoOff />}
                </button>
                <button onClick={toggleAudio} className={`p-4 rounded-full transition-all ${isLocalAudioEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'}`}>
                    {isLocalAudioEnabled ? <FiMic /> : <FiMicOff />}
                </button>
                <button onClick={endCall} className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition-all transform hover:scale-110 shadow-lg shadow-red-900/50">
                    <FiPhone className="transform rotate-135" />
                </button>
            </div>
        </div>
    );
    }