 // AstrologerDashboard.jsx
import { useState, useEffect, useRef } from "react";
import Modal from "../components/Modal";
import axios from "axios";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import ClientVideoCall from "./ClientcalltoAstrologerVideoCall";
import AudioCall from "./AudioCall";
import {
  Home,
  MessageCircle,
  Phone,
  DollarSign,
  User,
  Star,
  Zap,
  Users,
  Calendar,
  BarChart3,
  Bell,
  X,
} from "lucide-react";

const AstrologerDashboard = () => {
  const [activeTab, setActiveTab] = useState("inbox");
  const [inboxTab, setInboxTab] = useState("chat"); // 'chat' or 'video'
  const [profile, setProfile] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCallRoomId, setActiveCallRoomId] = useState(null);
  const [activeCallType, setActiveCallType] = useState("video");
  const [activeCallPeerId, setActiveCallPeerId] = useState(null);
  const [pendingSessions, setPendingSessions] = useState([]);
  const [pendingVideoCalls, setPendingVideoCalls] = useState([]);
  const [pendingAudioCalls, setPendingAudioCalls] = useState([]);
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState(0);
  const [showIncomingPopup, setShowIncomingPopup] = useState(false);
  const [incomingRequest, setIncomingRequest] = useState(null);
  const [requestQueue, setRequestQueue] = useState([]);

  const audioRef = useRef(null);
  const notificationSoundRef = useRef(null);
  const navigate = useNavigate();

  // Initialize notification sound
 useEffect(() => {
  const audio = new Audio("/notification.mp3");
  audio.preload = "auto";
  audio.volume = 1.0;
  notificationSoundRef.current = audio;
}, []);useEffect(() => {
  window.testNotificationSound = () => {
    if (notificationSoundRef.current) {
      notificationSoundRef.current.play()
        .then(() => console.log("Sound OK"))
        .catch(err => console.log("Sound Blocked:", err));
    } else {
      console.log("Audio ref missing");
    }
  };
}, []);


useEffect(() => {
  const unlock = () => {
    const btn = document.getElementById("unlock-audio");
    if (btn) btn.click();
    window.removeEventListener("click", unlock);
  };
  window.addEventListener("click", unlock);
}, []);


  // Initialize socket connection once
  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_API_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
    });

    newSocket.on("connect", () => {
      console.log("[Astrologer] Socket connected:", newSocket.id);
    });

    newSocket.on("connect_error", (err) => {
      console.error("[Astrologer] Socket connection error:", err);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    fetchProfile();
  }, []);

  // Setup socket listeners when socket is ready
  useEffect(() => {
    if (!socket) return;

    // Video call request
    socket.on("call:request", (data) => {
      console.log("Incoming call request:", data);

      const newVideoRequest = {
        id: `${data.fromId}_${Date.now()}`,
        type: "video",
        fromId: data.fromId,
        fromName: data.fromName || "Client",
        fromSocketId: data.fromSocketId,
        fromImage: data.fromImage,
        timestamp: new Date(),
        roomId: data.roomId,
        status: "pending"
      };

      setPendingVideoCalls((prev) => [...prev, newVideoRequest]);

      // Add to incoming popup queue
      addToRequestQueue(newVideoRequest);

      setNotifications((n) => n + 1);
      playNotificationSound();
    });

    // Chat request from client
    socket.on("chat:request", (payload) => {
      console.log("[Astrologer] Chat request received:", payload);

      const newChatRequest = {
        id: payload.sessionId || `${payload.userId?._id}_${Date.now()}`,
        type: "chat",
        fromId: payload.userId?._id,
        fromName: payload.userId?.name || "Client",
        fromSocketId: payload.socketId,
        sessionId: payload.sessionId,
        timestamp: new Date(),
        status: "pending"
      };

      // Add to pending sessions if not already there
      setPendingSessions((prev) => {
        const exists = prev.some(s => s.sessionId === payload.sessionId);
        if (!exists) {
          return [...prev, {
            sessionId: payload.sessionId,
            userId: payload.userId,
            client: payload.userId,
            createdAt: new Date(),
            ...newChatRequest
          }];
        }
        return prev;
      });

      // Add to incoming popup queue
      addToRequestQueue(newChatRequest);

      setNotifications((n) => n + 1);
      playNotificationSound();
    });

    // Audio call request
    socket.on("audio:request", (data) => {
      console.log("Incoming audio call request:", data);

      const newAudioRequest = {
        id: `${data.fromId}_${Date.now()}`,
        type: "audio",
        fromId: data.fromId,
        fromName: data.fromName || "Client",
        fromSocketId: data.fromSocketId,
        fromImage: data.fromImage,
        timestamp: new Date(),
        roomId: data.roomId,
        status: "pending"
      };

      setPendingAudioCalls((prev) => [...prev, newAudioRequest]);

      // Add to incoming popup queue
      addToRequestQueue(newAudioRequest);

      setNotifications((n) => n + 1);
      playNotificationSound();
    });

    return () => {
      socket.off("call:request");
      socket.off("chat:request");
      socket.off("audio:request");
    };
  }, [socket]);
useEffect(() => {
  window.testNotificationSound = () => {
    if (notificationSoundRef.current) {
      notificationSoundRef.current.play()
        .then(() => console.log("Sound played"))
        .catch(err => console.log("Sound blocked:", err));
    } else {
      console.log("Audio ref not ready");
    }
  };
}, []);

  useEffect(() => {
    if (profile?.userId && socket) {
      // Register astrologer in onlineUsers map
      socket.emit("user_online", { userId: profile.userId });
      fetchPendingSessions();
    }
  }, [profile?.userId, socket]);

  // Play notification sound
 // SUPER RELIABLE Notification Sound (works always when tab is open)
 const playNotificationSound = () => {
  const audio = notificationSoundRef.current;
  if (!audio) return;

  audio.pause();
  audio.currentTime = 0;

  audio.play()
    .then(() => {
      console.log("🔔 Sound played");
    })
    .catch(err => {
      console.warn("⚠️ Sound blocked:", err);
    });
};



  // Add request to queue and show popup
  const addToRequestQueue = (request) => {
    setRequestQueue((prev) => {
      const newQueue = [...prev, request];

      // If no popup is currently showing, show this one
      if (!showIncomingPopup) {
        setIncomingRequest(request);
        setShowIncomingPopup(true);
      }

      return newQueue;
    });
  };

  // Handle next request in queue
  const handleNextRequest = () => {
    setRequestQueue((prev) => {
      const [, ...remaining] = prev;

      if (remaining.length > 0) {
        setIncomingRequest(remaining[0]);
        setShowIncomingPopup(true);
        playNotificationSound();
      } else {
        setShowIncomingPopup(false);
        setIncomingRequest(null);
      }

      return remaining;
    });
  };

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/astrologer/profile`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setProfile(res.data);
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  useEffect(() => {
    if (activeTab === "inbox") {
      fetchPendingSessions();
    }
  }, [activeTab]);

  const fetchPendingSessions = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/chat/sessions/pending`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.data && Array.isArray(res.data)) {
        setPendingSessions(res.data);
      } else {
        setPendingSessions([]);
      }
    } catch (err) {
      console.error("Error fetching sessions:", err);
      setPendingSessions([]);
    }
  };

  const acceptCall = () => {
    if (!incomingCall || !socket) return;

    if (incomingCall.type === "chat") {
      socket.emit("chat:accept", { sessionId: incomingCall.callId });
      navigate(`/chat/${incomingCall.callId}`);
    } else if (incomingCall.type === "video") {
      const roomId = `video_${Date.now()}_${incomingCall.from}`;
      socket.emit("call:accept", {
        toSocketId: incomingCall.socketId,
        roomId
      });
      setActiveCallRoomId(roomId);
      setActiveTab("calls");
    }
    setIncomingCall(null);
  };

  const rejectCall = () => {
    if (incomingCall && socket) {
      if (incomingCall.type === "video") {
          socket.emit("call:reject", { toSocketId: incomingCall.socketId });
      } else {
          // Chat reject logic if needed
      }
    }
    setIncomingCall(null);
  };

  // Accept incoming request from popup
  const acceptIncomingRequest = (request) => {
    if (!socket) return;

    // Stop notification sound
    if (notificationSoundRef.current) {
      notificationSoundRef.current.pause();
      notificationSoundRef.current.currentTime = 0;
    }

    if (request.type === "chat") {
      socket.emit("chat:accept", { sessionId: request.sessionId });
      navigate(`/chat/${request.sessionId}`);
    } else if (request.type === "video") {
      const roomId = request.roomId || `video_${Date.now()}_${request.fromId}`;
      socket.emit("call:accept", {
        toSocketId: request.fromSocketId,
        roomId
      });
      setActiveCallRoomId(roomId);
      setActiveCallType("video");
      setActiveCallPeerId(request.fromSocketId);
      setActiveTab("calls");
    } else if (request.type === "audio") {
      const roomId = request.roomId || `audio_${Date.now()}_${request.fromId}`;
      socket.emit("audio:accept", {
        toSocketId: request.fromSocketId,
        roomId
      });
      setActiveCallRoomId(roomId);
      setActiveCallType("audio");
      setActiveCallPeerId(request.fromSocketId);
      setActiveTab("calls");
    }

    // Remove from pending lists
    if (request.type === "chat") {
      setPendingSessions(prev => prev.filter(s => s.sessionId !== request.sessionId));
    } else if (request.type === "video") {
      setPendingVideoCalls(prev => prev.filter(v => v.id !== request.id));
    } else if (request.type === "audio") {
      setPendingAudioCalls(prev => prev.filter(a => a.id !== request.id));
    }

    // Show next request in queue
    handleNextRequest();
  };

  // Reject incoming request from popup
  const rejectIncomingRequest = (request) => {
    if (!socket) return;

    // Stop notification sound
    if (notificationSoundRef.current) {
      notificationSoundRef.current.pause();
      notificationSoundRef.current.currentTime = 0;
    }

    // Emit reject event
    if (request.type === "chat") {
      socket.emit("chat:reject", { sessionId: request.sessionId });
    } else if (request.type === "video") {
      socket.emit("call:reject", { toSocketId: request.fromSocketId });
    } else if (request.type === "audio") {
      socket.emit("audio:reject", { toSocketId: request.fromSocketId });
    }

    // Remove from pending lists
    if (request.type === "chat") {
      setPendingSessions(prev => prev.filter(s => s.sessionId !== request.sessionId));
    } else if (request.type === "video") {
      setPendingVideoCalls(prev => prev.filter(v => v.id !== request.id));
    } else if (request.type === "audio") {
      setPendingAudioCalls(prev => prev.filter(a => a.id !== request.id));
    }

    // Show next request in queue
    handleNextRequest();
  };

  // Close popup without action
  const closeIncomingPopup = () => {
    if (notificationSoundRef.current) {
      notificationSoundRef.current.pause();
      notificationSoundRef.current.currentTime = 0;
    }
    handleNextRequest();
  };

  const toggleStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/astrologer/status`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProfile(res.data);
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  // ACCEPT CHAT FROM LIST
  const acceptChat = (sessionId) => {
    if (!socket) {
      alert("Connection not ready. Please wait a moment and try again.");
      window.location.reload();
      return;
    }

    if (!socket.connected) {
      alert("Connection lost. Reconnecting...");
      window.location.reload();
      return;
    }

    console.log("[Astrologer] Accepting chat session:", sessionId);
    socket.emit("chat:accept", { sessionId });
    navigate(`/chat/${sessionId}`);
  };

  // REJECT CHAT FROM LIST
  const rejectChat = async (sessionId) => {
    if (socket && socket.connected) {
      socket.emit("chat:reject", { sessionId });
    }

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/chat/debug/all`,
        { sessionId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPendingSessions((prev) =>
        prev.filter((s) => s.sessionId !== sessionId)
      );
    } catch (err) {
      console.error("Error rejecting chat:", err);
      alert("Failed to reject chat. Please try again.");
    }
  };

  const menuItems = [
    {
      id: "overview",
      icon: Home,
      label: "Overview",
      color: "from-blue-500 to-cyan-500",
      badge: null,
    },
    {
      id: "inbox",
      icon: MessageCircle,
      label: "Inbox",
      color: "from-purple-500 to-pink-500",
      badge: pendingSessions.length + pendingVideoCalls.length + pendingAudioCalls.length,
    },
    {
      id: "calls",
      icon: Phone,
      label: "Calls",
      color: "from-green-500 to-emerald-500",
      badge: null,
    },
    {
      id: "earnings",
      icon: DollarSign,
      label: "Earnings",
      color: "from-yellow-500 to-orange-500",
      badge: null,
    },
    {
      id: "clients",
      icon: Users,
      label: "Clients",
      color: "from-indigo-500 to-blue-500",
      badge: null,
    },
    {
      id: "schedule",
      icon: Calendar,
      label: "Schedule",
      color: "from-red-500 to-pink-500",
      badge: null,
    },
    {
      id: "analytics",
      icon: BarChart3,
      label: "Analytics",
      color: "from-teal-500 to-green-500",
      badge: null,
    },
    {
      id: "profile",
      icon: User,
      label: "Profile",
      color: "from-gray-600 to-gray-800",
      badge: null,
    },
  ];

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-500 mx-auto mb-4"></div>
          <p className="text-purple-200 text-lg">Connecting to cosmic energies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Incoming Request Popup */}
    { window.testNotificationSound()
    }

      {showIncomingPopup && incomingRequest && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fadeIn">
          <div className="bg-gradient-to-br from-purple-700 via-pink-700 to-blue-700 text-white p-6 md:p-8 rounded-3xl shadow-2xl text-center max-w-md w-full animate-slideInUp border-2 border-white/30 relative">
            {/* Close button */}
            <button
              onClick={closeIncomingPopup}
              className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>

            <div className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm animate-pulse">
              <div className="text-3xl">
                {incomingRequest.type === "chat" ? "💬" :
                 incomingRequest.type === "video" ? "📹" : "🎙️"}
              </div>
            </div>

            <h2 className="text-xl md:text-2xl font-bold mb-2">
              Incoming {incomingRequest.type === "chat" ? "Chat" :
                       incomingRequest.type === "video" ? "Video Call" : "Audio Call"}
            </h2>

            <div className="flex items-center justify-center mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center mr-3">
                <User size={20} />
              </div>
              <div className="text-left">
                <p className="font-bold text-lg">{incomingRequest.fromName}</p>
                <p className="text-white/80 text-sm">
                  {incomingRequest.type === "chat" ? "wants to chat with you" :
                   incomingRequest.type === "video" ? "requesting video consultation" :
                   "requesting audio consultation"}
                </p>
              </div>
            </div>

            <div className="text-sm text-white/60 mb-6">
              Requested just now
              {requestQueue.length > 1 && (
                <span className="ml-2 bg-white/20 px-2 py-1 rounded-full">
                  +{requestQueue.length - 1} more in queue
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => rejectIncomingRequest(incomingRequest)}
                className="flex-1 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-6 py-3 rounded-2xl font-bold transition-all transform hover:scale-105 shadow-lg flex items-center justify-center"
              >
                <span className="mr-2">❌</span>
                Reject
              </button>
              <button
                onClick={() => acceptIncomingRequest(incomingRequest)}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-2xl font-bold transition-all transform hover:scale-105 shadow-lg flex items-center justify-center animate-pulse"
              >
                <span className="mr-2">
                  {incomingRequest.type === "chat" ? "💬" : "📞"}
                </span>
                Accept {incomingRequest.type === "chat" ? "Chat" : "Call"}
              </button>
            </div>

            <div className="mt-4 text-xs text-white/50">
              Auto-decline in 30 seconds
            </div>
          </div>
        </div>
      )}

      {/* Old Incoming Call Modal (kept for backward compatibility) */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-purple-600 to-pink-600 text-white p-8 rounded-3xl shadow-2xl text-center max-w-sm w-full animate-scale-in">
            <div className="w-24 h-24 mx-auto mb-6 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <div className="text-4xl">
                {incomingCall.type === "chat" ? "💬" : "📞"}
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2">
              Incoming {incomingCall.type === "chat" ? "Chat" : "Video Call"}
            </h2>
            <p className="text-purple-100 mb-6">from {incomingCall.name}</p>

            <div className="flex gap-4 justify-center">
              <button
                onClick={rejectCall}
                className="bg-red-500 text-white px-8 py-4 rounded-2xl font-bold hover:bg-red-600 transform hover:scale-105 transition-all shadow-lg"
              >
                Reject
              </button>
              <button
                onClick={acceptCall}
                className="bg-green-500 text-white px-8 py-4 rounded-2xl font-bold hover:bg-green-600 transform hover:scale-105 transition-all shadow-lg animate-pulse"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white p-6">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">Cosmic Dashboard</h1>
              <p className="text-purple-200">
                Welcome back, Master {profile.name}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Notification Bell with Count */}
              <div className="relative">
                <button
                  onClick={() => setActiveTab("inbox")}
                  className="relative p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <Bell className="w-6 h-6" />
                  {(pendingSessions.length + pendingVideoCalls.length + pendingAudioCalls.length) > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                      {pendingSessions.length + pendingVideoCalls.length + pendingAudioCalls.length}
                    </span>
                  )}
                </button>
              </div>
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <User className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Status Card */}
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 border border-white/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-4 h-4 rounded-full ${
                    profile.isOnline ? "bg-green-400 animate-pulse" : "bg-red-400"
                  }`}
                ></div>
                <span className="font-semibold">
                  {profile.isOnline ? "Online & Available" : "Offline & Meditating"}
                </span>
                {profile.isOnline && (
                  <span className="text-xs bg-green-500/30 px-2 py-1 rounded-full">
                    🔔 Incoming notifications enabled
                  </span>
                )}
              </div>
              <button
                onClick={toggleStatus}
                className={`px-6 py-2 rounded-xl font-bold text-white transition-all transform hover:scale-105 ${
                  profile.isOnline
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-green-500 hover:bg-green-600"
                }`}
              >
                {profile.isOnline ? "Go Offline" : "Go Online"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="container mx-auto px-4 -mt-6 mb-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-4 shadow-lg text-center">
            <div className="text-2xl font-bold text-purple-600">{pendingSessions.length + pendingVideoCalls.length + pendingAudioCalls.length}</div>
            <div className="text-xs text-gray-600">Pending Requests</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-lg text-center">
            <div className="text-2xl font-bold text-green-600">₹2,847</div>
            <div className="text-xs text-gray-600">Earnings</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-lg text-center">
            <div className="text-2xl font-bold text-blue-600">4.8</div>
            <div className="text-xs text-gray-600">Rating</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-20">
        {/* Grid Menu */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative bg-white rounded-2xl p-4 shadow-lg text-center transition-all transform hover:scale-105 ${
                  activeTab === item.id ? "ring-2 ring-purple-500" : ""
                }`}
              >
                <div
                  className={`w-12 h-12 mx-auto mb-2 bg-gradient-to-r ${item.color} rounded-2xl flex items-center justify-center`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-xs font-semibold text-gray-700">
                  {item.label}
                </div>
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-3xl shadow-xl p-6 min-h-[400px]">
          {activeTab === "overview" && (
            <div>
              {/* ... your overview content ... */}
            </div>
          )}

          {activeTab === "inbox" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">
                    Pending Requests
                  </h3>
                  {(pendingSessions.length + pendingVideoCalls.length + pendingAudioCalls.length) > 0 && (
                    <span className="bg-red-500 text-white text-sm px-3 py-1 rounded-full animate-pulse">
                      {pendingSessions.length + pendingVideoCalls.length + pendingAudioCalls.length} New
                    </span>
                  )}
                </div>

                {/* Sound Controls */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>🔔</span>
                  <span>Notifications enabled</span>
                </div>
              </div>

              {/* Sub-tabs for Chat and Video */}
              <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto">
                <button
                  onClick={() => setInboxTab("chat")}
                  className={`px-6 py-3 font-semibold transition-all whitespace-nowrap ${
                    inboxTab === "chat"
                      ? "text-purple-600 border-b-2 border-purple-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  💬 Chat Requests ({pendingSessions.length})
                </button>
                <button
                  onClick={() => setInboxTab("video")}
                  className={`px-6 py-3 font-semibold transition-all whitespace-nowrap ${
                    inboxTab === "video"
                      ? "text-green-600 border-b-2 border-green-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  📹 Video Calls ({pendingVideoCalls.length})
                </button>
                <button
                  onClick={() => setInboxTab("audio")}
                  className={`px-6 py-3 font-semibold transition-all whitespace-nowrap ${
                    inboxTab === "audio"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  🎙️ Audio Calls ({pendingAudioCalls.length})
                </button>
              </div>
<button
  id="unlock-audio"
  onClick={() => {
    if (notificationSoundRef.current) {
      notificationSoundRef.current.play().then(() => {
        notificationSoundRef.current.pause();
        notificationSoundRef.current.currentTime = 0;
        console.log("🔓 Audio unlocked");
      });
    }
  }}
  className="hidden"
>
  Unlock Audio
</button>

              {/* Chat Requests Tab */}
              {inboxTab === "chat" && (
                <div>
                  {pendingSessions.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">✨</div>
                      <p className="text-gray-500 text-lg">No pending chat requests</p>
                      <p className="text-gray-400">
                        Clients will appear here when they request chat consultations
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingSessions.map((session) => {
                        const timeAgo = () => {
                          const now = new Date();
                          const created = new Date(session.createdAt);
                          const diffMs = now - created;
                          const diffMins = Math.floor(diffMs / 60000);
                          const diffHours = Math.floor(diffMins / 60);
                          const diffDays = Math.floor(diffHours / 24);

                          if (diffDays > 0) return `${diffDays}d ago`;
                          if (diffHours > 0) return `${diffHours}h ago`;
                          if (diffMins > 0) return `${diffMins}m ago`;
                          return "Just now";
                        };

                        return (
                          <div
                            key={session.sessionId}
                            className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-6"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-bold text-gray-800">
                                  {session.userId?.name ||
                                    session.client?.name ||
                                    "Mysterious Client"}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Waiting for your cosmic guidance...
                                </p>
                                <p className="text-xs text-purple-600 mt-1">
                                  Requested {timeAgo()}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => rejectChat(session.sessionId)}
                                  className="bg-red-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-600 transition-all transform hover:scale-105"
                                >
                                  Reject
                                </button>
                                <button
                                  onClick={() => acceptChat(session.sessionId)}
                                  className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition-all transform hover:scale-105"
                                >
                                  Accept Chat
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Video Call Requests Tab */}
              {inboxTab === "video" && (
                <div>
                  {pendingVideoCalls.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">📹</div>
                      <p className="text-gray-500 text-lg">No pending video call requests</p>
                      <p className="text-gray-400">
                        Clients will appear here when they request video consultations
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingVideoCalls.map((call) => {
                        const timeAgo = () => {
                          const now = new Date();
                          const created = new Date(call.timestamp);
                          const diffMs = now - created;
                          const diffMins = Math.floor(diffMs / 60000);
                          const diffHours = Math.floor(diffMins / 60);

                          if (diffHours > 0) return `${diffHours}h ago`;
                          if (diffMins > 0) return `${diffMins}m ago`;
                          return "Just now";
                        };

                        return (
                          <div
                            key={call.id}
                            className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-bold text-gray-800">
                                  {call.fromName || "Client"}
                                </p>
                                <p className="text-sm text-gray-600">
                                  📞 Requesting video consultation...
                                </p>
                                <p className="text-xs text-green-600 mt-1">
                                  Requested {timeAgo()}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    if (socket) {
                                      socket.emit("call:reject", { toSocketId: call.fromSocketId });
                                    }
                                    setPendingVideoCalls((prev) => prev.filter((c) => c.id !== call.id));
                                  }}
                                  className="bg-red-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-600 transition-all transform hover:scale-105"
                                >
                                  Reject
                                </button>
                                <button
                                  onClick={() => {
                                    if (socket) {
                                      const roomId = call.roomId || `video_${Date.now()}_${call.fromId}`;
                                      socket.emit("call:accept", {
                                        toSocketId: call.fromSocketId,
                                        roomId
                                      });
                                      setActiveCallRoomId(roomId);
                                      setActiveTab("calls");
                                    }
                                    setPendingVideoCalls((prev) => prev.filter((c) => c.id !== call.id));
                                  }}
                                  className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition-all transform hover:scale-105"
                                >
                                  Accept Call
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Audio Call Requests Tab */}
              {inboxTab === "audio" && (
                <div>
                  {pendingAudioCalls.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🎙️</div>
                      <p className="text-gray-500 text-lg">No pending audio call requests</p>
                      <p className="text-gray-400">
                        Clients will appear here when they request audio consultations
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingAudioCalls.map((call) => {
                        const timeAgo = () => {
                          const now = new Date();
                          const created = new Date(call.timestamp);
                          const diffMs = now - created;
                          const diffMins = Math.floor(diffMs / 60000);
                          const diffHours = Math.floor(diffMins / 60);

                          if (diffHours > 0) return `${diffHours}h ago`;
                          if (diffMins > 0) return `${diffMins}m ago`;
                          return "Just now";
                        };

                        return (
                          <div
                            key={call.id}
                            className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-bold text-gray-800">
                                  {call.fromName || "Client"}
                                </p>
                                <p className="text-sm text-gray-600">
                                  🎧 Requesting audio consultation...
                                </p>
                                <p className="text-xs text-blue-600 mt-1">
                                  Requested {timeAgo()}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    if (socket) {
                                      socket.emit("audio:reject", { toSocketId: call.fromSocketId });
                                    }
                                    setPendingAudioCalls((prev) => prev.filter((c) => c.id !== call.id));
                                  }}
                                  className="bg-red-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-600 transition-all transform hover:scale-105"
                                >
                                  Reject
                                </button>
                                <button
                                  onClick={() => {
                                    if (socket) {
                                      const roomId = call.roomId || `audio_${Date.now()}_${call.fromId}`;
                                      socket.emit("audio:accept", {
                                        toSocketId: call.fromSocketId,
                                        roomId
                                      });
                                      setActiveCallRoomId(roomId);
                                      setActiveCallType("audio");
                                      setActiveCallPeerId(call.fromSocketId);
                                      setActiveTab("calls");
                                    }
                                    setPendingAudioCalls((prev) => prev.filter((c) => c.id !== call.id));
                                  }}
                                  className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition-all transform hover:scale-105"
                                >
                                  Accept Call
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "calls" && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">
                  {activeCallType === "video" ? "Video" : "Audio"} Call Studio
                </h3>
              </div>
              {activeCallType === "video" ? (
                <ClientVideoCall roomId={activeCallRoomId} />
              ) : (
                <AudioCall
                    roomId={activeCallRoomId}
                    socket={socket}
                    peerSocketId={activeCallPeerId}
                />
              )}
            </div>
          )}

          {activeTab === "profile" && (
            <div>
              {/* ... your existing profile content ... */}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation Bar (Mobile) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 md:hidden z-40">
        <div className="grid grid-cols-5 gap-2">
          {menuItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex flex-col items-center p-2 rounded-xl transition-all ${
                  activeTab === item.id
                    ? "bg-purple-100 text-purple-600"
                    : "text-gray-600"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs mt-1">{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Hidden audio element for notification sound */}
 <audio ref={notificationSoundRef} src="/notification.mp3" preload="auto"></audio>


      {/* Add custom CSS animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInUp {
          from {
            transform: translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes scaleIn {
          from {
            transform: scale(0.8);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideInUp {
          animation: slideInUp 0.4s ease-out;
        }
        .animate-scale-in {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AstrologerDashboard;