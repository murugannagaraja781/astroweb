import React, { useEffect, useRef, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import Peer from "simple-peer";
import AuthContext from "../context/AuthContext";
import { ArrowLeft, Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react";
import { useToast } from "../context/ToastContext";

const SOCKET_URL = import.meta.env.VITE_API_URL || "https://astroweb-production.up.railway.app";

export default function VideoCall() {
  const { id: otherUserId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation(); // Add useLocation
  const { addToast } = useToast();

  const [stream, setStream] = useState(null);
  const [me, setMe] = useState("");
  const [call, setCall] = useState(location.state?.incomingCall || {}); // Initialize from state
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [name, setName] = useState("");
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();
  const socket = useRef();

  useEffect(() => {
    socket.current = io(SOCKET_URL);

    socket.current.on("me", (id) => setMe(id));

    socket.current.on("callUser", ({ from, name: callerName, signal }) => {
      setCall({ isReceivingCall: true, from, name: callerName, signal });
    });

    socket.current.on("callEnded", () => {
      setCallEnded(true);
      if (connectionRef.current) connectionRef.current.destroy();
      navigate(-1); // Go back
    });

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream);
        if (myVideo.current) {
          myVideo.current.srcObject = currentStream;
        }
      })
      .catch(err => {
        console.error("Error accessing media devices:", err);
        addToast("Failed to access camera/microphone", "error");
      });

    // Join room with user ID to receive calls
    if (user?.id) {
      socket.current.emit("join-room", user.id);
    }

    return () => {
      socket.current.disconnect();
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [user?.id]);

  const answerCall = () => {
    setCallAccepted(true);
    const peer = new Peer({ initiator: false, trickle: false, stream });

    peer.on("signal", (data) => {
      socket.current.emit("answerCall", { signal: data, to: call.from });
    });

    peer.on("stream", (currentStream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = currentStream;
      }
    });

    peer.signal(call.signal);
    connectionRef.current = peer;
  };

  const callUser = (id) => {
    const peer = new Peer({ initiator: true, trickle: false, stream });

    peer.on("signal", (data) => {
      socket.current.emit("callUser", {
        userToCall: id,
        signalData: data,
        from: user.id,
        name: user.name,
      });
    });

    peer.on("stream", (currentStream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = currentStream;
      }
    });

    socket.current.on("callAccepted", (signal) => {
      setCallAccepted(true);
      peer.signal(signal);
    });

    connectionRef.current = peer;
  };

  const leaveCall = () => {
    setCallEnded(true);
    if (connectionRef.current) connectionRef.current.destroy();
    socket.current.emit("endCall", { to: otherUserId });
    navigate(-1);
  };

  const toggleMic = () => {
    if (stream) {
      stream.getAudioTracks()[0].enabled = !isMicOn;
      setIsMicOn(!isMicOn);
    }
  };

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks()[0].enabled = !isVideoOn;
      setIsVideoOn(!isVideoOn);
    }
  };

  // Auto-call if we are the initiator (client calling astrologer)
  useEffect(() => {
    if (user?.role === 'client' && otherUserId && stream) {
      // Small delay to ensure socket is ready
      const timer = setTimeout(() => {
        callUser(otherUserId);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user, otherUserId, stream]);

  return (
    <div className="relative h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-20 flex justify-between items-center">
        <button onClick={() => navigate(-1)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white">
          <ArrowLeft />
        </button>
        <div className="text-white text-center">
          <h2 className="text-lg font-bold">{callAccepted && !callEnded ? "Connected" : "Calling..."}</h2>
          <p className="text-sm opacity-70">{otherUserId}</p>
        </div>
        <div className="w-10"></div> {/* Spacer */}
      </div>

      {/* Main Video Area (Remote) */}
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        {callAccepted && !callEnded ? (
          <video playsInline ref={userVideo} autoPlay className="w-full h-full object-cover" />
        ) : (
          <div className="text-center text-white">
            <div className="w-24 h-24 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Video size={40} />
            </div>
            <p className="text-xl font-semibold">
              {call.isReceivingCall && !callAccepted ? `${call.name} is calling...` : "Waiting for connection..."}
            </p>
            {call.isReceivingCall && !callAccepted && (
              <button
                onClick={answerCall}
                className="mt-6 px-8 py-3 bg-green-500 hover:bg-green-600 rounded-full font-bold text-white shadow-lg animate-bounce"
              >
                Answer Call
              </button>
            )}
          </div>
        )}
      </div>

      {/* My Video (PIP) */}
      <div className="absolute top-20 right-4 w-32 h-48 bg-gray-800 rounded-xl overflow-hidden border-2 border-white/20 shadow-xl z-30">
        <video playsInline muted ref={myVideo} autoPlay className="w-full h-full object-cover" />
        <div className="absolute bottom-2 left-2 text-xs text-white bg-black/50 px-2 py-0.5 rounded">You</div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-6 z-30">
        <button
          onClick={toggleMic}
          className={`p-4 rounded-full shadow-lg transition-all ${isMicOn ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-red-500 text-white'}`}
        >
          {isMicOn ? <Mic /> : <MicOff />}
        </button>

        <button
          onClick={leaveCall}
          className="p-4 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transform hover:scale-110 transition-all"
        >
          <PhoneOff size={32} />
        </button>

        <button
          onClick={toggleVideo}
          className={`p-4 rounded-full shadow-lg transition-all ${isVideoOn ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-red-500 text-white'}`}
        >
          {isVideoOn ? <Video /> : <VideoOff />}
        </button>
      </div>
    </div>
  );
}
