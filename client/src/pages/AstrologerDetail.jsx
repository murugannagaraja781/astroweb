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
import socketManager from "../utils/socketManager";

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
  // ============================
  // SOCKET SETUP (CLIENT SIDE)
  // ============================
  useEffect(() => {
    // Determine if we are the user (Client) or just viewing
    // Socket connection is global, so we just attach listeners

    // We can get the socket instance from manager, or use manager's helper methods if available
    // But since the original code used 'socket' state, let's keep it but set it from manager

    // Actually, better to just use socketManager directly for listeners
    // But we need 'socket' state for VideoCall component props

    if (!user?.name) return;

    const s = socketManager.connect(import.meta.env.VITE_API_URL); // Should already be connected from App.jsx
    setSocket(s);

    console.log("[Client] Using global socket:", s.id);

    // Register listeners
    const onChatAccepted = ({ sessionId }) => {
      console.log("[Client] Chat accepted → redirecting...", sessionId);
      setWaiting(false);
      setLastSessionId(sessionId);
      navigate(`/chat/${sessionId}`);
    };

    const onChatRejected = ({ sessionId }) => {
      console.log("[Client] Chat rejected for session", sessionId);
      setWaiting(false);
      alert("Astrologer rejected your chat request.");
    };

    const onCallAccepted = ({ roomId, fromSocketId }) => {
      console.log("Video call accepted:", roomId, fromSocketId);
      setWaiting(false);
      setVideoRoomId(roomId);
      setPeerSocketId(fromSocketId);
      setShowVideoCall(true);
    };

    const onCallRejected = () => {
      setWaiting(false);
      alert("Astrologer is busy or rejected the call.");
    };

    const onCallOffline = () => {
      setWaiting(false);
      alert("Astrologer is offline or unreachable.");
    };

    const onAudioAccepted = ({ roomId, fromSocketId }) => {
      console.log("Audio call accepted:", roomId, fromSocketId);
      setWaiting(false);
      setAudioRoomId(roomId);
      setAudioPeerSocketId(fromSocketId);
      setShowAudioCall(true);
    };

    const onAudioRejected = () => {
      setWaiting(false);
      alert("Astrologer rejected the audio call.");
    };

    socketManager.on("chat:accepted", onChatAccepted);
    socketManager.on("chat:rejected", onChatRejected);
    socketManager.on("call:accepted", onCallAccepted);
    socketManager.on("call:rejected", onCallRejected);
    socketManager.on("call:offline", onCallOffline);
    socketManager.on("audio:accepted", onAudioAccepted);
    socketManager.on("audio:rejected", onAudioRejected);

    return () => {
      socketManager.off("chat:accepted", onChatAccepted);
      socketManager.off("chat:rejected", onChatRejected);
      socketManager.off("call:accepted", onCallAccepted);
      socketManager.off("call:rejected", onCallRejected);
      socketManager.off("call:offline", onCallOffline);
      socketManager.off("audio:accepted", onAudioAccepted);
      socketManager.off("audio:rejected", onAudioRejected);
      // Do NOT disconnect global socket
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

        socketManager.emit("call:request", {
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

        socketManager.emit("audio:request", {
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
        socketManager.emit("chat:request", {
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
    <div className="min-h-screen bg-gray-50 pb-24 font-sans text-gray-800">
      {/* 1. Header (Reference Style) */}
      <div className="sticky top-0 z-50 bg-[#FFD700] px-4 py-3 flex items-center justify-between shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="p-1 rounded-full hover:bg-black/10 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-black" />
        </button>
        <h1 className="font-bold text-lg text-black">Rise Astro</h1>
        <button className="flex items-center gap-1 px-3 py-1 bg-white/20 border border-black/5 rounded-full text-xs font-bold text-black hover:bg-white/30 transition-colors">
            <Zap size={14} className="fill-current" /> Share
        </button>
      </div>

      <div className="px-4 pt-4 space-y-4">
          {/* 2. Profile Card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative">
             <div className="absolute top-4 right-4 text-gray-400">
                 <Users size={20} /> {/* Using Users as placeholder for 3-dots if MoreVertical not imported */}
             </div>

             <div className="flex gap-4">
                 {/* Avatar */}
                 <div className="relative">
                    <div className="w-20 h-20 rounded-full p-0.5 border-2 border-green-500">
                       <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                          {astrologer.avatar ? (
                             <img src={astrologer.avatar} alt={astrologer.name} className="w-full h-full object-cover" />
                          ) : (
                             <span className="text-xl font-bold text-gray-400">{getInitials(astrologer.name)}</span>
                          )}
                       </div>
                    </div>
                 </div>

                 {/* Details */}
                 <div className="flex-1 pt-1">
                     <h2 className="text-lg font-bold text-gray-900 flex items-center gap-1">
                        {astrologer.name}
                        <div className="bg-blue-500 rounded-full p-0.5">
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
                        </div>
                     </h2>
                     <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{astrologer.profile?.specialties?.join(", ") || "Vedic, Prasana"}</p>
                     <p className="text-xs text-gray-500 mt-0.5">{astrologer.profile?.languages?.join(", ") || "English, Tamil"}</p>
                     <p className="text-xs text-gray-500 mt-0.5">Experience : {astrologer.profile?.experience || 1} Years</p>

                     <div className="flex items-center gap-2 mt-2">
                         <span className="text-xs font-bold text-red-500">FREE</span>
                         <span className="text-xs text-gray-400 line-through">₹{astrologer.profile?.ratePerMinute || 20}/min</span>
                     </div>

                     <button className="mt-3 bg-[#1DA1F2] hover:bg-[#1a91da] text-white text-[10px] font-bold px-6 py-1.5 rounded-full transition-colors">
                        Follow
                     </button>
                 </div>
             </div>

             {/* Stats Divider */}
             <div className="flex items-center justify-around mt-4 pt-3 border-t border-gray-100">
                 <div className="flex items-center gap-1.5 grayscale opacity-60">
                     <MessageCircle size={14} className="fill-current" />
                     <span className="text-xs font-medium">0 Mins</span>
                 </div>
                 <div className="flex items-center gap-1.5 grayscale opacity-60">
                     <Phone size={14} className="fill-current" />
                     <span className="text-xs font-medium">0 mins</span>
                 </div>
             </div>
          </div>

          {/* 3. About Section */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
             <h3 className="text-sm font-bold text-gray-900 mb-2">About Astrologer</h3>
             <p className="text-xs text-gray-500 leading-relaxed line-clamp-4">
                 {astrologer.profile?.bio || `[6:25 pm, 31/5/2025] Astrologer ${astrologer.name}: If someone asks the same question over and over again, you can predict based on...`}
             </p>
             <button className="text-[#1DA1F2] text-xs font-bold mt-1">...Show More</button>
          </div>

          {/* 4. Rating & Reviews */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
               <div className="flex items-center justify-between mb-4">
                   <h3 className="font-bold text-sm text-gray-900">Rating & Reviews</h3>
                   <ArrowLeft className="rotate-180 w-4 h-4 text-gray-400" />
               </div>

               <div className="flex gap-6 items-center">
                   <div className="text-center w-20">
                       <div className="text-4xl font-bold text-gray-800 tracking-tighter">5.00</div>
                       <div className="flex justify-center gap-0.5 my-1">
                           {[1,2,3,4,5].map(i => <Star key={i} size={10} className="fill-green-600 text-green-600" />)}
                       </div>
                       <div className="flex items-center justify-center gap-1 text-[10px] text-gray-400">
                           <Users size={10} /> 320 orders
                       </div>
                   </div>

                   <div className="flex-1 space-y-1.5">
                       {[5, 4, 3, 2, 1].map((star, idx) => (
                           <div key={star} className="flex items-center gap-2">
                               <span className="text-[10px] font-bold text-gray-500 w-2">{star}</span>
                               <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                   <div
                                     className="h-full bg-gray-400 rounded-full"
                                     style={{ width: idx === 0 ? '80%' : idx === 1 ? '10%' : '5%' }}
                                   ></div>
                               </div>
                           </div>
                       ))}
                   </div>
               </div>
          </div>
      </div>

      {/* Floating Elements (Balance) */}
      <div className="fixed bottom-24 right-4 z-30">
        <div className="bg-slate-800 text-white px-3 py-1.5 rounded-lg shadow-lg text-xs font-semibold opacity-80 backdrop-blur-sm">
          Bal: ₹{balance}
        </div>
      </div>

      {/* 5. Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 flex gap-3 z-50 pb-safe">
         <button
            onClick={requestChat}
            disabled={!astrologer.isChatAvailable}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all border-2
            ${astrologer.isChatAvailable
                ? 'border-green-500 text-green-600 active:bg-green-50'
                : 'border-gray-200 text-gray-400 cursor-not-allowed'}`}
         >
            <MessageCircle size={18} />
            Chat
         </button>

         <button
            onClick={handleVideoCall}
             disabled={!astrologer.isVideoCallAvailable}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all text-white
             ${astrologer.isVideoCallAvailable
                ? 'bg-green-500 hover:bg-green-600 shadow-lg shadow-green-200'
                : 'bg-gray-300 cursor-not-allowed'}`}
         >
            <Phone size={18} />
            Call
         </button>
      </div>

      {/* Modals & Popups (Logic Preserved) */}
      {waiting && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm text-center animate-bounce-subtle">
            <div className="w-16 h-16 mx-auto mb-4 relative">
               <div className="absolute inset-0 bg-yellow-100 rounded-full animate-ping opacity-75"></div>
               <div className="relative bg-yellow-400 rounded-full p-4 text-white">
                 <Zap size={32} className="animate-pulse" />
               </div>
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">Connecting...</h4>
            <p className="text-sm text-gray-500 mb-6">
              Please wait while we connect you to {astrologer.name}
            </p>
            <button
               onClick={() => setWaiting(false)}
               className="text-red-500 font-bold text-sm px-6 py-2 rounded-full hover:bg-red-50 transition-colors"
            >
               Cancel Request
            </button>
          </div>
        </div>
      )}

      {showMissedPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm text-center">
             <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock size={32} />
             </div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">Missed Call</h4>
            <p className="text-sm text-gray-500 mb-6">
              Astrologer did not respond in time. Please try again later.
            </p>
            <button
              onClick={() => setShowMissedPopup(false)}
              className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>

  );
};

export default AstrologerDetail;
