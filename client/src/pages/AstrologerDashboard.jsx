// AstrologerDashboard.jsx
import { useState, useEffect, useRef, useCallback, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import VideoCall from "../components/VideoCall";
import ChartModal from "../components/ChartModal";
import AstrologyQuickMenu from "../components/AstrologyQuickMenu";
import AuthContext from "../context/AuthContext";
import {
  Home,
  MessageCircle,
  Phone,
  DollarSign,
  User,
  Star,
  Zap,
  Sparkles,
  Users,
  Calendar,
  BarChart3,
  Bell,
  X,
} from "lucide-react";
import socketManager from "../utils/socketManager";

const AstrologerDashboard = () => {
  const [activeTab, setActiveTab] = useState("inbox");
  const [inboxTab, setInboxTab] = useState("chat"); // 'chat' or 'video'
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCallRoomId, setActiveCallRoomId] = useState(null);
  const [activeCallType, setActiveCallType] = useState(null); // 'video' or 'audio'
  const [activeCallPeerId, setActiveCallPeerId] = useState(null);
  const [activeCallPeerName, setActiveCallPeerName] = useState(null);
  const [pendingSessions, setPendingSessions] = useState([]);
  const [pendingVideoCalls, setPendingVideoCalls] = useState([]);
  const [pendingAudioCalls, setPendingAudioCalls] = useState([]);
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState(0);
  const [showIncomingPopup, setShowIncomingPopup] = useState(false);
  const [incomingRequest, setIncomingRequest] = useState(null);
  const [requestQueue, setRequestQueue] = useState([]);
  const [showOfflinePopup, setShowOfflinePopup] = useState(false);
  const [earnings, setEarnings] = useState(0);
  const [showChartModal, setShowChartModal] = useState(false);
  const [selectedChart, setSelectedChart] = useState(null);
  const [showChatPanel, setShowChatPanel] = useState(false);

  const notificationSoundRef = useRef(null);
  const navigate = useNavigate();

  // Initialize notification sound
  useEffect(() => {
    const soundUrls = [
      "/notification.mp3",
      "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3",
      "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGS57OihUBELTKXh8bllHAU2jdXvzn0vBSh+zPDajzsKElyx6OyrWBUIQ5zd8sFuJAUuhM/z24k2Bxdju+zpoVIRC0um4PG5ZRwFN43V78+ALwUnfszw2o87ChJcr+jrq1kVCEKb3fK/bSQFL4XP89uJNgcXY7vs6aFSEQtLpuDxuWUcBTeN1e/PgC8FJ37M8NqPOwsSXK/o66tZFQhCm93yv20kBS+Fz/PbiTYHF2O77OmhUhELS6bg8bllHAU3jdXvz4AvBSd+zPDajzsKElyx6OyrWRUIQpvd8r9tJAUvhc/z24k2Bxdju+zpoVIRC0um4PG5ZRwFN43V78+ALwUnfszw2o87ChJcr+jrq1kVCEKb3fK/bSQFL4XP89uJNgcXY7vs6aFSEQtLpuDxuWUcBTeN1e/PgC8FJ37M8NqPOwsSXK/o66tZFQhCm93yv20kBS+Fz/PbiTYHF2O77OmhUhELS6bg8bllHAU3jdXvz4AvBSd+zPDajzsKElyx6OyrWRUIQpvd8r9tJAUvhc/z24k2Bxdju+zpoVIRC0um4PG5ZRwFN43V78+ALwUnfszw2o87ChJcr+jrq1kVCEKb3fK/bSQFL4XP89uJNgcXY7vs6aFSEQtLpuDxuWUcBTeN1e/PgC8FJ37M8NqPOwsSXK/o66tZFQhCm93yv20kBS+Fz/PbiTYHF2O77OmhUhELS6bg8bllHAU3jdXvz4AvBSd+zPDajzsKElyx6OyrWRUIQpvd8r9tJAUvhc/z24k2Bxdju+zpoVIRC0um4PG5ZRwFN43V78+ALwUnfszw2o87ChJcr+jrq1kVCEKb3fK/bSQFL4XP89uJNgcXY7vs6aFSEQtLpuDxuWUcBTeN1e/PgC8FJ37M8NqPOwsSXK/o66tZFQhCm93yv20kBS+Fz/PbiTYHF2O77OmhUhELS6bg8bllHAU3jdXvz4AvBSd+zPDajzsKElyx6OyrWRUIQpvd8r9tJAUvhc/z24k2Bxdju+zpoVIRC0um4PG5ZRwFN43V78+ALwUnfszw2o87ChJcr+jrq1kVCEKb3fK/bSQFL4XP89uJNgcXY7vs6Q=="
    ];

    const tryLoadSound = (index = 0) => {
      if (index >= soundUrls.length) return;
      const audio = new Audio(soundUrls[index]);
      audio.preload = "auto";
      audio.volume = 1.0;
      audio.addEventListener('canplaythrough', () => {
        notificationSoundRef.current = audio;
      });
      audio.addEventListener('error', () => tryLoadSound(index + 1));
      audio.load();
    };
    tryLoadSound();

    return () => {
      if (notificationSoundRef.current) {
        notificationSoundRef.current.pause();
        notificationSoundRef.current = null;
      }
    };
  }, []);

  // Unlock audio
  useEffect(() => {
    const unlock = () => {
      const btn = document.getElementById("unlock-audio");
      if (btn) btn.click();
      window.removeEventListener("click", unlock);
    };
    window.addEventListener("click", unlock);
  }, []);

  // Initialize socket
  useEffect(() => {
    const newSocket = socketManager.connect(import.meta.env.VITE_API_URL);
    setSocket(newSocket);

    const onConnect = () => {
         const registrationId = user?.id || profile?.userId?._id || profile?.userId;
         if (registrationId) {
            newSocket.emit("user_online", { userId: registrationId });
         }
    };

    newSocket.on("connect", onConnect);
    if (newSocket.connected) onConnect();

    return () => {
      newSocket.off("connect", onConnect);
    };
  }, [user, profile]);

  const fetchPendingSessions = useCallback(async () => {
    if (!navigator.onLine) return;
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/chat/sessions/pending`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data && Array.isArray(res.data)) {
        setPendingSessions(prev => {
          const isSame = JSON.stringify(prev) === JSON.stringify(res.data);
          return isSame ? prev : res.data;
        });
      } else {
        setPendingSessions(prev => (prev.length === 0 ? prev : []));
      }
    } catch (err) {
      console.error("Error fetching sessions:", err);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchEarnings();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on("call:request", (data) => {
      const myId = profile?.userId?._id || profile?.userId;
      if (data.astrologerId && String(data.astrologerId) !== String(myId)) return;

      const newVideoRequest = {
        id: `${data.fromId}_${Date.now()}`,
        type: "video",
        fromId: data.fromId,
        fromName: data.fromName || "Client",
        fromSocketId: data.fromSocketId,
        fromImage: data.fromImage,
        timestamp: new Date(),
        roomId: data.roomId,
        status: "pending",
        callId: data.callId
      };

      setPendingVideoCalls((prev) => [...prev, newVideoRequest]);
      addToRequestQueue(newVideoRequest);
      setNotifications((n) => n + 1);
      playNotificationSound();
    });

    socket.on("chat:request", (payload) => {
      const myId = profile?.userId?._id || profile?.userId;
      if (payload.astrologerId && String(payload.astrologerId) !== String(myId)) return;

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

      addToRequestQueue(newChatRequest);
      setNotifications((n) => n + 1);
      playNotificationSound();
    });

    socket.on("audio:request", (data) => {
      const myId = profile?.userId?._id || profile?.userId;
      if (data.astrologerId && String(data.astrologerId) !== String(myId)) return;

      const newAudioRequest = {
        id: `${data.fromId}_${Date.now()}`,
        type: "audio",
        fromId: data.fromId,
        fromName: data.fromName || "Client",
        fromSocketId: data.fromSocketId,
        fromImage: data.fromImage,
        timestamp: new Date(),
        roomId: data.roomId,
        status: "pending",
        callId: data.callId
      };

      setPendingAudioCalls((prev) => [...prev, newAudioRequest]);
      addToRequestQueue(newAudioRequest);
      setNotifications((n) => n + 1);
      playNotificationSound();
    });

    return () => {
      socket.off("call:request");
      socket.off("chat:request");
      socket.off("audio:request");
    };
  }, [socket, fetchPendingSessions, profile]);

  useEffect(() => {
    if (profile?.userId && socket) {
      socket.emit("user_online", { userId: profile.userId });
      fetchPendingSessions();
    }
  }, [profile?.userId, socket, fetchPendingSessions]);

  const playNotificationSound = () => {
    const audio = notificationSoundRef.current;
    if (!audio) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('New Request');
        }
        return;
    }
    audio.pause();
    audio.currentTime = 0;
    audio.play().catch(console.warn);
    if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
  };

  const addToRequestQueue = (request) => {
    setRequestQueue((prev) => [...prev, request]);
  };

  const [autoDeclineTimer, setAutoDeclineTimer] = useState(30);

  useEffect(() => {
    if (!showIncomingPopup && requestQueue.length > 0) {
      setIncomingRequest(requestQueue[0]);
      setShowIncomingPopup(true);
      setAutoDeclineTimer(30);
      playNotificationSound();
      if ('vibrate' in navigator) navigator.vibrate([400, 200, 400, 200, 400]);
    }
  }, [requestQueue, showIncomingPopup]);

  useEffect(() => {
    if (!showIncomingPopup || !incomingRequest) return;
    const timer = setInterval(() => {
      setAutoDeclineTimer((prev) => {
        if (prev <= 1) {
          rejectIncomingRequest(incomingRequest);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [showIncomingPopup, incomingRequest]);

  const handleNextRequest = () => {
    setShowIncomingPopup(false);
    setIncomingRequest(null);
    setRequestQueue((prev) => {
      const [, ...remaining] = prev;
      return remaining;
    });
  };

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/astrologer/profile`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProfile(res.data);
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  const fetchEarnings = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/astrologer/earnings`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEarnings(res.data.totalEarnings || 0);
    } catch (err) {
      setEarnings(0);
    }
  };

  useEffect(() => {
    if (activeTab === "inbox") fetchPendingSessions();
  }, [activeTab, fetchPendingSessions]);

  const acceptIncomingRequest = (request) => {
    if (!socket) return;
    if (notificationSoundRef.current) notificationSoundRef.current.pause();

    if (request.type === "chat") {
      socket.emit("chat:accept", { sessionId: request.sessionId });
      navigate(`/chat/${request.sessionId}`);
    } else if (request.type === "video" || request.type === "audio") {
      // Accept via API first if possible
      if (request.callId) {
          axios.post(
              `${import.meta.env.VITE_API_URL}/api/call/accept`,
              { callId: request.callId },
              { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
          ).catch(console.error);
      }

      const roomId = request.roomId || `${request.type}_${Date.now()}_${request.fromId}`;
      const eventName = request.type === "video" ? "call:accept" : "audio:accept";

      socket.emit(eventName, {
        toSocketId: request.fromSocketId,
        toUserId: request.fromId,
        roomId
      });

      setActiveCallRoomId(roomId);
      setActiveCallType(request.type);
      setActiveCallPeerId(request.fromSocketId);
      setActiveCallPeerName(request.fromName);
      setActiveTab("calls");
    }

    if (request.type === "chat") {
      setPendingSessions(prev => prev.filter(s => s.sessionId !== request.sessionId));
    } else if (request.type === "video") {
      setPendingVideoCalls(prev => prev.filter(v => v.id !== request.id));
    } else if (request.type === "audio") {
      setPendingAudioCalls(prev => prev.filter(a => a.id !== request.id));
    }
    handleNextRequest();
  };

  const rejectIncomingRequest = (request) => {
    setShowIncomingPopup(false);
    setIncomingRequest(null);
    if (notificationSoundRef.current) notificationSoundRef.current.pause();

    if (socket && socket.connected) {
       if (request.type === "chat") {
        socket.emit("chat:reject", { sessionId: request.sessionId });
      } else {
        // Also reject via API if callId exists
        if(request.callId) {
             axios.post(
                  `${import.meta.env.VITE_API_URL}/api/call/reject`,
                  { callId: request.callId },
                  { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
             ).catch(console.error);
        }
        const eventName = request.type === "video" ? "call:reject" : "audio:reject";
        socket.emit(eventName, { toSocketId: request.fromSocketId, toUserId: request.fromId });
      }
    }

    if (request.type === "chat") {
      setPendingSessions(prev => prev.filter(s => s.sessionId !== request.sessionId));
    } else if (request.type === "video") {
      setPendingVideoCalls(prev => prev.filter(v => v.id !== request.id));
    } else if (request.type === "audio") {
      setPendingAudioCalls(prev => prev.filter(a => a.id !== request.id));
    }

    setTimeout(() => {
      setRequestQueue((prev) => {
        const [, ...remaining] = prev;
        return remaining;
      });
    }, 100);
  };

  const closeIncomingPopup = () => {
    if (notificationSoundRef.current) notificationSoundRef.current.pause();
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
      setShowOfflinePopup(false);
    } catch (err) {
      console.error(err);
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
      requiresOnline: true,
    },
    {
      id: "charts",
      icon: BarChart3,
      label: "Charts",
      color: "from-indigo-500 to-purple-500",
      badge: null,
      onClick: () => setShowChartModal(true),
    },
    {
      id: "astrology",
      icon: Sparkles,
      label: "Astrology",
      color: "from-purple-500 to-indigo-500",
      badge: null,
      navigateTo: "/astrology",
    },
    {
      id: "earnings",
      icon: DollarSign,
      label: "Earnings",
      color: "from-yellow-500 to-orange-500",
      badge: null,
    }
  ];

  const handleTabChange = (item) => {
    if (item.onClick) {
      item.onClick();
      return;
    }
    if (item.navigateTo) {
      navigate(item.navigateTo);
      return;
    }
    if (item.requiresOnline && !profile?.isOnline) {
      setShowOfflinePopup(true);
      return;
    }
    setActiveTab(item.id);
  };

  const handleChartSelect = (chartId) => {
    switch(chartId) {
      case 'chat':
        if (!profile?.isOnline) setShowOfflinePopup(true);
        else setShowChatPanel(prev => !prev);
        break;
      default:
        setSelectedChart(chartId);
        setShowChartModal(true);
        break;
    }
  };

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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 pb-24 md:pb-0">
      {/* Offline Status Popup */}
      {showOfflinePopup && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fadeIn">
          <div className="bg-gradient-to-br from-orange-600 via-red-600 to-pink-600 text-white p-8 rounded-3xl shadow-2xl text-center max-w-md w-full relative">
            <button onClick={() => setShowOfflinePopup(false)} className="absolute top-4 right-4 text-white/70 hover:text-white">
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold mb-3">You're Currently Offline</h2>
            <p className="mb-6">Enable online status to receive requests.</p>
            <button onClick={toggleStatus} className="w-full bg-white text-orange-600 px-8 py-3 rounded-xl font-bold">
              Enable Online Status
            </button>
          </div>
        </div>
      )}

      {/* Incoming Request Popup */}
      {showIncomingPopup && incomingRequest && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fadeIn">
          <div className="bg-gradient-to-br from-purple-700 via-pink-700 to-blue-700 text-white p-8 rounded-3xl shadow-2xl text-center max-w-md w-full relative animate-bounce"
               style={{ animationDuration: '2s' }}>
            <div className="text-4xl mb-4">
               {incomingRequest.type === "chat" ? "💬" : incomingRequest.type === "video" ? "📹" : "🎙️"}
            </div>
            <h2 className="text-2xl font-bold mb-2">
              Incoming {incomingRequest.type === "chat" ? "Chat" : incomingRequest.type === "video" ? "Video Call" : "Audio Call"}
            </h2>
            <p className="text-lg font-semibold mb-6">{incomingRequest.fromName}</p>

            <div className="flex gap-3 justify-center">
              <button onClick={() => rejectIncomingRequest(incomingRequest)} className="bg-red-500 text-white px-6 py-3 rounded-xl font-bold">
                Reject
              </button>
              <button onClick={() => acceptIncomingRequest(incomingRequest)} className="bg-green-500 text-white px-6 py-3 rounded-xl font-bold animate-pulse">
                Accept
              </button>
            </div>
            <div className="mt-4 text-sm text-white/70">
                Auto-decline in {autoDeclineTimer}s
            </div>
          </div>
        </div>
      )}

      <ChartModal isOpen={showChartModal} onClose={() => setShowChartModal(false)} initialChart={selectedChart} />

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Cosmic Dashboard</h1>
            <p className="text-purple-200">Welcome, {user?.name || profile.name}</p>
          </div>
          <div className="relative">
             <button onClick={() => setActiveTab("inbox")} className="p-2 bg-white/20 rounded-full">
                <Bell className="w-6 h-6" />
                {menuItems[1].badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                        {menuItems[1].badge}
                    </span>
                )}
             </button>
          </div>
        </div>

        {/* Status Toggle */}
        <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 flex justify-between items-center cursor-pointer" onClick={toggleStatus}>
            <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${profile.isOnline ? "bg-green-400 animate-pulse" : "bg-red-400"}`}></div>
                <span className="font-semibold">{profile.isOnline ? "Online" : "Offline"}</span>
            </div>
            <div className={`w-12 h-6 rounded-full transition-colors ${profile.isOnline ? "bg-green-400" : "bg-gray-400"} relative`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${profile.isOnline ? "left-7" : "left-1"}`}></div>
            </div>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 bg-white m-4 p-4 rounded-2xl shadow-lg gap-4 -mt-4 text-center">
         <div>
            <div className="text-2xl font-bold text-purple-600">{pendingSessions.length + pendingVideoCalls.length + pendingAudioCalls.length}</div>
            <div className="text-xs text-gray-500">Pending</div>
         </div>
         <div>
            <div className="text-2xl font-bold text-green-600">₹{earnings}</div>
            <div className="text-xs text-gray-500">Earnings</div>
         </div>
      </div>

      {/* Tabs / Content */}
      <div className="px-4 pb-20">
          {activeTab === "overview" && (
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {menuItems.slice(1).map(item => (
                    <button key={item.id} onClick={() => handleTabChange(item)} className="bg-white p-4 rounded-2xl shadow flex flex-col items-center gap-2">
                        <div className={`p-3 rounded-full bg-gradient-to-r ${item.color} text-white`}>
                            <item.icon size={20} />
                        </div>
                        <span className="font-semibold text-sm">{item.label}</span>
                    </button>
                ))}
             </div>
          )}

          {activeTab === "inbox" && (
              <div className="bg-white rounded-2xl shadow-lg p-4 min-h-[300px]">
                  <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                      {["chat", "video", "audio"].map(type => (
                         <button
                            key={type}
                            onClick={() => setInboxTab(type)}
                            className={`px-4 py-2 rounded-full text-sm font-semibold capitalize whitespace-nowrap ${inboxTab === type ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600"}`}
                         >
                            {type} ({type === "chat" ? pendingSessions.length : type === "video" ? pendingVideoCalls.length : pendingAudioCalls.length})
                         </button>
                      ))}
                  </div>

                  {inboxTab === "chat" && pendingSessions.map(s => (
                      <div key={s.sessionId} className="border-b py-3 flex justify-between items-center">
                          <div>
                              <p className="font-bold">{s.client?.name || "Client"}</p>
                              <p className="text-xs text-gray-500">Chat Request</p>
                          </div>
                          <button onClick={() => {
                               socket.emit("chat:accept", { sessionId: s.sessionId });
                               navigate(`/chat/${s.sessionId}`);
                          }} className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm">Accept</button>
                      </div>
                  ))}

                  {inboxTab === "video" && pendingVideoCalls.map(call => (
                      <div key={call.id} className="border-b py-3 flex justify-between items-center">
                          <div>
                              <p className="font-bold">{call.fromName}</p>
                              <p className="text-xs text-gray-500">Video Call</p>
                          </div>
                          <button onClick={() => acceptIncomingRequest(call)} className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm">Accept</button>
                      </div>
                  ))}

                   {inboxTab === "audio" && pendingAudioCalls.map(call => (
                      <div key={call.id} className="border-b py-3 flex justify-between items-center">
                          <div>
                              <p className="font-bold">{call.fromName}</p>
                              <p className="text-xs text-gray-500">Audio Call</p>
                          </div>
                          <button onClick={() => acceptIncomingRequest(call)} className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm">Accept</button>
                      </div>
                  ))}

                  {((inboxTab === "chat" && pendingSessions.length === 0) ||
                    (inboxTab === "video" && pendingVideoCalls.length === 0) ||
                    (inboxTab === "audio" && pendingAudioCalls.length === 0)) && (
                        <div className="text-center py-10 text-gray-400">No pending requests</div>
                  )}
              </div>
          )}

          {activeTab === "calls" && activeCallRoomId && (
                <VideoCall
                  roomId={activeCallRoomId}
                  peerSocketId={activeCallPeerId}
                  socket={socket}
                  user={user}
                  isInitiator={false}
                  audioOnly={activeCallType === 'audio'}
                  onEnd={() => {
                     setActiveCallRoomId(null);
                     setActiveCallType(null);
                     setActiveTab("inbox");
                  }}
                  peerName={activeCallPeerName || "Client"}
                />
          )}
      </div>

      {/* Bottom Navigation (Mobile) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 md:hidden z-50 flex justify-around safe-area-bottom">
         {menuItems.slice(0, 5).map(item => (
             <button
                key={item.id}
                onClick={() => handleTabChange(item)}
                className={`flex flex-col items-center p-2 rounded-xl w-16 ${activeTab === item.id ? "text-purple-600 bg-purple-50" : "text-gray-500"}`}
             >
                <item.icon size={20} />
                <span className="text-[10px] mt-1 font-medium">{item.label}</span>
                {item.badge > 0 && (
                    <div className="absolute top-2 ml-4 w-2 h-2 bg-red-500 rounded-full"></div>
                )}
             </button>
         ))}
      </div>

      {/* Hidden unlock button for audio context */}
      <button id="unlock-audio" className="hidden" onClick={() => {
          if(notificationSoundRef.current) {
              notificationSoundRef.current.play().then(() => {
                  notificationSoundRef.current.pause();
              }).catch(() => {});
          }
      }}></button>

      <AstrologyQuickMenu onSelectChart={handleChartSelect} />
    </div>
  );
};

export default AstrologerDashboard;