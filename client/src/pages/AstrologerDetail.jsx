// AstrologerDetail.jsx
import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import AuthContext from "../context/AuthContext";
// import ClienttoAstrologyvideocall from "./AstrologertoClientVideoCall";
// import AudioCall from "./AudioCall";
import VideoCall from "../components/VideoCall";

import {
  MessageCircle,
  Star,
  Award,
  Languages,
  Sparkles,
  ArrowLeft,
  Clock,
  Users,
  Zap,
  Heart,
  Shield,
  Camera,
  Phone,
} from "lucide-react";
import { io } from "socket.io-client";

const AstrologerDetail = () => {
  const { id } = useParams(); // astrologerId
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [astrologer, setAstrologer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [waiting, setWaiting] = useState(false);
  const [waitingType, setWaitingType] = useState("");
  const [socket, setSocket] = useState(null);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [videoRoomId, setVideoRoomId] = useState(null);
  const [peerSocketId, setPeerSocketId] = useState(null);
  const [showAudioCall, setShowAudioCall] = useState(false);
  const [audioRoomId, setAudioRoomId] = useState(null);
  const [audioPeerSocketId, setAudioPeerSocketId] = useState(null);
  const [lastSessionId, setLastSessionId] = useState(null);
  const [showMissedPopup, setShowMissedPopup] = useState(false);

  // Timeout Logic
  useEffect(() => {
    let timer;
    if (waiting) {
      timer = setTimeout(() => {
        setWaiting(false);
        setShowMissedPopup(true);
      }, 45000); // 45 seconds
    }
    return () => clearTimeout(timer);
  }, [waiting]);

  // ============================
  // SOCKET SETUP (CLIENT SIDE)
  // ============================
  useEffect(() => {
    if (!user?.name) return;

    const newSocket = io(import.meta.env.VITE_API_URL, {
      query: { username: user.name },
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("[Client] Socket connected:", newSocket.id);
      // Register user in onlineUsers map
      if (user?.id) {
        newSocket.emit("user_online", { userId: user.id });
      }
    });

    // When astrologer accepts, redirect client to /chat/:sessionId
    newSocket.on("chat:accepted", ({ sessionId }) => {
      console.log("[Client] Chat accepted → redirecting...", sessionId);
      setWaiting(false);
      setLastSessionId(sessionId);
      navigate(`/chat/${sessionId}`);
    });

    // When astrologer rejects
    newSocket.on("chat:rejected", ({ sessionId }) => {
      console.log("[Client] Chat rejected for session", sessionId);
      setWaiting(false);
      alert("Astrologer rejected your chat request.");
    });

    // Video Call Listeners
    newSocket.on("call:accepted", ({ roomId, fromSocketId }) => {
      console.log("Video call accepted:", roomId, fromSocketId);
      setWaiting(false);
      setVideoRoomId(roomId);
      setPeerSocketId(fromSocketId);
      setShowVideoCall(true);
    });

    newSocket.on("call:rejected", () => {
      setWaiting(false);
      alert("Astrologer is busy or rejected the call.");
    });

    newSocket.on("call:offline", () => {
      setWaiting(false);
      alert("Astrologer is offline or unreachable.");
    });

    // Audio Call Listeners
    newSocket.on("audio:accepted", ({ roomId, fromSocketId }) => {
      console.log("Audio call accepted:", roomId, fromSocketId);
      setWaiting(false);
      setAudioRoomId(roomId);
      setAudioPeerSocketId(fromSocketId);
      setShowAudioCall(true);
    });

    newSocket.on("audio:rejected", () => {
      setWaiting(false);
      alert("Astrologer rejected the audio call.");
    });

    return () => {
      newSocket.off("chat:accepted");
      newSocket.off("chat:rejected");
      newSocket.off("call:accepted");
      newSocket.off("call:rejected");
      newSocket.off("call:offline");
      newSocket.off("audio:accepted");
      newSocket.off("audio:rejected");
      newSocket.disconnect();
    };
  }, [user?.name, navigate]);

  // Load astrologer + balance
  useEffect(() => {
    fetchAstrologer();
    if (user) {
      fetchBalance();
    }
  }, [id, user]);

  const fetchBalance = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/wallet/balance`,
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );
      setBalance(res.data.balance);
    } catch (err) {
      console.error("Error fetching balance:", err);
    }
  };

  const fetchAstrologer = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/public/astrologers`
      );
      if (res.data && Array.isArray(res.data)) {
        const astro = res.data.find((a) => a._id === id);
        setAstrologer(astro || null);
      } else {
        setAstrologer(null);
      }
      setLoading(false);
    } catch (err) {
      console.error("Error fetching astrologer:", err);
      setAstrologer(null);
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // ============================
  // VIDEO CALL HANDLER
  // ============================
  // VIDEO CALL HANDLER
  const handleVideoCall = () => {
    if (!user) {
      alert("Please login to continue");
      navigate("/login");
      return;
    }
    if (!astrologer || !astrologer.isOnline) {
      alert("Astrologer is not available.");
      return;
    }
    if (!socket || !socket.connected) {
      alert("Connection not ready.");
      return;
    }

    setWaiting(true);
    setWaitingType("call");

    console.log("[VideoCall] Requesting call...", { from: user.id, to: astrologer.userId });

    // Emit Call Request via API then Socket
    axios.post(
      `${import.meta.env.VITE_API_URL}/api/call/request`,
      { receiverId: astrologer.userId, type: 'video' },
      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
    ).then(res => {
        const { callId } = res.data;
        console.log("Call API Requested:", callId);

        socket.emit("call:request", {
          fromId: user.id,
          toId: astrologer.userId,
          fromName: user.name,
          fromImage: user.avatar || "",
          callId: callId // Pass callId to socket
        });
    }).catch(err => {
        console.error("Call API Request Failed:", err);
        setWaiting(false);
        alert(err.response?.data?.msg || "Failed to initiate call");
    });
  };

  // ============================
  // AUDIO CALL HANDLER
  // ============================
  // ============================
  // AUDIO CALL HANDLER
  // ============================
  const handleAudioCall = () => {
    if (!user) {
      alert("Please login to continue");
      navigate("/login");
      return;
    }
    if (!astrologer || !astrologer.isOnline) {
      alert("Astrologer is not available.");
      return;
    }
    if (!socket || !socket.connected) {
      alert("Connection not ready.");
      return;
    }

    setWaiting(true);
    setWaitingType("audio"); // New waiting type

    console.log("[AudioCall] Requesting call...", { from: user.id, to: astrologer.userId });

    // Emit Audio Call Request via API then Socket
    axios.post(
      `${import.meta.env.VITE_API_URL}/api/call/request`,
      { receiverId: astrologer.userId, type: 'audio' },
      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
    ).then(res => {
        const { callId } = res.data;
        console.log("Audio Call API Requested:", callId);

        socket.emit("audio:request", {
          fromId: user.id,
          toId: astrologer.userId,
          fromName: user.name,
          fromImage: user.avatar || "",
          callId: callId
        });
    }).catch(err => {
        console.error("Audio Call API Request Failed:", err);
        setWaiting(false);
        alert(err.response?.data?.msg || "Failed to initiate audio call");
    });
  };

  // ============================
  // CHAT REQUEST (CLIENT → ASTRO)
  // ============================
  const requestChat = async () => {
    if (!user) {
      alert("Please login to continue");
      navigate("/login");
      return;
    }

    if (user.role === "client" && balance < 1) {
      alert("Insufficient balance! Please add money to your wallet.");
      navigate("/dashboard");
      return;
    }

    if (!astrologer) {
      alert("Astrologer information not available. Please try again.");
      return;
    }

    if (!astrologer.isOnline) {
      alert("This astrologer is currently offline. Please try again later.");
      return;
    }

    if (!socket) {
      alert("Connection not ready. Please try again.");
      return;
    }

    if (!socket.connected) {
      alert("Connection not established. Please refresh and try again.");
      return;
    }

    setWaiting(true);
    setWaitingType("chat");

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/chat/request`,
        { astrologerId: astrologer.userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.data || !res.data.sessionId) {
        throw new Error("Invalid response from server");
      }

      const { sessionId, ratePerMinute } = res.data;

      // Emit socket event to astrologer(s)
      if (user.id) {
        socket.emit("chat:request", {
          clientId: user.id,
          clientName: user.name,
          astrologerId: id,
          astrologerName: astrologer.name, // Added astrologer name as requested
          ratePerMinute: ratePerMinute || 1,
          sessionId,
        });
      }

      setLastSessionId(sessionId);
    } catch (err) {
      console.error("Error requesting chat:", err);
      setWaiting(false);
      alert(err.message || "Failed to request chat. Please try again.");
    }
  };

  // ============================
  // RENDER
  // ============================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-500 mx-auto mb-4"></div>
          <p className="text-purple-200 text-lg">
            Connecting to cosmic energies...
          </p>
        </div>
      </div>
    );
  }

  if (!astrologer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-center">
          <div className="text-6xl mb-4">🔮</div>
          <p className="text-xl text-purple-200 mb-4">Astrologer not found</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105"
          >
            Return to Universe
          </button>
        </div>
      </div>
    );
  }

  if (showVideoCall) {
    return (
        <VideoCall
            roomId={peerSocketId} // For Client, the room is the Astrologer's Socket ID (as per server logic for signal targeting)
            socket={socket}
            user={user}
            isInitiator={true} // Client initiates the WebRTC offer when accepted
            onEnd={() => {
                setShowVideoCall(false);
                setVideoRoomId(null);
                setPeerSocketId(null);
            }}
            peerName={astrologer?.name}
        />
    );
  }

  if (showAudioCall) {
    return (
        <VideoCall
            roomId={audioPeerSocketId}
            socket={socket}
            user={user}
            isInitiator={true}
            audioOnly={true}
            onEnd={() => {
                setShowAudioCall(false);
                setAudioRoomId(null);
                setAudioPeerSocketId(null);
            }}
            peerName={astrologer?.name}
        />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Cosmic Header */}
      <div className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white py-12 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-10 w-4 h-4 bg-white rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute top-20 right-20 w-3 h-3 bg-yellow-200 rounded-full opacity-30 animate-pulse"></div>
          <div className="absolute bottom-16 left-1/4 w-2 h-2 bg-blue-200 rounded-full opacity-40 animate-pulse"></div>
        </div>

        <div className="container mx-auto relative z-10">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-white hover:text-purple-200 mb-6 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Cosmic Realm</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 -mt-16 relative z-20">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/20 backdrop-blur-sm">
          {/* Profile Header */}
          <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 p-8 text-white">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Avatar */}
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-2xl border-4 border-white/20">
                  <span className="text-white text-4xl font-bold">
                    {getInitials(astrologer.name)}
                  </span>
                </div>
                {astrologer.isOnline && (
                  <div className="absolute bottom-2 right-2 w-8 h-8 bg-green-500 border-4 border-white rounded-full animate-pulse flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-4xl font-bold mb-2">{astrologer.name}</h1>
                <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                  {astrologer.isOnline ? (
                    <span className="px-4 py-2 bg-green-500/20 backdrop-blur-sm text-green-100 rounded-full text-sm font-semibold flex items-center gap-2 border border-green-400/30">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      ✨ Available for Guidance
                    </span>
                  ) : (
                    <span className="px-4 py-2 bg-gray-500/20 text-gray-300 rounded-full text-sm font-semibold">
                      🌙 Currently Meditating
                    </span>
                  )}
                </div>

                {/* Rate */}
                <div className="flex items-center justify-center md:justify-start gap-2 text-2xl font-bold text-yellow-300 mb-6">
                  <Star className="w-6 h-6 fill-yellow-300" />₹
                  {astrologer.profile?.ratePerMinute || 0}/min
                  <span className="text-sm text-purple-200 ml-2">
                    Cosmic Consultation
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                  <button
                    onClick={handleVideoCall}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-4 rounded-xl font-bold hover:from-blue-700 hover:to-cyan-700 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                  >
                    <Camera className="w-5 h-5" />
                    Video Call
                  </button>
                  <button
                    onClick={handleAudioCall}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-xl font-bold hover:from-green-700 hover:to-emerald-700 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                  >
                    <Phone className="w-5 h-5" />
                    Audio Call
                  </button>

                  <button
                    onClick={requestChat}
                    className="flex items-center gap-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-2xl font-bold hover:from-blue-600 hover:to-purple-700 transition-all shadow-2xl hover:shadow-3xl transform hover:scale-105 group"
                  >
                    <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    Text Chat
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-b">
            {astrologer.profile?.experience && (
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-purple-600 mb-2">
                  <Clock className="w-5 h-5" />
                  <span className="text-2xl font-bold">
                    {astrologer.profile.experience}+
                  </span>
                </div>
                <p className="text-sm text-gray-600">Years Experience</p>
              </div>
            )}

            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-pink-600 mb-2">
                <Users className="w-5 h-5" />
                <span className="text-2xl font-bold">98%</span>
              </div>
              <p className="text-sm text-gray-600">Satisfied Clients</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-blue-600 mb-2">
                <Zap className="w-5 h-5" />
                <span className="text-2xl font-bold">24/7</span>
              </div>
              <p className="text-sm text-gray-600">Availability</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
                <Shield className="w-5 h-5" />
                <span className="text-2xl font-bold">100%</span>
              </div>
              <p className="text-sm text-gray-600">Authentic</p>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-8">
            {/* Specialties */}
            {astrologer.profile?.specialties &&
              astrologer.profile.specialties.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">
                      Cosmic Specialties
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {astrologer.profile.specialties.map((specialty, idx) => (
                      <div
                        key={idx}
                        className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4 text-center group hover:from-purple-100 hover:to-pink-100 transition-all"
                      >
                        <span className="text-purple-700 font-semibold group-hover:text-purple-800">
                          {specialty}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            <div className="grid md:grid-cols-2 gap-8">
              {/* Languages */}
              {astrologer.profile?.languages &&
                astrologer.profile.languages.length > 0 && (
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl">
                        <Languages className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800">
                        Cosmic Languages
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {astrologer.profile.languages.map((lang, idx) => (
                        <span
                          key={idx}
                          className="px-4 py-2 bg-white border border-blue-300 text-blue-700 rounded-xl text-sm font-medium shadow-sm"
                        >
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {/* Experience */}
              {astrologer.profile?.experience && (
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl">
                      <Award className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">
                      Wisdom Journey
                    </h3>
                  </div>
                  <p className="text-gray-700 text-lg font-semibold">
                    {astrologer.profile.experience} years of cosmic guidance
                  </p>
                  <div className="mt-3 w-full bg-orange-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-amber-500 h-2 rounded-full"
                      style={{
                        width: `${Math.min(
                          astrologer.profile.experience * 10,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Bio */}
            {astrologer.profile?.bio && (
              <div className="mt-8 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl">
                    <Heart className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">
                    Cosmic Message
                  </h3>
                </div>
                <p className="text-gray-700 leading-relaxed text-lg">
                  {astrologer.profile.bio}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Waiting Modal */}
      {waiting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm mx-4 text-center transform animate-scale-in">
            <div className="w-20 h-20 mx-auto mb-6 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-ping opacity-20"></div>
              <div className="absolute inset-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                {waitingType === "call" ? (
                  <Phone className="w-8 h-8 text-white animate-pulse" />
                ) : (
                  <MessageCircle className="w-8 h-8 text-white animate-pulse" />
                )}
              </div>
            </div>

            <h4 className="text-2xl font-bold text-gray-800 mb-2">
              Connecting to Cosmos...
            </h4>
            <p className="text-gray-600 mb-6">
              {waitingType === "call"
                ? "Establishing cosmic video connection..."
                : waitingType === "audio"
                ? "Connecting to astrologer via audio..."
                : "Waiting for astrologer to accept your chat request..."}
            </p>

            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setWaiting(false)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Missed Request Popup */}
      {showMissedPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm mx-4 text-center transform animate-scale-in">
            <div className="w-20 h-20 mx-auto mb-6 relative">
              <div className="absolute inset-0 bg-red-100 rounded-full animate-pulse"></div>
              <div className="absolute inset-2 bg-red-500 rounded-full flex items-center justify-center">
                <Clock className="w-8 h-8 text-white" />
              </div>
            </div>

            <h4 className="text-2xl font-bold text-gray-800 mb-2">
              Request Missed
            </h4>
            <p className="text-gray-600 mb-6">
              The astrologer seems to be busy and missed your request. Please
              try again later.
            </p>

            <button
              onClick={() => setShowMissedPopup(false)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Floating Elements */}
      <div className="fixed bottom-4 right-4 flex flex-col gap-3 z-30">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold animate-bounce">
          ✨ Your Balance: ₹{balance}
        </div>
      </div>
    </div>
  );
};

export default AstrologerDetail;
