 // ClientcalltoAstrologerVideoCall.jsx
import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import {
  Phone,
  Video,
  Mic,
  MicOff,
  VideoOff,
  X,
  User,
  Wifi,
  Battery,
  Signal,
  Star,
  Crown,
  Zap,
  MessageCircle
} from "lucide-react";

const SIGNALING_SERVER = import.meta.env.VITE_SIGNALING_SERVER || "https://astroweb-production.up.railway.app";

const ICE_SERVERS = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export default function AstrologerVideoCall({ roomId }) {
  const localRef = useRef(null);
  const remoteRef = useRef(null);
  const socketRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);

  const [clientSocket, setClientSocket] = useState(null);
  const [inCall, setInCall] = useState(false);
  const [waitingForAnswer, setWaitingForAnswer] = useState(false);
  const [callStatus, setCallStatus] = useState("waiting");
  const [connectionError, setConnectionError] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    connectSocket();
    return () => endCall();
  }, []);

  const connectSocket = () => {
    socketRef.current = io(SIGNALING_SERVER);

    socketRef.current.on("connect", () => {
      socketRef.current.emit("join", roomId);
      setCallStatus("ready");
    });

    socketRef.current.on("peer:joined", ({ socketId }) => {
      setClientSocket(socketId);
      setCallStatus("client_joined");
    });

    socketRef.current.on("video:call_accepted", () => {
      setCallStatus("connecting");
      startPeerOffer();
    });

    socketRef.current.on("video:call_rejected", () => {
      setCallStatus("rejected");
      setWaitingForAnswer(false);
      setTimeout(() => setCallStatus("ready"), 3000);
    });

    socketRef.current.on("call:answer", handleAnswer);
    socketRef.current.on("call:candidate", handleCandidate);
    socketRef.current.on("disconnect", () => {
      setCallStatus("disconnected");
    });
  };

  const setupLocalStream = async () => {
    if (localStreamRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      localStreamRef.current = stream;
      localRef.current.srcObject = stream;
    } catch (error) {
      console.error("Error accessing media devices:", error);
      setConnectionError("Could not access camera/microphone");
      setCallStatus("error");
    }
  };

  const startCallRequest = () => {
    if (!clientSocket) {
      setConnectionError("Client is not in the room yet");
      return;
    }

    socketRef.current.emit("video:call_request", {
      roomId,
      to: clientSocket,
    });

    setWaitingForAnswer(true);
    setCallStatus("calling");
  };

  const startPeerOffer = async () => {
    await setupLocalStream();

    pcRef.current = new RTCPeerConnection(ICE_SERVERS);

    localStreamRef.current.getTracks().forEach((track) =>
      pcRef.current.addTrack(track, localStreamRef.current)
    );

    pcRef.current.ontrack = (e) => {
      remoteRef.current.srcObject = e.streams[0];
      setCallStatus("connected");
    };

    pcRef.current.onicecandidate = (e) => {
      if (e.candidate) {
        socketRef.current.emit("call:candidate", {
          roomId,
          candidate: e.candidate,
          to: clientSocket,
        });
      }
    };

    pcRef.current.onconnectionstatechange = () => {
      if (pcRef.current.connectionState === "connected") {
        setCallStatus("connected");
      }
    };

    const offer = await pcRef.current.createOffer();
    await pcRef.current.setLocalDescription(offer);

    socketRef.current.emit("call:offer", {
      roomId,
      offer,
      to: clientSocket,
    });

    setInCall(true);
    setWaitingForAnswer(false);
  };

  const handleAnswer = async ({ answer }) => {
    if (pcRef.current) {
      await pcRef.current.setRemoteDescription(answer);
    }
  };

  const handleCandidate = ({ candidate }) => {
    if (pcRef.current) {
      pcRef.current.addIceCandidate(candidate);
    }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const endCall = () => {
    if (pcRef.current) {
      pcRef.current.close();
      socketRef.current.emit("call:end", { roomId, to: clientSocket });
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    setInCall(false);
    setCallStatus("ended");
    setTimeout(() => setCallStatus("ready"), 2000);
  };

  const getStatusMessage = () => {
    const messages = {
      waiting: "Connecting to room...",
      ready: "Ready for consultation",
      client_joined: "Client joined the room",
      calling: "Calling client...",
      connecting: "Establishing connection...",
      connected: "Cosmic Connection Established",
      ended: "Consultation Ended",
      rejected: "Client declined the call",
      disconnected: "Connection Lost",
      error: "System Error"
    };
    return messages[callStatus] || "Ready";
  };

  const getStatusColor = () => {
    const colors = {
      waiting: "text-yellow-400",
      ready: "text-green-400",
      client_joined: "text-blue-400",
      calling: "text-orange-400",
      connecting: "text-purple-400",
      connected: "text-green-400",
      ended: "text-red-400",
      rejected: "text-red-400",
      disconnected: "text-gray-400",
      error: "text-red-400"
    };
    return colors[callStatus] || "text-gray-400";
  };

  // Format time for mobile status bar
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).toLowerCase();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white relative overflow-hidden">
      {/* Mobile Status Bar */}
      <div className="absolute top-0 left-0 right-0 z-50 px-4 pt-2 pb-1 flex justify-between items-center text-xs bg-black/20 backdrop-blur-sm">
        <div className="flex items-center gap-1">
          <Signal className="w-3 h-3" />
          <span>Cosmic</span>
        </div>
        <div className="text-sm font-medium">{formatTime(currentTime)}</div>
        <div className="flex items-center gap-1">
          <Wifi className="w-3 h-3" />
          <Battery className="w-4 h-4" />
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-8 pb-6 px-4 min-h-screen flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 pt-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Astrologer Portal</h1>
              <p className="text-xs text-purple-200">Room: {roomId}</p>
            </div>
          </div>

          <div className={`flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 backdrop-blur-sm ${getStatusColor()}`}>
            <div className={`w-2 h-2 rounded-full animate-pulse ${getStatusColor().replace('text', 'bg')}`}></div>
            <span className="text-xs font-medium">{getStatusMessage()}</span>
          </div>
        </div>

        {/* Connection Error Alert */}
        {connectionError && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-400/30 rounded-2xl backdrop-blur-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm">{connectionError}</span>
            </div>
            <button
              onClick={() => setConnectionError(null)}
              className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
        )}

        {/* Video Container */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">

          {/* Local Video */}
          <div className="relative bg-black/40 rounded-3xl overflow-hidden border-2 border-white/10 aspect-video">
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-black/60 px-3 py-2 rounded-full">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium">You</span>
            </div>

            <video
              ref={localRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />

            {!inCall && (
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <div className="w-20 h-20 bg-purple-500/20 rounded-3xl flex items-center justify-center mb-4">
                  <User className="w-8 h-8 text-purple-300" />
                </div>
                <p className="text-purple-200 text-sm text-center px-4">
                  Your camera preview will appear here
                </p>
              </div>
            )}

            {/* Video Off Overlay */}
            {isVideoOff && inCall && (
              <div className="absolute inset-0 bg-indigo-900 flex items-center justify-center">
                <div className="text-center">
                  <VideoOff className="w-12 h-12 text-purple-300 mx-auto mb-2" />
                  <p className="text-purple-200 text-sm">Video is off</p>
                </div>
              </div>
            )}
          </div>

          {/* Remote Video */}
          <div className="relative bg-black/40 rounded-3xl overflow-hidden border-2 border-white/10 aspect-video">
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-black/60 px-3 py-2 rounded-full">
              <div className={`w-2 h-2 rounded-full animate-pulse ${inCall ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
              <span className="text-xs font-medium">Client</span>
            </div>

            <video
              ref={remoteRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />

            {!inCall && (
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <div className="w-20 h-20 bg-blue-500/20 rounded-3xl flex items-center justify-center mb-4">
                  <User className="w-8 h-8 text-blue-300" />
                </div>
                <p className="text-blue-200 text-sm text-center px-4 mb-4">
                  {clientSocket ? "Client is waiting for your call" : "Waiting for client to join..."}
                </p>

                {clientSocket && !waitingForAnswer && (
                  <button
                    onClick={startCallRequest}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all"
                  >
                    <Video className="w-5 h-5" />
                    Start Video Call
                  </button>
                )}
              </div>
            )}

            {/* Calling Overlay */}
            {waitingForAnswer && (
              <div className="absolute inset-0 bg-blue-900/80 flex items-center justify-center flex-col">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-green-400 rounded-full animate-ping absolute inset-0"></div>
                  <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center relative">
                    <Phone className="w-8 h-8 text-white animate-pulse" />
                  </div>
                </div>
                <p className="text-white text-lg font-semibold mt-4">Calling Client...</p>
                <p className="text-green-200 text-sm mt-2">Waiting for acceptance</p>

                <button
                  onClick={() => {
                    setWaitingForAnswer(false);
                    setCallStatus("ready");
                  }}
                  className="mt-6 bg-red-500 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel Call
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Client Info Panel */}
        {clientSocket && !inCall && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-6 border border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">Client Connected</h3>
                  <p className="text-purple-200 text-sm">Ready for cosmic consultation</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-purple-300">Session Ready</div>
                <div className="text-sm font-semibold text-green-400">Active</div>
              </div>
            </div>
          </div>
        )}

        {/* Call Controls */}
        <div className="bg-black/30 backdrop-blur-sm rounded-3xl p-6 border border-white/10">

          {inCall ? (
            // In-call controls
            <div className="flex flex-col items-center">
              {/* Call Duration & Status */}
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-green-500/20 px-4 py-2 rounded-full border border-green-400/30">
                  <span className="text-green-400 text-sm font-semibold">LIVE</span>
                </div>
                <div className="text-lg font-mono font-semibold">00:00</div>
              </div>

              {/* Control Buttons */}
              <div className="flex justify-center gap-6">
                <button
                  onClick={toggleMute}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                    isMuted ? 'bg-red-500' : 'bg-gray-600 hover:bg-gray-500'
                  }`}
                >
                  {isMuted ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
                </button>

                <button
                  onClick={toggleVideo}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                    isVideoOff ? 'bg-red-500' : 'bg-gray-600 hover:bg-gray-500'
                  }`}
                >
                  {isVideoOff ? <VideoOff className="w-6 h-6 text-white" /> : <Video className="w-6 h-6 text-white" />}
                </button>

                <button
                  onClick={endCall}
                  className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center hover:bg-red-600 transform hover:scale-105 transition-all"
                >
                  <Phone className="w-6 h-6 text-white transform rotate-135" />
                </button>

                <button className="w-14 h-14 bg-gray-600 rounded-2xl flex items-center justify-center hover:bg-gray-500 transition-all">
                  <MessageCircle className="w-6 h-6 text-white" />
                </button>

                <button className="w-14 h-14 bg-gray-600 rounded-2xl flex items-center justify-center hover:bg-gray-500 transition-all">
                  <Star className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>
          ) : (
            // Pre-call actions
            <div className="text-center">
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                <button
                  onClick={startCallRequest}
                  disabled={!clientSocket || waitingForAnswer}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Video className="w-5 h-5" />
                  Video Call
                </button>

                <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Message
                </button>
              </div>

              {!clientSocket && (
                <p className="text-purple-300 text-sm mt-4">
                  Waiting for client to join the room...
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-purple-300 text-sm">
            ✨ Share your cosmic wisdom with seekers
          </p>
        </div>
      </div>

      {/* Mobile Bottom Safe Area */}
      <div className="h-6 bg-transparent lg:hidden"></div>
    </div>
  );
}