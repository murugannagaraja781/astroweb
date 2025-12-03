// AudioCall.jsx - Audio-only call component
import { useEffect, useRef, useState } from "react";
import { FiMic, FiMicOff, FiPhone } from "react-icons/fi";
import { useWebRTCCall } from "../hooks/useWebRTCCall";

export default function AudioCall({ roomId, socket, peerSocketId, isInitiator = false }) {
  const [isLocalAudioEnabled, setIsLocalAudioEnabled] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [showAIOption, setShowAIOption] = useState(false);

  const audioContext = useRef(null);
  const analyser = useRef(null);
  const animationFrame = useRef(null);

  const { callStatus, localStream, remoteStream, error, endCall, toggleMute, pc } = useWebRTCCall({
      socket,
      roomId,
      peerSocketId,
      isInitiator,
      onCallEnd: () => setShowAIOption(true)
  });

  const [stats, setStats] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

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
          if (stats && stats.bitrate === 0) {
              setConnectionError("⚠️ No audio data! Possible firewall issue. (Missing TURN server?)");
              setShowStats(true);
          }
      }, 5000);

      const interval = setInterval(async () => {
          if (pc.current) {
              const statsReport = await pc.current.getStats();
              let activeCandidatePair = null;
              let inboundAudio = null;

              statsReport.forEach(report => {
                  if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                      activeCandidatePair = report;
                  }
                  if (report.type === 'inbound-rtp' && report.kind === 'audio') {
                      inboundAudio = report;
                  }
              });

              const currentBitrate = inboundAudio ? (inboundAudio.bytesReceived * 8) / 1000 : 0;

              setStats({
                  connectionState: pc.current.connectionState,
                  iceState: pc.current.iceConnectionState,
                  currentRoundTripTime: activeCandidatePair?.currentRoundTripTime,
                  packetsLost: inboundAudio?.packetsLost,
                  bitrate: currentBitrate
              });
          }
      }, 1000);

      return () => {
          clearInterval(interval);
          clearTimeout(checkDelay);
      };
  }, [callStatus, pc]);

  useEffect(() => {
      if (localStream) {
          setupAudioVisualization(localStream);
      }
      return () => {
          if (audioContext.current) audioContext.current.close();
          if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
      };
  }, [localStream]);

  useEffect(() => {
      if (remoteStream) {
          const remoteAudio = new Audio();
          remoteAudio.srcObject = remoteStream;
          remoteAudio.play().catch(e => console.error("Error playing remote audio:", e));
      }
  }, [remoteStream]);

  const setupAudioVisualization = (stream) => {
      try {
          audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
          analyser.current = audioContext.current.createAnalyser();
          const source = audioContext.current.createMediaStreamSource(stream);
          source.connect(analyser.current);
          analyser.current.fftSize = 256;

          const updateAudioLevel = () => {
              if (!analyser.current) return;
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

  const handleToggleMute = () => {
      const isEnabled = toggleMute();
      setIsLocalAudioEnabled(isEnabled);
  };

  const formatDuration = (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 text-white p-8 rounded-xl relative">
        <h2 className="text-2xl font-bold mb-2">🎙️ Audio Call</h2>
        <p className="text-sm text-purple-200 mb-6">
            {callStatus === "connected" ? "Connected" :
             callStatus === "calling" ? "Calling..." :
             callStatus === "waiting" ? "Waiting for answer..." :
             callStatus === "ended" ? "Call Ended" :
             "Initializing..."}
        </p>

        {error && <div className="text-red-400 mb-4 bg-red-900/30 px-4 py-2 rounded-lg">{error}</div>}

        {/* Connection Error Popup */}
        {connectionError && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-3 animate-bounce">
                <span>⚠️ {connectionError}</span>
                <button onClick={() => setConnectionError(null)} className="hover:bg-red-700 rounded-full p-1">
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
                onClick={handleToggleMute}
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
            <button
                onClick={() => setShowStats(!showStats)}
                className={`p-6 rounded-full ${showStats ? 'bg-blue-600' : 'bg-gray-700'} hover:bg-blue-700`}
                title="Network Stats"
            >
                <span className="text-xs font-bold">NET</span>
            </button>
        </div>
    </div>
  );
}
