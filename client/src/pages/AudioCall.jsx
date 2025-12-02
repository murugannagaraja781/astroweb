// AudioCall.jsx - Audio-only call component
import React, { useEffect, useRef, useState } from "react";
import { FiMic, FiMicOff, FiPhone } from "react-icons/fi";

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

export default function AudioCall({ roomId, socket: propSocket, peerSocketId, isInitiator = false }) {
  const socket = useRef(null);
  const pc = useRef(null);
  const localStream = useRef(null);
  const audioContext = useRef(null);
  const analyser = useRef(null);
  const animationFrame = useRef(null);

  const [callStatus, setCallStatus] = useState("initializing");
  const [isLocalAudioEnabled, setIsLocalAudioEnabled] = useState(true);
  const [error, setError] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [showAIOption, setShowAIOption] = useState(false);

  useEffect(() => {
    console.log("[AudioCall] Props:", { roomId, peerSocketId, isInitiator, hasSocket: !!propSocket });

    if (!roomId) {
      console.error("[AudioCall] Missing roomId");
      setError("Missing connection information");
      return;
    }

    socket.current = propSocket;

    const initCall = async () => {
        try {
            console.log("[AudioCall] Requesting microphone access...");
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            localStream.current = stream;
            console.log("[AudioCall] Microphone access granted");

            // Setup audio visualization
            setupAudioVisualization(stream);

            pc.current = new RTCPeerConnection(ICE_SERVERS);
            console.log("[AudioCall] RTCPeerConnection created");

            stream.getTracks().forEach(track => pc.current.addTrack(track, stream));

            pc.current.onicecandidate = (event) => {
                if (event.candidate && peerSocketId) {
                    console.log("[AudioCall] Sending ICE candidate");
                    socket.current.emit("audio:candidate", {
                        toSocketId: peerSocketId,
                        candidate: event.candidate
                    });
                }
            };

            pc.current.ontrack = (event) => {
                console.log("[AudioCall] Received remote audio track");
                const remoteAudio = new Audio();
                remoteAudio.srcObject = event.streams[0];
                remoteAudio.play();
            };

            pc.current.onconnectionstatechange = () => {
                console.log("[AudioCall] Connection state:", pc.current.connectionState);
                if (pc.current.connectionState === 'connected') {
                    setCallStatus("connected");
                    startCallTimer();
                } else if (pc.current.connectionState === 'disconnected') {
                    setCallStatus("disconnected");
                } else if (pc.current.connectionState === 'failed') {
                    setCallStatus("failed");
                    setError("Connection failed");
                }
            };

            if (isInitiator && peerSocketId) {
                const offer = await pc.current.createOffer();
                await pc.current.setLocalDescription(offer);
                console.log("[AudioCall] Sending offer");
                socket.current.emit("audio:offer", {
                    toSocketId: peerSocketId,
                    offer
                });
                setCallStatus("calling");
            } else {
                setCallStatus("waiting");
            }

        } catch (err) {
            console.error("[AudioCall] Error initializing call:", err);
            setError("Failed to access microphone: " + err.message);
        }
    };

    initCall();

    const handleOffer = async ({ fromSocketId, offer }) => {
        console.log("[AudioCall] Received offer from:", fromSocketId);
        if (pc.current) {
            await pc.current.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.current.createAnswer();
            await pc.current.setLocalDescription(answer);
            socket.current.emit("audio:answer", {
                toSocketId: fromSocketId,
                answer
            });
            setCallStatus("connected");
        }
    };

    const handleAnswer = async ({ answer }) => {
        console.log("[AudioCall] Received answer");
        if (pc.current) {
            await pc.current.setRemoteDescription(new RTCSessionDescription(answer));
        }
    };

    const handleCandidate = async ({ candidate }) => {
        if (pc.current) {
            await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
    };

    const handleEnd = () => {
        console.log("[AudioCall] Call ended by peer");
        setCallStatus("ended");
        setShowAIOption(true);
        cleanup();
    };

    socket.current.on("audio:offer", handleOffer);
    socket.current.on("audio:answer", handleAnswer);
    socket.current.on("audio:candidate", handleCandidate);
    socket.current.on("audio:end", handleEnd);

    return () => {
        cleanup();
        socket.current.off("audio:offer");
        socket.current.off("audio:answer");
        socket.current.off("audio:candidate");
        socket.current.off("audio:end");
    };
  }, [roomId, peerSocketId, isInitiator]);

  const setupAudioVisualization = (stream) => {
      try {
          audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
          analyser.current = audioContext.current.createAnalyser();
          const source = audioContext.current.createMediaStreamSource(stream);
          source.connect(analyser.current);
          analyser.current.fftSize = 256;

          const updateAudioLevel = () => {
              const dataArray = new Uint8Array(analyser.current.frequencyBinCount);
              analyser.current.getByteFrequencyData(dataArray);
              const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
              setAudioLevel(Math.min(100, (average / 255) * 100));
              animationFrame.current = requestAnimationFrame(updateAudioLevel);
          };

          updateAudioLevel();
      } catch (err) {
          console.error("Audio visualization error:", err);
      }
  };

  const startCallTimer = () => {
      const interval = setInterval(() => {
          setCallDuration(prev => prev + 1);
      }, 1000);

      return () => clearInterval(interval);
  };

  const cleanup = () => {
      if (localStream.current) {
          localStream.current.getTracks().forEach(track => track.stop());
      }
      if (pc.current) pc.current.close();
      if (audioContext.current) audioContext.current.close();
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
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
          socket.current.emit("audio:end", { toSocketId: peerSocketId });
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
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 text-white p-8 rounded-xl relative">
        <h2 className="text-2xl font-bold mb-2">🎙️ Audio Call</h2>
        <p className="text-sm text-purple-200 mb-6">{callStatus === "connected" ? "Connected" : "Connecting..."}</p>

        {error && <div className="text-red-400 mb-4 bg-red-900/30 px-4 py-2 rounded-lg">{error}</div>}

        {/* Audio Visualization */}
        <div className="mb-8">
            <div className="w-64 h-64 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center relative overflow-hidden">
                <div
                    className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full transition-all duration-100"
                    style={{
                        transform: `scale(${0.3 + (audioLevel / 100) * 0.7})`,
                        opacity: 0.3 + (audioLevel / 100) * 0.4
                    }}
                />
                <div className="relative z-10 text-center">
                    <FiMic className="w-16 h-16 mx-auto mb-2" />
                    <p className="text-sm">{isLocalAudioEnabled ? "Speaking..." : "Muted"}</p>
                </div>
            </div>
        </div>

        {/* Call Duration */}
        {callStatus === "connected" && (
            <div className="text-3xl font-mono mb-6 text-purple-200">
                {formatDuration(callDuration)}
            </div>
        )}

        {/* AI Fallback Option */}
        {showAIOption && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-50 rounded-xl backdrop-blur-sm p-8">
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

        {/* Controls */}
        <div className="flex gap-4 mt-6">
            <button
                onClick={toggleAudio}
                className={`p-6 rounded-full transition-all transform hover:scale-110 ${isLocalAudioEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'}`}
                title={isLocalAudioEnabled ? "Mute" : "Unmute"}
            >
                {isLocalAudioEnabled ? <FiMic className="w-6 h-6" /> : <FiMicOff className="w-6 h-6" />}
            </button>
            <button
                onClick={endCall}
                className="p-6 rounded-full bg-red-600 hover:bg-red-700 transition-all transform hover:scale-110"
                title="End Call"
            >
                <FiPhone className="w-6 h-6 transform rotate-135" />
            </button>
        </div>
    </div>
  );
}
