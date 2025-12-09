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
         addToast(`Socket Connected! ID: ${newSocket.id}`, 'success'); // Show toast instead of alert
         const registrationId = user?.id || profile?.userId?._id || profile?.userId;
         if (registrationId) {
            newSocket.emit("user_online", { userId: registrationId });
         }
    };

    newSocket.on("connect", onConnect);

    // If already connected, run logic immediately
    if (newSocket.connected) {
        onConnect();
    }

    return () => {
      newSocket.off("connect", onConnect);
      // Do NOT close the global socket here as it breaks navigation
    };
  }, [user, profile]);

  // Emit user_online when socket is ready and user is loaded


  // Fetch pending sessions (Optimized to avoid re-renders)
  const fetchPendingSessions = useCallback(async () => {
    if (!navigator.onLine) {
        console.warn("OFFLINE: Skipping session fetch");
        return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/chat/sessions/pending`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data && Array.isArray(res.data)) {
        setPendingSessions(prev => {
          // Optimization: Only update state if data has changed
          const isSame = JSON.stringify(prev) === JSON.stringify(res.data);
          return isSame ? prev : res.data;
        });
      } else {
        setPendingSessions(prev => (prev.length === 0 ? prev : []));
      }
    } catch (err) {
      console.error("Error fetching sessions:", err);
      // Don't clear sessions on error to prevent UI flash, unless it's a 401/403
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
         setPendingSessions([]);
      }
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchEarnings();
  }, []);

  // Setup socket listeners when socket is ready
  useEffect(() => {
    if (!socket) return;

    // Video call request
    socket.on("call:request", (data) => {
      console.log("Incoming call request:", data);

      // STRICT FILTER: Check ID and Name
      const myId = profile?.userId?._id || profile?.userId;
      const myName = user?.name || profile?.name;

      // 1. ID Check
      if (data.astrologerId && String(data.astrologerId) !== String(myId)) return;

      // 2. Name Check - DISABLED (Name mismatches shouldn't block calls if ID matches)
      // if (data.astrologerName && myName && data.astrologerName !== myName) return;

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

      // STRICT FILTER: Check ID and Name
      const myId = profile?.userId?._id || profile?.userId;
      const myName = user?.name || profile?.name;

      // 1. ID Check
      // payload might have astrologerId at top level
      if (payload.astrologerId && String(payload.astrologerId) !== String(myId)) return;

      // 2. Name Check - DISABLED
      // if (payload.astrologerName && myName && payload.astrologerName !== myName) return;

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

      setNotifications((n) => n + 1);
      playNotificationSound();

      // Refresh list from server to be safe - REMOVED to prevent API spam
      // fetchPendingSessions();
    });

    // Audio call request
    socket.on("audio:request", (data) => {
      console.log("Incoming audio call request:", data);

      // STRICT FILTER: Check ID and Name
      const myId = profile?.userId?._id || profile?.userId;
      const myName = user?.name || profile?.name;

      if (data.astrologerId && String(data.astrologerId) !== String(myId)) return;
      if (data.astrologerName && myName && data.astrologerName !== myName) return;

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
  }, [socket, fetchPendingSessions]);
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
  }, [profile?.userId, socket, fetchPendingSessions]);

  // Play notification sound
  // SUPER RELIABLE Notification Sound (works always when tab is open)
  const playNotificationSound = () => {
    const audio = notificationSoundRef.current;
    if (!audio) {
      console.warn("⚠️ Audio not initialized");
      // Try browser notification sound as fallback
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('New Request', {
          body: 'You have a new chat/call request',
          icon: '/logo.png',
          badge: '/logo.png',
          tag: 'astrologer-request',
          requireInteraction: true
        });
      }
      return;
    }

    // Reset audio to beginning
    audio.pause();
    audio.currentTime = 0;

    // Play with error handling
    const playPromise = audio.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log("🔔 Notification sound played successfully");
          // Vibrate on mobile if supported
          if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200]);
          }
        })
        .catch(err => {
          // Ignore AbortError which happens when sound is interrupted
          if (err.name !== 'AbortError') {
             console.warn("⚠️ Sound play failed:", err);
             // Fallback to visual notification
             if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('New Request', {
                  body: 'You have a new chat/call request',
                  icon: '/logo.png',
                  badge: '/logo.png',
                  tag: 'astrologer-request',
                });
             }
          }
        });
    }
  };



  // Add request to queue and show popup
  // Add request to queue
  const addToRequestQueue = (request) => {
    setRequestQueue((prev) => [...prev, request]);
  };

  // Auto-decline timer state
  const [autoDeclineTimer, setAutoDeclineTimer] = useState(30);

  // Process queue: Show popup if queue has items and no popup is showing
  useEffect(() => {
    if (!showIncomingPopup && requestQueue.length > 0) {
      setIncomingRequest(requestQueue[0]);
      setShowIncomingPopup(true);
      setAutoDeclineTimer(30); // Reset timer
      playNotificationSound();

      // Vibrate device - Strong pattern for incoming request
      if ('vibrate' in navigator) {
        // Pattern: [vibrate, pause, vibrate, pause, vibrate]
        navigator.vibrate([400, 200, 400, 200, 400]);
      }
    }
  }, [requestQueue, showIncomingPopup]);

  // Auto-decline countdown timer
  useEffect(() => {
    if (!showIncomingPopup || !incomingRequest) return;

    const timer = setInterval(() => {
      setAutoDeclineTimer((prev) => {
        if (prev <= 1) {
          // Auto-decline when timer reaches 0
          console.log("⏰ Auto-declining request due to timeout");
          rejectIncomingRequest(incomingRequest);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showIncomingPopup, incomingRequest]);

  // Handle next request in queue
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
        {
          headers: { Authorization: `Bearer ${token}` },
        }
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
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setEarnings(res.data.totalEarnings || 0);
    } catch (err) {
      console.error("Error fetching earnings:", err);
      setEarnings(0);
    }
  };

  const fetchChatHistory = async () => {
    try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/chat/sessions`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setChatSessions(res.data);
    } catch (err) {
        console.error("Error fetching chat history", err);
    }
  };


  useEffect(() => {
    if (activeTab === "inbox") {
      fetchPendingSessions();
    }
    if (activeTab === "history") {
        fetchChatHistory();
    }
  }, [activeTab, fetchPendingSessions]);




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
        toUserId: request.fromId, // Add User ID for robust targeting
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
        toUserId: request.fromId, // Add User ID
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
  // Reject incoming request from popup
  const rejectIncomingRequest = (request) => {
    console.log("❌ Rejecting request:", request);

    // 1. Optimistic UI Update: Close popup immediately
    setShowIncomingPopup(false);
    setIncomingRequest(null);

    // 2. Stop Sound
    if (notificationSoundRef.current) {
      notificationSoundRef.current.pause();
      notificationSoundRef.current.currentTime = 0;
    }

    // 3. Emit Reject Event (Background)
    setTimeout(() => {
       if (socket) {
          if (request.type === "chat") {
             rejectChat(request.sessionId);
          } else if (request.type === "video") {
             socket.emit("call:reject", { toSocketId: request.fromSocketId });
             // Remove locally
             setPendingVideoCalls(prev => prev.filter(v => v.id !== request.id));
          } else if (request.type === "audio") {
             socket.emit("audio:reject", { toSocketId: request.fromSocketId });
             setPendingAudioCalls(prev => prev.filter(v => v.id !== request.id));
          }
       }
    }, 100);

    // 4. Process Next Request
    handleNextRequest();
  };


  const toggleStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/astrologer/status`,
        // Just toggle isOnline. The backend might reset call availability, or we preserve it.
        // Assuming backend works with just status toggle or we send full object.
        // For now, let's just send the toggle request.
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProfile(res.data);
      // Also emit via socket
      if (socket) {
        if (!res.data.isOnline) {
             socket.emit("user_offline", { userId: profile.userId });
        } else {
             socket.emit("user_online", { userId: profile.userId });
        }
      }
      if(showOfflinePopup && res.data.isOnline) {
          setShowOfflinePopup(false);
      }
    } catch (err) {
      console.error("Error toggling status:", err);
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


  const acceptChat = (sessionId) => {
    if (!socket) return;

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
      // alert("Failed to reject chat. Please try again.");
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

      {/* Offline Status Popup */}
      {showOfflinePopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl relative">
            <button
              onClick={() => setShowOfflinePopup(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🌙</span>
            </div>
            <h2 className="text-xl font-bold mb-2">You are Offline</h2>
            <p className="text-gray-500 mb-6 text-sm">
              Go online to start receiving consultation requests and earning.
            </p>
            <button
              onClick={toggleStatus}
              className="w-full py-3 bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded-xl shadow-lg transform active:scale-95 transition-all"
            >
              Go Online Now
            </button>
          </div>
        </div>
      )}

      {/* Incoming Request Popup */}
      {showIncomingPopup && incomingRequest && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl relative border-4 border-yellow-400 animate-bounce" style={{
            animation: 'bounce 0.5s ease-in-out 3'
          }}>
             {/* Header */}
             <div className="bg-yellow-400 p-4 text-center">
                <h3 className="text-black font-bold text-lg flex items-center justify-center gap-2">
                   INCOMING {incomingRequest.type.toUpperCase()}
                   <span className="animate-ping w-2 h-2 bg-red-600 rounded-full"></span>
                </h3>
             </div>

             <div className="p-6 text-center">
                <div className="w-24 h-24 mx-auto mb-4 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100 shadow-inner">
                   {incomingRequest.type === 'video' && <Video size={40} className="text-green-600" />}
                   {incomingRequest.type === 'audio' && <Phone size={40} className="text-blue-600" />}
                   {incomingRequest.type === 'chat' && <MessageCircle size={40} className="text-yellow-600" />}
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-1">{incomingRequest.fromName}</h2>
                <p className="text-gray-500 text-sm mb-6">
                   {incomingRequest.type === 'chat' ? 'Wants to chat now' : 'Incoming call request'}
                </p>

                <div className="flex gap-3">
                   <button
                      onClick={() => rejectIncomingRequest(incomingRequest)}
                      className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl active:scale-95 transition-all"
                   >
                      Decline
                   </button>
                   <button
                      onClick={() => acceptIncomingRequest(incomingRequest)}
                      className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-md shadow-green-200 active:scale-95 transition-all animate-pulse"
                   >
                      Accept
                   </button>
                </div>

                {/* Auto decline bar */}
                <div className="mt-6">
                   <p className="text-xs text-gray-400 mb-1">Auto-decline in {autoDeclineTimer}s</p>
                   <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div
                         className="h-full bg-red-500 transition-all duration-1000 ease-linear"
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
      <main className="container mx-auto px-4 pt-6 space-y-6">

         {/* 1. Status Control Center */}
         {activeTab === 'overview' && (
         <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
               <span className="font-bold text-gray-900 text-lg">Your Availability</span>
               <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={profile.isOnline} onChange={toggleStatus} />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
               </label>
            </div>

            {profile.isOnline && (
               <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 text-green-700 rounded-lg"><Phone size={18} /></div>
                        <span className="font-medium text-sm">Audio Call</span>
                     </div>
                     <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={profile.isAudioCallAvailable} onChange={() => updateCallAvailability('audio', !profile.isAudioCallAvailable)} />
                         <div className="w-9 h-5 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                     </label>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 text-yellow-700 rounded-lg"><Video size={18} /></div>
                         <span className="font-medium text-sm">Video Call</span>
                     </div>
                     <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={profile.isVideoCallAvailable} onChange={() => updateCallAvailability('video', !profile.isVideoCallAvailable)} />
                         <div className="w-9 h-5 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                     </label>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-700 rounded-lg"><MessageCircle size={18} /></div>
                         <span className="font-medium text-sm">Chat</span>
                     </div>
                     <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={profile.isChatAvailable} onChange={() => updateCallAvailability('chat', !profile.isChatAvailable)} />
                         <div className="w-9 h-5 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                     </label>
                  </div>
               </div>
            )}
         </div>
         )}

         {/* 2. Stats Cards */}
         {activeTab === 'overview' && (
         <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center" onClick={() => setActiveTab('earnings')}>
               <div className="text-gray-400 text-xs font-semibold uppercase mb-1">Earnings</div>
               <div className="text-2xl font-bold text-gray-900">₹{earnings.toLocaleString()}</div>
               <div className="mt-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-md font-medium">View Details</div>
            </div>
             <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
               <div className="text-gray-400 text-xs font-semibold uppercase mb-1">Rating</div>
               <div className="text-2xl font-bold text-gray-900 flex items-center gap-1">
                  4.8 <Star size={16} className="text-yellow-400 fill-current" />
               </div>
               <div className="mt-2 text-xs text-gray-500">12 Reviews</div>
            </div>
         </div>
         )}


         {/* 3. INBOX Tab */}
         {activeTab === 'inbox' && (
            <div className="space-y-4">
               <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Incoming Requests</h2>
                  <button onClick={fetchPendingSessions} className="text-yellow-600 text-sm font-bold flex items-center gap-1">
                     <Sparkles size={14} /> Refresh
                  </button>
               </div>

               <div className="flex gap-2 pb-2 overflow-x-auto">
                    <button onClick={() => setInboxTab('chat')} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${inboxTab === 'chat' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'}`}>
                       Chat ({myPendingSessions.length})
                    </button>
                    <button onClick={() => setInboxTab('video')} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${inboxTab === 'video' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'}`}>
                       Video ({myPendingVideoCalls.length})
                    </button>
                    <button onClick={() => setInboxTab('audio')} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${inboxTab === 'audio' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'}`}>
                       Audio ({myPendingAudioCalls.length})
                    </button>
               </div>

               {/* Chat List */}
               {inboxTab === 'chat' && (
                  <div className="space-y-3">
                     {myPendingSessions.length === 0 ? (
                        <div className="text-center py-10 bg-white rounded-2xl border border-gray-100 border-dashed">
                           <MessageCircle size={40} className="mx-auto text-gray-300 mb-2" />
                           <p className="text-gray-500 font-medium">No pending chat requests</p>
                        </div>
                     ) : (
                        myPendingSessions.map(session => (
                           <div key={session.sessionId} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                              <div>
                                 <h3 className="font-bold text-gray-900">{session.userId?.name || session.client?.name || 'Client'}</h3>
                                 <p className="text-xs text-gray-500">Waited {Math.floor((new Date() - new Date(session.createdAt))/60000)}m ago</p>
                              </div>
                              <div className="flex gap-2">
                                 <button onClick={() => rejectChat(session.sessionId)} className="p-3 bg-gray-100 text-gray-600 rounded-xl active:scale-95"><X size={18} /></button>
                                 <button onClick={() => acceptChat(session.sessionId)} className="px-5 py-3 bg-yellow-400 text-black font-bold rounded-xl active:scale-95">Accept</button>
                              </div>
                           </div>
                        ))
                     )}
                  </div>
               )}

               {inboxTab === 'video' && (
                  <div className="space-y-3">
                     {myPendingVideoCalls.length === 0 ? (
                        <div className="text-center py-10 bg-white rounded-2xl border border-gray-100 border-dashed">
                           <Video size={40} className="mx-auto text-gray-300 mb-2" />
                           <p className="text-gray-500 font-medium">No pending video requests</p>
                        </div>
                     ) : (
                        myPendingVideoCalls.map(call => (
                           <div key={call.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                              <div>
                                 <h3 className="font-bold text-gray-900">{call.fromName || 'Client'}</h3>
                                 <p className="text-xs text-gray-500">Incoming Video Call...</p>
                              </div>
                              <div className="flex gap-2">
                                 <button onClick={() => acceptIncomingRequest(call)} className="px-5 py-3 bg-green-500 text-white font-bold rounded-xl active:scale-95 animate-pulse">Answer</button>
                              </div>
                           </div>
                        ))
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
                      {pendingAudioCalls.map((call) => (
                        <div
                          key={call.id}
                          className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-2xl p-6"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-bold text-gray-800">
                                {call.fromName || "Client"}
                              </p>
                              <p className="text-sm text-gray-600">
                                📞 Requesting audio call...
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => acceptIncomingRequest(call)}
                                className="bg-blue-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-600 transform hover:scale-105 animate-pulse shadow-lg"
                              >
                                Answer Call
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
         )}


         {/* 4. HISTORY Tab */}
         {activeTab === 'history' && (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
               <h2 className="text-xl font-bold text-gray-900 mb-4">Chat History</h2>
               <ChatHistoryList sessions={chatSessions} />
            </div>
         )}

         {/* 5. EARNINGS Tab (Placeholder) */}
         {activeTab === 'earnings' && (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center">
               <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign size={32} className="text-green-600" />
               </div>
               <h2 className="text-2xl font-bold text-gray-900 mb-1">Total Earnings</h2>
               <p className="text-4xl font-extrabold text-green-600 my-4">₹{earnings.toLocaleString()}</p>
               <p className="text-gray-500 text-sm">Payout scheduled for next Monday</p>
            </div>
         )}

         {/* 6. Quick Action Grid (Always on Overview) */}
         {activeTab === 'overview' && (
            <div className="grid grid-cols-3 gap-3">
               <button onClick={() => setShowChartModal(true)} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-2 active:scale-95 transition-transform">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                     <BarChart3 size={20} />
                  </div>
                  <span className="text-xs font-semibold">Charts</span>
               </button>
               <button onClick={() => setActiveTab('history')} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-2 active:scale-95 transition-transform">
                  <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center">
                     <Calendar size={20} />
                  </div>
                  <span className="text-xs font-semibold">History</span>
               </button>
               <button onClick={() => navigate('/astrology')} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-2 active:scale-95 transition-transform">
                  <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center">
                     <Sparkles size={20} />
                  </div>
                  <span className="text-xs font-semibold">Astrology</span>
               </button>
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
              ) : (
                <div className="flex items-center justify-center h-full text-white">
                  Audio Call not yet fully migrated to new system. Use Video Call.
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

         <div className="relative -top-5">
            <button onClick={toggleStatus} className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transform transition-transform active:scale-95 border-4 border-white ${profile.isOnline ? 'bg-yellow-400 text-black' : 'bg-gray-800 text-white'}`}>
               <Zap size={24} className="fill-current" />
            </button>
         </div>

         <button onClick={() => setActiveTab('history')} className={getTabClass('history')}>
            <Calendar size={24} className={activeTab === 'history' ? 'fill-current' : ''} />
            <span className="text-[10px] font-medium">History</span>
         </button>

         <button onClick={() => setActiveTab('earnings')} className={getTabClass('earnings')}>
            <User size={24} className={activeTab === 'earnings' ? 'fill-current' : ''} />
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
