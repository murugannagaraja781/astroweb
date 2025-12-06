// AstrologerDetail.jsx
import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import AuthContext from "../context/AuthContext";
import ClienttoAstrologyvideocall from "./AstrologertoClientVideoCall";
import AudioCall from "./AudioCall";
import IntakeModal from "../components/IntakeModal";

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
  const [showIntakeModal, setShowIntakeModal] = useState(false);

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
  const handleVideoCall = () => {
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

    if (!socket || !socket.connected) {
      alert("Connection not ready. Please refresh.");
      return;
    }

    setWaiting(true);
    setWaitingType("call");

    console.log("[VideoCall] Sending call request to astrologer:", {
      fromId: user.id,
      toId: astrologer.userId,
      astrologerProfileId: id,
    });

    socket.emit("call:request", {
      fromId: user.id,
      toId: astrologer.userId, // Use userId, not profile ID
      fromName: user.name,
      fromImage: user.avatar || "",
    });
  };

  // ============================
  // AUDIO CALL HANDLER
  // ============================
  const handleAudioCall = () => {
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

    if (!socket || !socket.connected) {
      alert("Connection not ready. Please refresh.");
      return;
    }

    setWaiting(true);
    setWaitingType("audio");

    console.log("[AudioCall] Sending audio call request to astrologer:", {
      fromId: user.id,
      toId: astrologer.userId,
      astrologerProfileId: id,
    });

    socket.emit("audio:request", {
      fromId: user.id,
      toId: astrologer.userId,
      fromName: user.name,
      fromImage: user.avatar || "",
    });
  };

  // ============================
  // CHAT REQUEST (CLIENT → ASTRO)
  // ============================
  // ============================
  // CHAT REQUEST (CLIENT → ASTRO)
  // ============================
  const handleChatClick = () => {
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

    if (!socket || !socket.connected) {
      // Try to reconnect if socket exists but not connected
      if (socket && !socket.connected) socket.connect();
      else {
        alert("Connection not ready. Please refresh.");
        return;
      }
    }

    // Open Intake Modal instead of direct request
    setShowIntakeModal(true);
  };

  const handleIntakeSubmit = async (intakeData) => {
    setShowIntakeModal(false);
    setWaiting(true);
    setWaitingType("chat");

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/chat/request`,
        {
          astrologerId: id,
          intakeDetails: intakeData
        },
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
          astrologerId: id,
          ratePerMinute: ratePerMinute || 1,
          sessionId,
          intakeDetails: intakeData
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
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="container mx-auto p-4">
          <button
            onClick={() => setShowVideoCall(false)}
            className="flex items-center gap-2 text-white hover:text-purple-200 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Profile
          </button>
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 text-white text-center">
            <div className="text-6xl mb-4">📹</div>
            <h3 className="text-2xl font-bold mb-4">Video Call Feature</h3>
            <div className="text-purple-200 mb-6">
              <div className="text-purple-200 mb-6">
                <ClienttoAstrologyvideocall
                  roomId={videoRoomId}
                  socket={socket}
                  astrologerId={id}
                  peerSocketId={peerSocketId}
                />
              </div>
            </div>
            {/* Audio Call Component */}
            {showAudioCall && audioRoomId && (
              <div className="text-purple-200 mb-6">
                <AudioCall
                  roomId={audioRoomId}
                  socket={socket}
                  peerSocketId={audioPeerSocketId}
                  isInitiator={true}
                />
              </div>
            )}

            <div className="text-center">
              <button
                onClick={() => {
                  setShowVideoCall(false);
                  setShowAudioCall(false);
                }}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
              >
                Return to Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50/30 font-sans">
      {/* Royal Orange-Gold Header */}
      <div className="relative bg-gradient-to-r from-orange-600 via-amber-500 to-yellow-500 text-white py-4 px-4 shadow-lg sticky top-0 z-40">
        <div className="container mx-auto flex items-center justify-between">
           <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-1 hover:bg-black/10 rounded-full transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-white" />
              </button>
              <h1 className="text-xl font-serif font-bold tracking-wide">Astrologer Profile</h1>
           </div>
           <button className="bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-bold border border-white/20 flex items-center gap-1 hover:bg-black/30 transition-colors">
             <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></div>
             <span className="text-white">Help</span>
           </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 min-h-[calc(100vh-60px)]">
         {/* Profile Card */}
         <div className="bg-white rounded-2xl shadow-md border border-orange-100 p-5 mb-4 relative overflow-hidden">
            {/* Decorative bg element */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -z-0 opacity-50"></div>

            <div className="relative z-10 flex gap-5">
               {/* Avatar */}
               <div className="relative flex-shrink-0">
                  <div className="w-28 h-28 rounded-full border-[3px] border-orange-400 p-1 shadow-sm">
                     <img
                       src={astrologer.profile?.profileImage || `https://ui-avatars.com/api/?name=${astrologer.name}&background=random`}
                       alt={astrologer.name}
                       className="w-full h-full rounded-full object-cover"
                     />
                  </div>
                  {astrologer.isOnline && (
                    <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>
                  )}
               </div>

               {/* Info */}
               <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                     <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-1">
                          {astrologer.name}
                          <Shield className="w-4 h-4 text-blue-500 fill-blue-500" />
                        </h2>
                        <p className="text-sm text-gray-500 truncate">
                          {astrologer.profile?.specialties?.join(', ') || 'Vedic, Prashana'}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {astrologer.profile?.languages?.join(', ') || 'English, Hindi'}
                        </p>
                     </div>
                     <div className="text-right">
                       <p className="text-xs text-gray-400">Experience</p>
                       <p className="font-bold text-gray-900">{astrologer.profile?.experience || 0} Yrs</p>
                     </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                     <span className="text-lg font-bold text-gray-900">
                       ₹{astrologer.profile?.ratePerMinute || 20}/min
                     </span>
                     {astrologer.profile?.ratePerMinute > 0 && (
                        <span className="text-xs text-red-500 line-through">
                          ₹{Math.round(astrologer.profile.ratePerMinute * 1.5)}/min
                        </span>
                     )}
                  </div>
               </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2 mt-6 border-t border-gray-100 pt-4">
               <div className="text-center">
                  <div className="text-lg font-bold text-gray-900 flex items-center justify-center gap-1">
                     4.8 <Star size={14} className="fill-yellow-400 text-yellow-400" />
                  </div>
                  <p className="text-xs text-gray-500">Rating</p>
               </div>
               <div className="text-center border-l border-gray-100">
                  <div className="text-lg font-bold text-gray-900">
                     2000+
                  </div>
                  <p className="text-xs text-gray-500">Orders</p>
               </div>
               <div className="text-center border-l border-gray-100">
                  <div className="text-lg font-bold text-gray-900">
                     500+
                  </div>
                  <p className="text-xs text-gray-500">Reviews</p>
               </div>
            </div>
         </div>

         {/* About Section */}
         <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-20">
            <h3 className="font-bold text-gray-900 mb-2">About Astrologer</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
               {astrologer.profile?.bio || `Hello, I am ${astrologer.name}. I have extensive experience in Vedic astrology and verify all predictions with accuracy. Consult me for guidance on career, marriage, and finance.`}
            </p>
         </div>

         {/* Floating Action Bar */}
         <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-safe-or-4 z-50">
            <div className="container mx-auto max-w-md grid grid-cols-2 gap-3">
               <button
                 onClick={handleChatClick}
                 disabled={astrologer.profile?.isChatEnabled === false}
                 className={`flex flex-col items-center justify-center gap-1 border py-2.5 rounded-xl font-bold transition-all ${
                    astrologer.profile?.isChatEnabled === false
                      ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-white border-green-500 text-green-600 hover:bg-green-50 active:scale-95"
                 }`}
               >
                 <MessageCircle className="w-5 h-5" />
                 <span>Chat</span>
               </button>
               <button
                 onClick={handleAudioCall}
                 disabled={astrologer.profile?.isCallEnabled === false}
                 className={`flex flex-col items-center justify-center gap-1 border py-2.5 rounded-xl font-bold transition-all shadow-sm ${
                    astrologer.profile?.isCallEnabled === false
                      ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-orange-400 to-amber-500 text-white border-none hover:brightness-110 active:scale-95 shadow-orange-200"
                 }`}
               >
                 <Phone className="w-5 h-5" />
                 <span>Call</span>
               </button>
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
      <IntakeModal
        isOpen={showIntakeModal}
        onClose={() => setShowIntakeModal(false)}
        onCancel={() => setShowIntakeModal(false)}
        onSubmit={handleIntakeSubmit}
      />
    </div>
  );
};

export default AstrologerDetail;
