// AstrologertoClientVideoCall.jsx
import { useEffect, useRef, useState } from "react";
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

export default function AstrologertoClientVideoCall({ roomId, socket: propSocket, astrologerId, peerSocketId }) {
  const localRef = useRef(null);
  const remoteRef = useRef(null);
  const socket = useRef(null);
  const pc = useRef(null);
  const localStream = useRef(null);

  const [callStatus, setCallStatus] = useState("initializing");
  const [isLocalVideoEnabled, setIsLocalVideoEnabled] = useState(true);
  const [isLocalAudioEnabled, setIsLocalAudioEnabled] = useState(true);
  const [error, setError] = useState(null);
  const [showAIOption, setShowAIOption] = useState(false);

  useEffect(() => {
    console.log("[VideoCall] Props:", { roomId, peerSocketId, hasSocket: !!propSocket });

    if (!roomId || !peerSocketId) {
      console.error("[VideoCall] Missing required props:", { roomId, peerSocketId });
      setError("Missing connection information. Please try again.");
      return;
    }

    useEffect(() => {
        if (propSocket) {
            console.log("[VideoCall] Using provided socket");
            socket.current = propSocket;
        } else {
            console.log("[VideoCall] Creating new socket connection");
            socket.current = io(SIGNALING_SERVER);
        }
    }, [propSocket]);

    const candidateQueue = useRef([]);

    const initCall = async () => {
        try {
            console.log("[VideoCall] Requesting media access...");
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localStream.current = stream;
            if (localRef.current) localRef.current.srcObject = stream;
            console.log("[VideoCall] Media access granted");

            pc.current = new RTCPeerConnection(ICE_SERVERS);
            console.log("[VideoCall] RTCPeerConnection created");

            stream.getTracks().forEach(track => pc.current.addTrack(track, stream));

            pc.current.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log("[VideoCall] Sending ICE candidate to:", peerSocketId);
                    socket.current.emit("call:candidate", {
                        toSocketId: peerSocketId,
                        candidate: event.candidate
                    });
                }
            };

            pc.current.ontrack = (event) => {
                console.log("[VideoCall] Received remote track");
                if (remoteRef.current) remoteRef.current.srcObject = event.streams[0];
            };

            pc.current.onconnectionstatechange = () => {
                console.log("[VideoCall] Connection state:", pc.current.connectionState);
                if (pc.current.connectionState === 'connected') {
                    setCallStatus("connected");
                } else if (pc.current.connectionState === 'failed') {
                    setCallStatus("failed");
                    setError("Connection failed. Please try again.");
                }
            };

            const offer = await pc.current.createOffer();
            await pc.current.setLocalDescription(offer);
            console.log("[VideoCall] Sending offer to:", peerSocketId);

            socket.current.emit("call:offer", {
                toSocketId: peerSocketId,
                offer
            });
            setCallStatus("calling");

        } catch (err) {
            console.error("[VideoCall] Error initializing call:", err);
            setError("Failed to access camera/microphone: " + err.message);
        }
    };

    initCall();

    const handleAnswer = async ({ answer }) => {
        if (pc.current) {
            try {
                await pc.current.setRemoteDescription(new RTCSessionDescription(answer));
                // Process queued candidates
                while (candidateQueue.current.length > 0) {
                    const candidate = candidateQueue.current.shift();
                    await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
                }
            } catch (err) {
                console.error("[VideoCall] Error handling answer:", err);
                setError("Connection error: " + err.message);
            }
        }
    };

    const handleCandidate = async ({ candidate }) => {
        if (pc.current) {
            try {
                if (pc.current.remoteDescription) {
                    await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
                } else {
                    candidateQueue.current.push(candidate);
                }
            } catch (err) {
                console.error("[VideoCall] Error handling candidate:", err);
            }
        }
    };

    const handleEnd = () => {
        setCallStatus("ended");
        setShowAIOption(true);
        cleanup();
    };

    socket.current.on("call:answer", handleAnswer);
    socket.current.on("call:candidate", handleCandidate);
    socket.current.on("call:end", handleEnd);

    return () => {
        cleanup();
        socket.current.off("call:answer");
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

    const [stats, setStats] = useState(null);
    const [showStats, setShowStats] = useState(false);

    const [callDuration, setCallDuration] = useState(0);

    useEffect(() => {
        if (callStatus === "connected") {
            const interval = setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [callStatus]);

    useEffect(() => {
        if (!pc.current || callStatus !== 'connected') return;

        // Initial check delay
        const checkDelay = setTimeout(() => {
            // Check if stats is null OR bitrate is 0
            if (!stats || stats.bitrate === 0) {
                setError("⚠️ No data received! Possible firewall issue. (Missing TURN server?)");
                setShowStats(true); // Auto-open stats to show 0 bitrate
            }
        }, 5000);

        const interval = setInterval(async () => {
            if (pc.current) {
                const statsReport = await pc.current.getStats();
                let activeCandidatePair = null;
                let remoteVideo = null;
                let inboundVideo = null;

                statsReport.forEach(report => {
                    if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                        activeCandidatePair = report;
                    }
                    if (report.type === 'inbound-rtp' && report.kind === 'video') {
                        inboundVideo = report;
                    }
                });

                const currentBitrate = inboundVideo ? (inboundVideo.bytesReceived * 8) / 1000 : 0;

                setStats({
                    connectionState: pc.current.connectionState,
                    iceState: pc.current.iceConnectionState,
                    currentRoundTripTime: activeCandidatePair?.currentRoundTripTime,
                    packetsLost: inboundVideo?.packetsLost,
                    bitrate: currentBitrate
                });
            }
        }, 1000);

        return () => {
            clearInterval(interval);
            clearTimeout(checkDelay);
        };
    }, [callStatus]);

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
      if (socket.current) {
          socket.current.emit("call:end", { toSocketId: peerSocketId });
      }
      setCallStatus("ended");
      setShowAIOption(true);
      cleanup();
  };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-900 text-white p-4 rounded-xl relative">
        <h2 className="text-xl mb-2">Video Call</h2>
        {callStatus === "connected" && (
            <div className="text-2xl font-mono mb-4 text-green-400">
                {formatDuration(callDuration)}
            </div>
        )}

        {/* Error Popup */}
        {error && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-3 animate-bounce">
                <span>⚠️ {error}</span>
                <button onClick={() => setError(null)} className="hover:bg-red-700 rounded-full p-1">
                    <span className="text-xl">×</span>
                </button>
            </div>
        )}

        {/* Stats Overlay */}
        {showStats && stats && (
            <div className="absolute top-16 left-4 z-40 bg-black/80 backdrop-blur-md p-4 rounded-xl text-xs font-mono border border-white/10 shadow-2xl">
                <h3 className="font-bold text-green-400 mb-2">📡 Network Stats</h3>
                <div className="space-y-1">
                    <p>Status: <span className={stats.connectionState === 'connected' ? 'text-green-400' : 'text-yellow-400'}>{stats.connectionState}</span></p>
                    <p>ICE: {stats.iceState}</p>
                    <p>Bitrate: {stats.bitrate.toFixed(0)} kbps</p>
                    <p>Packet Loss: {stats.packetsLost || 0}</p>
                    <p>RTT: {stats.currentRoundTripTime ? (stats.currentRoundTripTime * 1000).toFixed(0) + 'ms' : 'N/A'}</p>
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
            <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video">
                <video ref={localRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-sm">You</div>
            </div>
            <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video">
                <video ref={remoteRef} autoPlay playsInline className="w-full h-full object-cover" />
                <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-sm">Astrologer</div>
                {callStatus !== "connected" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                        <span className="animate-pulse">{callStatus === "calling" ? "Calling..." : "Connecting..."}</span>
                    </div>
                )}
            </div>
        </div>

        {showAIOption && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-50 rounded-xl backdrop-blur-sm">
                <h3 className="text-2xl mb-4 text-purple-300 font-bold">Call Ended</h3>
                <p className="mb-8 text-gray-300 text-center max-w-md">
                    The stars are still aligned! Continue your cosmic journey with our AI Astrologer.
                </p>
                <button
                    onClick={() => alert("Redirecting to AI Astrologer...")}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4 rounded-xl font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg mb-4"
                >
                    ✨ Talk to AI Astrologer
                </button>
                <button
                    onClick={() => window.location.reload()}
                    className="text-gray-400 hover:text-white transition-colors"
                >
                    Close
                </button>
            </div>
        )}

        <div className="flex gap-4 mt-6">
            <button onClick={toggleAudio} className={`p-4 rounded-full ${isLocalAudioEnabled ? 'bg-gray-700' : 'bg-red-600'}`}>
                {isLocalAudioEnabled ? <FiMic /> : <FiMicOff />}
            </button>
            <button onClick={toggleVideo} className={`p-4 rounded-full ${isLocalVideoEnabled ? 'bg-gray-700' : 'bg-red-600'}`}>
                {isLocalVideoEnabled ? <FiVideo /> : <FiVideoOff />}
            </button>
            <button onClick={endCall} className="p-4 rounded-full bg-red-600 hover:bg-red-700">
                <FiPhone className="transform rotate-135" />
            </button>
            <button
                onClick={() => setShowStats(!showStats)}
                className={`p-4 rounded-full ${showStats ? 'bg-blue-600' : 'bg-gray-700'} hover:bg-blue-700`}
                title="Network Stats"
            >
                <span className="text-xs font-bold">NET</span>
            </button>
        </div>
    </div>
  );
}