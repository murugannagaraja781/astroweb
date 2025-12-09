// AstrologerDashboard.jsx
import { useState, useEffect, useRef, useCallback, useContext } from "react";
import Modal from "../components/Modal";
import axios from "axios";
// import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
// import ClientVideoCall from "./ClientcalltoAstrologerVideoCall";
// import AudioCall from "./AudioCall";
import VideoCall from "../components/VideoCall";
import ChartModal from "../components/ChartModal";
import ChatHistoryList from "../components/ChatHistoryList";

import AuthContext from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import socketManager from "../utils/socketManager";
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
  Video
} from "lucide-react";

const AstrologerDashboard = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [inboxTab, setInboxTab] = useState("chat"); // 'chat' or 'video'
  const { user } = useContext(AuthContext); // Consuming AuthContext
  const [profile, setProfile] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCallRoomId, setActiveCallRoomId] = useState(null);
  const [activeCallType, setActiveCallType] = useState(null); // 'video' or 'audio'
  const [activeCallPeerId, setActiveCallPeerId] = useState(null);
  const [activeCallPeerName, setActiveCallPeerName] = useState(null); // New state for peer name
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
  const [showChatPanel, setShowChatPanel] = useState(false); // New: For sliding chat panel
  const [isOnline, setIsOnline] = useState(true); // Online status for polling
  const [chatSessions, setChatSessions] = useState([]); // Chat history

  const audioRef = useRef(null);
  const notificationSoundRef = useRef(null);
  const navigate = useNavigate();

  // Initialize notification sound with fallback
  useEffect(() => {
    // Try local file first, fallback to online sound
    const soundUrls = [
      "/notification.mp3",
      "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3", // Fallback online sound
      "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGS57OihUBELTKXh8bllHAU2jdXvzn0vBSh+zPDajzsKElyx6OyrWBUIQ5zd8sFuJAUuhM/z24k2Bxdju+zpoVIRC0um4PG5ZRwFN43V78+ALwUnfszw2o87ChJcr+jrq1kVCEKb3fK/bSQFL4XP89uJNgcXY7vs6aFSEQtLpuDxuWUcBTeN1e/PgC8FJ37M8NqPOwsSXK/o66tZFQhCm93yv20kBS+Fz/PbiTYHF2O77OmhUhELS6bg8bllHAU3jdXvzn0vBSh+zPDajzsKElyx6OyrWBUIQ5zd8sFuJAUuhM/z24k2Bxdju+zpoVIRC0um4PG5ZRwFN43V78+ALwUnfszw2o87ChJcr+jrq1kVCEKb3fK/bSQFL4XP89uJNgcXY7vs6aFSEQtLpuDxuWUcBTeN1e/PgC8FJ37M8NqPOwsSXK/o66tZFQhCm93yv20kBS+Fz/PbiTYHF2O77OmhUhELS6bg8bllHAU3jdXvzn0vBSh+zPDajzsKElyx6OyrWBUIQ5zd8sFuJAUuhM/z24k2Bxdju+zpoVIRC0um4PG5ZRwFN43V78+ALwUnfszw2o87ChJcr+jrq1kVCEKb3fK/bSQFL4XP89uJNgcXY7vs6aFSEQtLpuDxuWUcBTeN1e/PgC8FJ37M8NqPOwsSXK/o66tZFQhCm93yv20kBS+Fz/PbiTYHF2O77OmhUhELS6bg8bllHAU3jdXvzn0vBSh+zPDajzsKElyx6OyrWBUIQ5zd8sFuJAUuhM/z24k2Bxdju+zpoVIRC0um4PG5ZRwFN43V78+ALwUnfszw2o87ChJcr+jrq1kVCEKb3fK/bSQFL4XP89uJNgcXY7vs6aFSEQtLpuDxuWUcBTeN1e/PgC8FJ37M8NqPOwsSXK/o66tZFQhCm93yv20kBS+Fz/PbiTYHF2O77OmhUhELS6bg8bllHAU3jdXvzn0vBSh+zPDajzsKElyx6OyrWBUIQ5zd8sFuJAUuhM/z24k2Bxdju+zpoVIRC0um4PG5ZRwFN43V78+ALwUnfszw2o87ChJcr+jrq1kVCEKb3fK/bSQFL4XP89uJNgcXY7vs6aFSEQtLpuDxuWUcBTeN1e/PgC8FJ37M8NqPOwsSXK/o66tZFQhCm93yv20kBS+Fz/PbiTYHF2O77OmhUhELS6bg8bllHAU3jdXvzn0vBSh+zPDajzsKElyx6OyrWBUIQ5zd8sFuJAUuhM/z24k2Bxdju+zpoVIRC0um4PG5ZRwFN43V78+ALwUnfszw2o87ChJcr+jrq1kVCEKb3fK/bSQFL4XP89uJNgcXY7vs6aFSEQtLpuDxuWUcBTeN1e/PgC8FJ37M8NqPOwsSXK/o66tZFQhCm93yv20kBS+Fz/PbiTYHF2O77OmhUhELS6bg8bllHAU3jdXvzn0vBSh+zPDajzsKElyx6OyrWBUIQ5zd8sFuJAUuhM/z24k2Bxdju+zpoVIRC0um4PG5ZRwFN43V78+ALwUnfszw2o87ChJcr+jrq1kVCEKb3fK/bSQFL4XP89uJNgcXY7vs6Q=="
    ];

    const tryLoadSound = (index = 0) => {
      if (index >= soundUrls.length) {
        console.warn("⚠️ All notification sounds failed to load");
        return;
      }

      const audio = new Audio(soundUrls[index]);
      audio.preload = "auto";
      audio.volume = 1.0;

      audio.addEventListener('canplaythrough', () => {
        console.log("✅ Notification sound loaded:", soundUrls[index]);
        notificationSoundRef.current = audio;
      });

      audio.addEventListener('error', () => {
        console.warn("❌ Failed to load:", soundUrls[index]);
        tryLoadSound(index + 1);
      });

      // Try to load
      audio.load();
    };

    tryLoadSound();

    // Cleanup on unmount
    return () => {
      if (notificationSoundRef.current) {
        notificationSoundRef.current.pause();
        notificationSoundRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
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


  const playNotificationSound = () => {
    if (notificationSoundRef.current) {
      notificationSoundRef.current.currentTime = 0;
      notificationSoundRef.current.play().catch(e => console.log("Sound error:", e));
    }
  };

  // Initialize socket connection once
  useEffect(() => {
    // connect() returns the singleton socket.
    // It handles ensuring it's connected.
    const newSocket = socketManager.connect(import.meta.env.VITE_API_URL || "https://astroweb-production.up.railway.app");

    console.log("[Astrologer] Using global socket:", newSocket.id);

    // Instead of manual on('connect'), we rely on the global manager/App.jsx
    // BUT we still want to ensure we are receiving events here.

    // We update the local state to trigger other effects
    setSocket(newSocket);

    // Note: App.jsx handles the global 'user_online' emission.
    // However, if we want to be double-sure or if this page is standalone:
    const onConnect = () => {
         console.log("[Astrologer] Socket connected/reconnected");
         // Removed toast notification to prevent annoyance during status toggles
         // addToast(`Socket Connected! ID: ${newSocket.id}`, 'success');
         const registrationId = user?.id || profile?.userId?._id || profile?.userId;
         if (registrationId) {
            newSocket.emit("user_online", { userId: registrationId });
         }
    };

    newSocket.on("connect", onConnect);

    // Listens for incoming chat requests
    newSocket.on("chat:request", (data) => {
        console.log("Incoming chat request:", data);
        setIncomingRequest({ ...data, type: 'chat' });
        setShowIncomingPopup(true);
        playNotificationSound();
        fetchPendingSessions(); // Refresh list as well
    });

    // Listens for incoming video/audio call requests
    newSocket.on("call:request", (data) => {
         console.log("Incoming call request:", data);
         setIncomingRequest({ ...data, type: data.type || 'video' });
         setShowIncomingPopup(true);
         playNotificationSound();
         fetchPendingSessions();
    });

    // If already connected, run logic immediately
    if (newSocket.connected) {
        onConnect();
    }

    return () => {
      newSocket.off("connect", onConnect);
      newSocket.off("chat:request");
      newSocket.off("call:request");
    };
  }, [user, profile?.userId]); // Changed dependency from 'profile' to 'profile.userId' to avoid unnecessary re-runs


  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/astrologer/profile`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProfile(res.data);
      // Update online status in local state for polling consistency
      setIsOnline(res.data.isOnline);
    } catch (err) {
      console.error("Error fetching profile:", err);
      // Fallback for demo/testing if API fails
      // setProfile({ name: user?.name || "Astrologer", isOnline: true });
      addToast("Failed to load profile", "error");
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
      console.error("Error fetching earnings:", err);
    }
  };

  const fetchPendingSessions = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/chat/sessions/pending`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
       // Handle both array/object formats
      const data = Array.isArray(res.data) ? res.data : res.data.data || [];

      // Separate by type
      const video = data.filter(s => s.type === 'video');
      const audio = data.filter(s => s.type === 'audio');
      const chat = data.filter(s => !s.type || s.type === 'chat');

      setPendingSessions(chat);
      setPendingVideoCalls(video);
      setPendingAudioCalls(audio);
    } catch (err) {
      console.error("Error fetching pending sessions:", err);
    }
  };

  const fetchChatHistory = async () => {
      try {
          const token = localStorage.getItem("token");
          const res = await axios.get(
              `${import.meta.env.VITE_API_URL}/api/chat/history`,
              { headers: { Authorization: `Bearer ${token}` } }
          );
          setChatSessions(res.data);
      } catch (err) {
          console.error("Error fetching chat history", err);
      }
  };

  // Initial Data Load
  useEffect(() => {
    fetchProfile();
    fetchEarnings();
    fetchPendingSessions();
    fetchChatHistory();
  }, [user]);

  // Polling for requests & sync status (Deep Connection)
  useEffect(() => {
    const interval = setInterval(() => {
        // Always fetch profile to ensure status is synced (e.g. if changed on another device)
        fetchProfile();

        // Only fetch requests if we think we are online
        if (profile?.isOnline) {
            fetchPendingSessions();
        }
    }, 5000); // Increased frequency to 5s for better sync feel
    return () => clearInterval(interval);
  }, [profile?.isOnline]);

  const toggleStatus = async () => {
    // 1. Optimistic Update (Immediate Feedback - Deep Connection)
    const oldStatus = profile.isOnline;
    const newStatus = !oldStatus;

    // Instantly update UI state
    setProfile(prev => ({ ...prev, isOnline: newStatus }));

    // Instantly close offline popup if going online
    if (newStatus) {
        setShowOfflinePopup(false);
    }

    // Toggle socket event immediately for responsiveness
    if (socket) {
        if (newStatus) {
             socket.emit("user_online", { userId: profile.userId });
        } else {
             socket.emit("user_offline", { userId: profile.userId });
        }
    }

    try {
      const token = localStorage.getItem("token");
      // 2. API Call (Background)
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/astrologer/status`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 3. Sync with Server Response
      // Only update if the result is different to avoid jitter,
      // but usually we just trust the server.
      if (res.data.isOnline !== newStatus) {
           setProfile(res.data);
      }
    } catch (err) {
      console.error("Error toggling status:", err);
      // 4. Revert on Error
      setProfile(prev => ({ ...prev, isOnline: oldStatus }));
      addToast("Failed to update status", "error");

      // Re-show popup if we failed to go online
      if (newStatus) {
          setShowOfflinePopup(true);
      }
    }
  };

  const updateCallAvailability = async (type, value) => {
     // Optimistic update
     setProfile(prev => ({
        ...prev,
        [type === 'video' ? 'isVideoCallAvailable' : type === 'audio' ? 'isAudioCallAvailable' : 'isChatAvailable']: value
     }));

     try {
        const token = localStorage.getItem("token");
        await axios.put(
           `${import.meta.env.VITE_API_URL}/api/astrologer/profile`,
           {
              [type === 'video' ? 'isVideoCallAvailable' : type === 'audio' ? 'isAudioCallAvailable' : 'isChatAvailable']: value
           },
           { headers: { Authorization: `Bearer ${token}` } }
        );
     } catch (err) {
        console.error("Failed to update availability", err);
        // Revert on error
        fetchProfile();
     }
  };



  // Timer for auto-decline popup
  const [autoDeclineTimer, setAutoDeclineTimer] = useState(30);

  useEffect(() => {
    let timer;
    if (showIncomingPopup && incomingRequest) {
        setAutoDeclineTimer(30); // Reset to 30s
        timer = setInterval(() => {
            setAutoDeclineTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    rejectIncomingRequest(incomingRequest); // Auto reject
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }
    return () => clearInterval(timer);
  }, [showIncomingPopup, incomingRequest]);

  const acceptIncomingRequest = (req) => {
      setShowIncomingPopup(false);
      if (req.type === 'chat') {
          acceptChat(req.sessionId);
      } else {
          // Video/Audio accept logic
          // For now, let's assume video
          // setActiveCall(req...);
          // THIS SECTION needs to hook into the video logic,
          // but for chat specifically:
           socket.emit("call:accept", { toSocketId: req.fromSocketId, roomId: req.roomId });
           setActiveCallRoomId(req.roomId);
           setActiveCallType(req.type);
           setActiveCallPeerId(req.fromSocketId);
           setActiveCallPeerName(req.fromName);
           setActiveTab('calls');
      }
  };

  const rejectIncomingRequest = (req) => {
      setShowIncomingPopup(false);

      // Stop sound
      if (notificationSoundRef.current) {
         notificationSoundRef.current.pause();
         notificationSoundRef.current.currentTime = 0;
      }

      if (req.type === 'chat') {
          rejectChat(req.sessionId);
      } else {
          // For calls, we emit a reject event
          if (socket) {
              socket.emit("call:reject", {
                  toSocketId: req.fromSocketId,
                  roomId: req.roomId
              });
          }
          // Also remove from pending list
          setPendingVideoCalls(prev => prev.filter(c => c.id !== req.id));
      }
      setIncomingRequest(null);
  };

  const acceptChat = (sessionId) => {
    if (!socket) return;

    // Stop sound
    if (notificationSoundRef.current) {
        notificationSoundRef.current.pause();
        notificationSoundRef.current.currentTime = 0;
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
    // 1. Emit Socket Event (Real-time alert for Client)
    if (socket && socket.connected) {
      socket.emit("chat:reject", { sessionId });
    }

    // 2. API Call (Database Update)
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/chat/reject`,
        { sessionId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 3. Update Local UI
      setPendingSessions((prev) =>
        prev.filter((s) => s.sessionId !== sessionId)
      );
      addToast("Request rejected", "info");
    } catch (err) {
      console.error("Error rejecting chat:", err);
      addToast("Failed to reject chat completely", "error");
    }
  };

  // FILTER LOGIC FOR BADGES
  const filterByMyName = (item) => {
    if (!profile?.userId) return false;
    const myName = user?.name || profile.userId?.name || profile.name;
    const myId = profile.userId._id || profile.userId;

    // Strict Name Check
    if (item.astrologer?.name && myName) {
       return item.astrologer.name === myName;
    }
    if (item.astrologerName && myName) {
       return item.astrologerName === myName;
    }

    // Fallback ID Check
    const itemId = item.astrologerId || item.astrologer?.id;
    return String(itemId) === String(myId);
  };

  const myPendingSessions = pendingSessions.filter(filterByMyName);
  const myPendingVideoCalls = pendingVideoCalls.filter(filterByMyName);
  const myPendingAudioCalls = pendingAudioCalls.filter(filterByMyName);

  const menuItems = [
    {
      id: "overview",
      icon: Home,
      label: "Home",
      color: "from-blue-500 to-cyan-500",
      badge: null,
    },
    {
      id: "inbox",
      icon: MessageCircle,
      label: "Requests",
      color: "from-purple-500 to-pink-500",
      badge: myPendingSessions.length + myPendingVideoCalls.length + myPendingAudioCalls.length,
      requiresOnline: true,
    },
    {
       id: "history",
       icon: Calendar,
       label: "History",
       color: "from-teal-500 to-green-500",
       badge: null
    },
    {
      id: "earnings",
      icon: DollarSign,
      label: "Earnings",
      color: "from-yellow-500 to-orange-500",
      badge: null,
    },
    {
      id: "profile",
      icon: User,
      label: "Profile",
      color: "from-gray-600 to-gray-800",
      badge: null,
    }
  ];

  const handleTabChange = (item) => {
    // If menu item has onClick, execute it
    if (item.onClick) {
      item.onClick();
      return;
    }

    // If menu item has navigateTo, navigate instead of changing tab
    if (item.navigateTo) {
      navigate(item.navigateTo);
      return;
    }

    // Check online status requirement
    if (item.requiresOnline && !profile?.isOnline) {
      setShowOfflinePopup(true);
      return;
    }

    setActiveTab(item.id);
  };



  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
          <p className="text-gray-500 font-medium">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  // Helper to determine active bottom tab style
  const getTabClass = (tabName) => {
    return activeTab === tabName
      ? "text-yellow-600 flex flex-col items-center gap-1 transition-colors"
      : "text-gray-400 hover:text-gray-600 flex flex-col items-center gap-1 transition-colors";
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans text-gray-800">
      {/* -------------------- POPUPS -------------------- */}

      {/* Offline Status Popup with Glassmorphism */}
      {showOfflinePopup && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in zoom-in duration-300">
          <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] p-8 max-w-sm w-full text-center shadow-2xl border border-white/50 relative">
            <button
              onClick={() => setShowOfflinePopup(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={24} />
            </button>
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <span className="text-4xl">🌙</span>
            </div>
            <h2 className="text-2xl font-bold mb-3 text-slate-800">You are Offline</h2>
            <p className="text-slate-500 mb-8 leading-relaxed">
              Go online to start receiving consultation requests and maximize your earnings today.
            </p>
            <button
              onClick={toggleStatus}
              className="w-full py-4 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-bold rounded-2xl shadow-lg shadow-orange-200 transform active:scale-[0.98] transition-all"
            >
              Go Online Now
            </button>
          </div>
        </div>
      )}

      {/* Incoming Request Popup - Premium */}
      {showIncomingPopup && incomingRequest && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[8px] flex items-center justify-center z-[100] p-4 animate-in fade-in zoom-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl relative border-4 border-amber-200 animate-bounce-subtle">
             {/* Header */}
             <div className="bg-gradient-to-r from-amber-300 to-orange-400 p-6 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
                <h3 className="text-white font-bold text-lg flex items-center justify-center gap-3 tracking-wider relative z-10">
                   INCOMING {incomingRequest.type.toUpperCase()}
                   <span className="animate-ping w-2.5 h-2.5 bg-white rounded-full"></span>
                </h3>
             </div>

             <div className="p-8 text-center bg-white relative">
                <div className="w-28 h-28 mx-auto -mt-16 mb-6 bg-white rounded-full flex items-center justify-center border-4 border-white shadow-xl relative z-20">
                   {incomingRequest.type === 'video' && <Video size={48} className="text-green-500 drop-shadow-sm" />}
                   {incomingRequest.type === 'audio' && <Phone size={48} className="text-blue-500 drop-shadow-sm" />}
                   {incomingRequest.type === 'chat' && <MessageCircle size={48} className="text-amber-500 drop-shadow-sm" />}
                </div>

                <h2 className="text-3xl font-bold text-slate-900 mb-2">{incomingRequest.fromName}</h2>
                <p className="text-slate-500 font-medium mb-8">
                   {incomingRequest.type === 'chat' ? 'Requesting a live chat session...' : 'Incoming call request...'}
                </p>

                <div className="flex gap-4">
                   <button
                      onClick={() => rejectIncomingRequest(incomingRequest)}
                      className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all active:scale-95"
                   >
                      Decline
                   </button>
                   <button
                      onClick={() => acceptIncomingRequest(incomingRequest)}
                      className="flex-1 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-green-200 active:scale-95 transition-all animate-pulse-subtle"
                   >
                      Accept
                   </button>
                </div>

                {/* Elegant Timer */}
                <div className="mt-8">
                   <div className="flex justify-between text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">
                      <span>Auto-decline</span>
                      <span>{autoDeclineTimer}s</span>
                   </div>
                   <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                         className="h-full bg-gradient-to-r from-red-400 to-rose-500 transition-all duration-1000 ease-linear rounded-full"
                         style={{ width: `${(autoDeclineTimer / 30) * 100}%` }}
                      ></div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}


      {/* -------------------- HEADER -------------------- */}
      <header className="sticky top-0 z-40 bg-yellow-400 text-gray-900 shadow-md">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-black/5">
                  <User size={20} className="text-gray-900" />
               </div>
               <div>
                  <h1 className="font-bold text-lg leading-tight">{user?.name || profile.name}</h1>
                  <div className="flex items-center gap-1.5">
                     <div className={`w-2 h-2 rounded-full ${profile.isOnline ? 'bg-green-600' : 'bg-red-500'}`}></div>
                     <span className="text-xs font-semibold opacity-70">
                        {profile.isOnline ? 'Online' : 'Offline'}
                     </span>
                  </div>
               </div>
            </div>

            <div className="flex items-center gap-3">
               <button onClick={fetchPendingSessions} className="p-2 hover:bg-black/5 rounded-full relative">
                  <Bell size={24} />
                  {(myPendingSessions.length + myPendingVideoCalls.length + myPendingAudioCalls.length) > 0 && (
                     <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                        {myPendingSessions.length + myPendingVideoCalls.length + myPendingAudioCalls.length}
                     </span>
                  )}
               </button>
            </div>
        </div>
      </header>


      {/* -------------------- MAIN CONTENT -------------------- */}
      <main className="container mx-auto px-4 pt-6 space-y-8">

         {/* 1. Status Control Center (Premium Card) */}
         {activeTab === 'overview' && (
         <div className="bg-white/70 backdrop-blur-md rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 border border-white">
            <div className="flex items-center justify-between mb-8">
               <div>
                  <h2 className="font-bold text-slate-900 text-xl">Availability Status</h2>
                  <p className="text-sm text-slate-500 mt-1">Manage your visibility to clients</p>
               </div>
               <label className="relative inline-flex items-center cursor-pointer group">
                  <input type="checkbox" className="sr-only peer" checked={profile.isOnline} onChange={toggleStatus} />
                  <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-green-400 peer-checked:to-emerald-500 shadow-inner group-hover:shadow-md transition-all"></div>
               </label>
            </div>

            {profile.isOnline && (
               <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                  {/* Audio Call */}
                  <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                           <Phone size={22} />
                        </div>
                        <div>
                           <span className="font-bold text-slate-800 block">Audio Call</span>
                           <span className="text-xs text-slate-400 font-medium">₹{profile.ratePerMinute || 20}/min</span>
                        </div>
                     </div>
                     <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={profile.isAudioCallAvailable} onChange={() => updateCallAvailability('audio', !profile.isAudioCallAvailable)} />
                         <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 shadow-sm"></div>
                     </label>
                  </div>

                  {/* Video Call */}
                  <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                           <Video size={22} />
                        </div>
                        <div>
                           <span className="font-bold text-slate-800 block">Video Call</span>
                           <span className="text-xs text-slate-400 font-medium">₹{profile.videoRate || 40}/min</span>
                        </div>
                     </div>
                     <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={profile.isVideoCallAvailable} onChange={() => updateCallAvailability('video', !profile.isVideoCallAvailable)} />
                         <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 shadow-sm"></div>
                     </label>
                  </div>

                  {/* Chat */}
                  <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
                           <MessageCircle size={22} />
                        </div>
                        <div>
                           <span className="font-bold text-slate-800 block">Live Chat</span>
                           <span className="text-xs text-slate-400 font-medium">₹{profile.chatRate || 15}/min</span>
                        </div>
                     </div>
                     <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={profile.isChatAvailable} onChange={() => updateCallAvailability('chat', !profile.isChatAvailable)} />
                         <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 shadow-sm"></div>
                     </label>
                  </div>
               </div>
            )}
         </div>
         )}

         {/* 2. Stats Cards (Premium) */}
         {activeTab === 'overview' && (
         <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/60 backdrop-blur-sm p-5 rounded-[1.5rem] shadow-lg shadow-slate-200/50 border border-white hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group" onClick={() => setActiveTab('earnings')}>
               <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Earnings</div>
               <div className="text-2xl font-black text-slate-800 break-words group-hover:text-amber-600 transition-colors">₹{earnings.toLocaleString()}</div>
               <div className="mt-3 text-[10px] font-bold text-green-700 bg-green-100/50 px-2 py-1 rounded-lg inline-block border border-green-200">
                  +12% vs last week
               </div>
            </div>
             <div className="bg-white/60 backdrop-blur-sm p-5 rounded-[1.5rem] shadow-lg shadow-slate-200/50 border border-white hover:shadow-xl hover:-translate-y-1 transition-all">
               <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Rating</div>
               <div className="text-2xl font-black text-slate-800 flex items-center gap-1">
                  4.8 <Star size={20} className="text-amber-400 fill-current drop-shadow-sm" />
               </div>
               <div className="mt-3 text-xs text-slate-500 font-medium">From 12 Reviews</div>
            </div>
         </div>
         )}


         {/* 3. INBOX Tab (Premium) */}
         {activeTab === 'inbox' && (
            <div className="space-y-6">
               <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Incoming Requests</h2>
                  <button onClick={fetchPendingSessions} className="px-4 py-2 bg-white rounded-full text-amber-600 text-xs font-bold shadow-sm border border-amber-100 flex items-center gap-1.5 hover:bg-amber-50 active:scale-95 transition-all">
                     <Sparkles size={14} /> Refresh
                  </button>
               </div>

               <div className="flex gap-3 pb-2 overflow-x-auto scrollbar-hide">
                    {['chat', 'video', 'audio'].map((type) => {
                       const count = type === 'chat' ? myPendingSessions.length : type === 'video' ? myPendingVideoCalls.length : myPendingAudioCalls.length;
                       const isActive = inboxTab === type;
                       return (
                          <button
                             key={type}
                             onClick={() => setInboxTab(type)}
                             className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                                isActive
                                ? 'bg-slate-800 text-white shadow-lg shadow-slate-200 transform scale-105'
                                : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'
                             }`}
                          >
                             {type.charAt(0).toUpperCase() + type.slice(1)} ({count})
                          </button>
                       )
                    })}
               </div>

               {/* Request Lists */}
               <div className="space-y-4">
                   {/* Handle Chat */}
                   {inboxTab === 'chat' && (
                      myPendingSessions.length === 0 ? (
                         <div className="text-center py-16 bg-white/50 rounded-[2rem] border-2 border-dashed border-slate-200">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                               <MessageCircle size={32} />
                            </div>
                            <p className="text-slate-400 font-medium">No pending chat requests</p>
                         </div>
                      ) : (
                         myPendingSessions.map(session => (
                            <div key={session.sessionId || session.id} className="bg-white p-5 rounded-[1.5rem] shadow-lg shadow-slate-100 border border-slate-50 flex flex-col gap-4 animate-in fade-in zoom-in duration-300">
                               <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                     <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center text-amber-600 font-bold border border-white shadow-sm">
                                        {(session.fromName || 'C')[0]}
                                     </div>
                                     <div>
                                        <h3 className="font-bold text-slate-900">{session.userId?.name || session.client?.name || session.fromName || 'Client'}</h3>
                                        <p className="text-xs text-slate-400 font-medium">Waiting since {new Date(session.createdAt || session.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                     </div>
                                  </div>
                                  <span className="px-2 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-lg border border-amber-100">CHAT</span>
                               </div>
                               <div className="flex gap-3 pt-2 border-t border-slate-50">
                                  <button onClick={() => rejectChat(session.sessionId)} className="p-3 bg-slate-50 text-slate-500 rounded-xl hover:bg-red-50 hover:text-red-500 transition-colors active:scale-95">
                                      <X size={20} />
                                  </button>
                                  <button onClick={() => acceptChat(session.sessionId)} className="flex-1 py-3 bg-gradient-to-r from-slate-800 to-slate-900 text-white font-bold rounded-xl shadow-lg shadow-slate-200 active:scale-95 transition-all flex items-center justify-center gap-2">
                                      Accept Request
                                  </button>
                               </div>
                            </div>
                         ))
                      )
                   )}
                   {/* Video/Audio Lists would follow similar premium style */}
                   {inboxTab === 'video' && (
                       myPendingVideoCalls.length === 0 ? (
                           <div className="text-center py-12 text-slate-400">No video requests</div>
                       ) : (
                           myPendingVideoCalls.map(call => (
                               <div key={call.id} className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-100">
                                   <div className="font-bold">{call.fromName}</div>
                                   <button onClick={() => acceptIncomingRequest(call)} className="mt-2 w-full py-2 bg-green-500 text-white rounded-xl font-bold">Answer Video</button>
                               </div>
                           ))
                       )
                   )}
               </div>
            </div>
         )}


         {/* 4. HISTORY Tab (Premium) */}
         {activeTab === 'history' && (
            <div className="bg-white/80 backdrop-blur-md rounded-[2rem] shadow-xl shadow-slate-200/50 border border-white p-6 min-h-[50vh]">
               <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <Calendar className="text-amber-500" size={24} />
                  History
               </h2>
               <ChatHistoryList sessions={chatSessions} />
            </div>
         )}

         {/* 5. EARNINGS Tab (Premium) */}
         {activeTab === 'earnings' && (
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] shadow-2xl shadow-slate-400/50 p-10 text-center text-white relative overflow-hidden">
               {/* Decorative Circles */}
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
               <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-500/20 rounded-full blur-xl -ml-5 -mb-5"></div>

               <div className="bg-white/20 backdrop-blur-md w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-white/10">
                  <DollarSign size={32} className="text-amber-300" />
               </div>
               <h2 className="text-lg font-medium text-slate-300 mb-2 uppercase tracking-wide">Total Earnings</h2>
               <p className="text-5xl font-black text-white my-4 tracking-tight">₹{earnings.toLocaleString()}</p>
               <div className="mt-8 inline-block px-4 py-2 bg-white/10 rounded-full text-xs font-semibold backdrop-blur-sm border border-white/10">
                  Payout next Monday
               </div>
            </div>
         )}

         {/* 6. Quick Action Grid (Premium) */}
         {activeTab === 'overview' && (
            <div className="grid grid-cols-3 gap-4">
               <button onClick={() => setShowChartModal(true)} className="bg-white p-4 rounded-[1.5rem] shadow-md shadow-slate-100 border border-white flex flex-col items-center gap-3 active:scale-95 transition-all hover:-translate-y-1 group">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-sm">
                     <BarChart3 size={24} />
                  </div>
                  <span className="text-xs font-bold text-slate-600">Charts</span>
               </button>
               <button onClick={() => setActiveTab('history')} className="bg-white p-4 rounded-[1.5rem] shadow-md shadow-slate-100 border border-white flex flex-col items-center gap-3 active:scale-95 transition-all hover:-translate-y-1 group">
                  <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors shadow-sm">
                     <Calendar size={24} />
                  </div>
                  <span className="text-xs font-bold text-slate-600">History</span>
               </button>
               <button onClick={() => navigate('/astrology')} className="bg-white p-4 rounded-[1.5rem] shadow-md shadow-slate-100 border border-white flex flex-col items-center gap-3 active:scale-95 transition-all hover:-translate-y-1 group">
                  <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors shadow-sm">
                     <Sparkles size={24} />
                  </div>
                  <span className="text-xs font-bold text-slate-600">Astrology</span>
               </button>
            </div>
         )}

          {activeTab === "calls" && (
            <div>
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl shadow-lg shadow-green-200">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800">
                  {activeCallType === "video" ? "Video" : "Audio"} Call Studio
                </h3>
              </div>
              {activeCallType === "video" ? (
                <div className="rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white">
                    <VideoCall
                      roomId={activeCallRoomId}
                      peerSocketId={activeCallPeerId}
                      isInitiator={false}
                      onEndCall={() => {
                         setActiveCallRoomId(null);
                         setActiveCallType(null);
                         setActiveCallPeerId(null);
                      }}
                    />
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 bg-slate-100 rounded-[2rem] text-slate-400 font-medium">
                  Audio Call Interface Loading...
                </div>
              )}
            </div>
          )}

      </main>

      {/* -------------------- BOTTOM NAVIGATION -------------------- */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-end z-50 pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.03)]">
         <button onClick={() => setActiveTab('overview')} className={getTabClass('overview')}>
            <Home size={24} className={activeTab === 'overview' ? 'fill-current' : ''} />
            <span className="text-[10px] font-medium">Home</span>
         </button>

         <button onClick={() => setActiveTab('inbox')} className={getTabClass('inbox')}>
            <div className="relative">
               <MessageCircle size={24} className={activeTab === 'inbox' ? 'fill-current' : ''} />
               {(myPendingSessions.length + myPendingVideoCalls.length > 0) && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
               )}
            </div>
            <span className="text-[10px] font-medium">Requests</span>
         </button>

         <button onClick={() => setActiveTab('history')} className={getTabClass('history')}>
            <Calendar size={24} className={activeTab === 'history' ? 'fill-current' : ''} />
            <span className="text-[10px] font-medium">History</span>
         </button>

         <button onClick={() => setActiveTab('earnings')} className={getTabClass('earnings')}>
            <DollarSign size={24} className={activeTab === 'earnings' ? 'fill-current' : ''} />
            <span className="text-[10px] font-medium">Earnings</span>
         </button>

         <button onClick={() => setActiveTab('profile')} className={getTabClass('profile')}>
            <User size={24} className={activeTab === 'profile' ? 'fill-current' : ''} />
            <span className="text-[10px] font-medium">Profile</span>
         </button>
      </nav>

      {/* Hidden Unlock Button */}
      <button id="unlock-audio" onClick={() => { if(notificationSoundRef.current) notificationSoundRef.current.play().catch(e => {}) }} className="hidden"></button>

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

      {/* Chart Modal */}
      <ChartModal
        isOpen={showChartModal}
        onClose={() => setShowChartModal(false)}
        initialChart={selectedChart}
        initialData={undefined}
      />

      {/* Hidden audio element for notification sound */}
      <audio ref={notificationSoundRef} preload="auto">
        <source src="/notification.mp3" type="audio/mpeg" />
      </audio>

      {/* Add custom CSS animations */}
      <style>{`
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
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .animate-scale-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .pb-safe {
          padding-bottom: env(safe-area-inset-bottom, 20px);
        }
      `}</style>
    </div>
  );
};

export default AstrologerDashboard;
