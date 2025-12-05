// AstrologerDashboard.jsx
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import axios from 'axios';
import Modal from "../components/Modal";
import apiClient from "../utils/apiClient";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import ClientVideoCall from "./ClientcalltoAstrologerVideoCall";
import AudioCall from "./AudioCall";
import ChartModal from "../components/ChartModal";
import AstrologyQuickMenu from "../components/AstrologyQuickMenu";
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
  Settings,
  Clock
} from "lucide-react";
import { FiVideo } from "react-icons/fi";

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
  const [showOfflinePopup, setShowOfflinePopup] = useState(false);
  const [earnings, setEarnings] = useState(0);
  const [showChartModal, setShowChartModal] = useState(false);
  const [selectedChart, setSelectedChart] = useState(null);
  const [showChatPanel, setShowChatPanel] = useState(false); // New: For sliding chat panel
  const [isOnline, setIsOnline] = useState(true); // Online status for polling

  const audioRef = useRef(null);
  const notificationSoundRef = useRef(null);
  const navigate = useNavigate();

  // Initialize notification sound with fallback
  useEffect(() => {
    // Try local file first, fallback to online sound
    const soundUrls = [
      "/notification.mp3",
      "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3", // Fallback online sound
      "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGS57OihUBELTKXh8bllHAU2jdXvzn0vBSh+zPDajzsKElyx6OyrWBUIQ5zd8sFuJAUuhM/z24k2Bxdju+zpoVIRC0um4PG5ZRwFN43V78+ALwUnfszw2o87ChJcr+jrq1kVCEKb3fK/bSQFL4XP89uJNgcXY7vs6aFSEQtLpuDxuWUcBTeN1e/PgC8FJ37M8NqPOwsSXK/o66tZFQhCm93yv20kBS+Fz/PbiTYHF2O77OmhUhELS6bg8bllHAU3jdXvz4AvBSd+zPDajzsKElyx6OyrWRUIQpvd8r9tJAUvhc/z24k2Bxdju+zpoVIRC0um4PG5ZRwFN43V78+ALwUnfszw2o87ChJcr+jrq1kVCEKb3fK/bSQFL4XP89uJNgcXY7vs6aFSEQtLpuDxuWUcBTeN1e/PgC8FJ37M8NqPOwsSXK/o66tZFQhCm93yv20kBS+Fz/PbiTYHF2O77OmhUhELS6bg8bllHAU3jdXvz4AvBSd+zPDajzsKElyx6OyrWRUIQpvd8r9tJAUvhc/z24k2Bxdju+zpoVIRC0um4PG5ZRwFN43V78+ALwUnfszw2o87ChJcr+jrq1kVCEKb3fK/bSQFL4XP89uJNgcXY7vs6aFSEQtLpuDxuWUcBTeN1e/PgC8FJ37M8NqPOwsSXK/o66tZFQhCm93yv20kBS+Fz/PbiTYHF2O77OmhUhELS6bg8bllHAU3jdXvz4AvBSd+zPDajzsKElyx6OyrWRUIQpvd8r9tJAUvhc/z24k2Bxdju+zpoVIRC0um4PG5ZRwFN43V78+ALwUnfszw2o87ChJcr+jrq1kVCEKb3fK/bSQFL4XP89uJNgcXY7vs6aFSEQtLpuDxuWUcBTeN1e/PgC8FJ37M8NqPOwsSXK/o66tZFQhCm93yv20kBS+Fz/PbiTYHF2O77OmhUhELS6bg8bllHAU3jdXvz4AvBSd+zPDajzsKElyx6OyrWRUIQpvd8r9tJAUvhc/z24k2Bxdju+zpoVIRC0um4PG5ZRwFN43V78+ALwUnfszw2o87ChJcr+jrq1kVCEKb3fK/bSQFL4XP89uJNgcXY7vs6aFSEQtLpuDxuWUcBTeN1e/PgC8FJ37M8NqPOwsSXK/o66tZFQhCm93yv20kBS+Fz/PbiTYHF2O77OmhUhELS6bg8bllHAU3jdXvz4AvBSd+zPDajzsKElyx6OyrWRUIQpvd8r9tJAUvhc/z24k2Bxdju+zpoVIRC0um4PG5ZRwFN43V78+ALwUnfszw2o87ChJcr+jrq1kVCEKb3fK/bSQFL4XP89uJNgcXY7vs6Q=="
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

  // Fetch pending sessions (Moved up & wrapped in useCallback)
  const fetchPendingSessions = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/chat/sessions/pending');
      if (res.data && Array.isArray(res.data)) {
        setPendingSessions(res.data);
      } else {
        setPendingSessions([]);
      }
    } catch (err) {
      console.error("Error fetching sessions:", err);
      setPendingSessions([]);
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/astrologer/profile');
      setProfile(res.data);
    } catch (err) {
      console.error("Error fetching profile:", err);
      setProfile(false); // Stop loading
      // If unauthorized (401) or forbidden (403 - wrong role), it is handled by interceptors mostly but we can add secondary checks
      if (err.response) {
         if (err.response.status === 403) {
             console.warn("Access denied: Redirecting to main dashboard");
             navigate('/dashboard');
        }
      }
    }
  }, [navigate]);

  const fetchEarnings = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/astrologer/earnings');
      setEarnings(res.data.totalEarnings || 0);
    } catch (err) {
      console.error("Error fetching earnings:", err);
      setEarnings(0);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchEarnings();
  }, [fetchProfile, fetchEarnings]);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
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

    // Check if audio is already playing to avoid interruption errors
    if (!audio.paused) {
        audio.currentTime = 0; // Just restart if already playing
        return;
    }

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
          // Ignore AbortError (happens when audio is interrupted) or NotAllowedError (user interaction required)
          if (err.name !== 'AbortError' && err.name !== 'NotAllowedError') {
             console.warn("⚠️ Sound blocked by browser:", err.message);
          }

          // Show visual notification as fallback
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('New Request', {
              body: 'You have a new chat/call request',
              icon: '/logo.png',
              requireInteraction: true
            });
          }
        });
    }
  }, []);

  // Add request to queue
  const addToRequestQueue = useCallback((request) => {
    setRequestQueue((prev) => [...prev, request]);
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

      // Refresh list from server to be safe
      fetchPendingSessions();
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
  }, [socket, fetchPendingSessions, addToRequestQueue, playNotificationSound]);


  useEffect(() => {
    if (profile?.userId && socket) {
      // Register astrologer in onlineUsers map
      socket.emit("user_online", { userId: profile.userId });
      fetchPendingSessions();
    }
  }, [profile?.userId, socket, fetchPendingSessions]);


  // Auto-decline timer state
  const [autoDeclineTimer, setAutoDeclineTimer] = useState(30);

  // Reject incoming request from popup with callback to avoid hoisting issues with useeffect
  const rejectIncomingRequest = useCallback((request) => {
    console.log("❌ Rejecting request:", request);

    // 1. Optimistic UI Update: Close popup immediately
    setShowIncomingPopup(false);
    setIncomingRequest(null);

    // 2. Stop Sound
    if (notificationSoundRef.current) {
      notificationSoundRef.current.pause();
      notificationSoundRef.current.currentTime = 0;
    }

    // 3. Emit Socket Event
    if (socket && socket.connected) {
      if (request.type === "chat") {
        socket.emit("chat:reject", { sessionId: request.sessionId });
      } else if (request.type === "video") {
        socket.emit("call:reject", { toSocketId: request.fromSocketId });
      } else if (request.type === "audio") {
        socket.emit("audio:reject", { toSocketId: request.fromSocketId });
      }
    } else {
      console.warn("⚠️ Socket not connected, cannot send reject event to server");
    }

    // 4. Cleanup Local State
    if (request.type === "chat") {
      setPendingSessions(prev => prev.filter(s => s.sessionId !== request.sessionId));
    } else if (request.type === "video") {
      setPendingVideoCalls(prev => prev.filter(v => v.id !== request.id));
    } else if (request.type === "audio") {
      setPendingAudioCalls(prev => prev.filter(a => a.id !== request.id));
    }

    // 5. Process Next Request
    setTimeout(() => {
      setRequestQueue((prev) => {
        const [, ...remaining] = prev;
        return remaining;
      });
    }, 100); // Small delay to ensure state updates settle
  }, [socket]);

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
  }, [requestQueue, showIncomingPopup, playNotificationSound]);

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
  }, [showIncomingPopup, incomingRequest, rejectIncomingRequest]);

  // Handle next request in queue
  const handleNextRequest = useCallback(() => {
    setShowIncomingPopup(false);
    setIncomingRequest(null);
    setRequestQueue((prev) => {
      const [, ...remaining] = prev;
      return remaining;
    });
  }, []);

  useEffect(() => {
    if (activeTab === "inbox") {
      fetchPendingSessions();
    }
  }, [activeTab, fetchPendingSessions]);

  // Poll for new messages every second when online
  useEffect(() => {
    if (!isOnline) return;

    console.log("📡 Starting message polling (every 1 second)");

    const pollInterval = setInterval(() => {
      // Silently fetch pending sessions
      fetchPendingSessions();
    }, 1000); // Check every 1 second

    return () => {
      console.log("🛑 Stopping message polling");
      clearInterval(pollInterval);
    };
  }, [isOnline, fetchPendingSessions]);



  const acceptCall = useCallback(() => {
    if (!incomingCall || !socket) return;

    if (incomingCall.type === "chat") {
      socket.emit("chat:accept", { sessionId: incomingCall.callId });
      navigate(`/chat/${incomingCall.callId}`);
    } else if (incomingCall.type === "video") {
      const roomId = `video_${Date.now()}_${incomingCall.from}`;
      socket.emit("call:accept", {
        toSocketId: incomingCall.socketId,
        roomId,
        callId: incomingCall.callId // Pass callId
      });
      setActiveCallRoomId(roomId);
      setActiveTab("calls");
    }
    setIncomingCall(null);
  }, [incomingCall, socket, navigate]);

  const rejectCall = useCallback(() => {
    if (incomingCall && socket) {
      if (incomingCall.type === "video") {
          socket.emit("call:reject", { toSocketId: incomingCall.socketId });
      } else {
          // Chat reject logic if needed
      }
    }
    setIncomingCall(null);
  }, [incomingCall, socket]);

  // Accept incoming request from popup
  const acceptIncomingRequest = useCallback((request) => {
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
        roomId,
        callId: request.callId // Pass callId back to server
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
  }, [socket, navigate, handleNextRequest]);

  // Close popup without action
  const closeIncomingPopup = useCallback(() => {
    if (notificationSoundRef.current) {
      notificationSoundRef.current.pause();
      notificationSoundRef.current.currentTime = 0;
    }
    handleNextRequest();
  }, [handleNextRequest]);

  const toggleStatus = useCallback(async () => {
    try {
      const res = await apiClient.put('/api/astrologer/status');
      setProfile(res.data);
      // Close offline popup if it was open
      setShowOfflinePopup(false);
    } catch (err) {
      console.error("Error updating status:", err);
    }
  }, []);

  const checkOnlineStatus = useCallback(() => {
    if (!profile?.isOnline) {
      setShowOfflinePopup(true);
      return false;
    }
    return true;
  }, [profile?.isOnline]);

  // ACCEPT CHAT FROM LIST
  const acceptChat = useCallback((sessionId) => {
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
    socket.emit("chat:accept", { sessionId });
    navigate(`/chat/${sessionId}`);
  }, [socket, navigate]);

  // REJECT CHAT FROM LIST
  const rejectChat = useCallback(async (sessionId) => {
    if (socket && socket.connected) {
      socket.emit("chat:reject", { sessionId });
    }

    try {
      await apiClient.post(
        '/api/chat/debug/all',
        { sessionId }
      );
      setPendingSessions((prev) =>
        prev.filter((s) => s.sessionId !== sessionId)
      );
    } catch (err) {
      console.error("Error rejecting chat:", err);
      alert("Failed to reject chat. Please try again.");
    }
  }, [socket]);

  const handleAcceptChat = useCallback(async (session) => {
    try {
        // Re-use request acceptance logic
        // construct request object compatible with acceptChat or just call api
        // acceptNotification is used for sockets.
        // We need to call API /accept.
        // Let's use acceptIncomingRequest if possible but it expects a request object.
        // Or create a new handler.

        await axios.post(`${import.meta.env.VITE_API_URL}/api/chat/accept`, {
            sessionId: session.sessionId,
            clientId: session.client.id,
            ratePerMinute: session.ratePerMinute
        }, {
            headers: { Authorization: `Bearer ${auth.token}` }
        });

        // Navigate to chat
        navigate(`/chat/${session.sessionId}`);

    } catch (err) {
        console.error("Error accepting waitlist chat", err);
        alert("Failed to connect. Client may be offline.");
    }
  }, [axios, auth.token, navigate]); // Added dependencies for useCallback

  const menuItems = useMemo(() => [
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
      requiresOnline: true, // NEW: Requires online status
    },
    {
      id: "charts",
      icon: BarChart3,
      label: "Charts",
      color: "from-indigo-500 to-purple-500",
      badge: null,
      onClick: () => setShowChartModal(true), // Open chart modal
    },
    {
      id: "astrology",
      icon: Sparkles,
      label: "Astrology",
      color: "from-purple-500 to-indigo-500",
      badge: null,
      navigateTo: "/astrology", // Navigate to astrology dashboard
    },
    {
      id: "earnings",
      icon: DollarSign,
      label: "Earnings",
      color: "from-yellow-500 to-orange-500",
      badge: null,
    }
  ], [pendingSessions.length, pendingVideoCalls.length, pendingAudioCalls.length]);

  const handleTabChange = useCallback((item) => {
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
  }, [navigate, profile?.isOnline]);

  // Handle chart selection from FAB menu
  const handleChartSelect = useCallback((chartId) => {
    console.log('Selected chart:', chartId);

    switch(chartId) {
      case 'chat':
        // Toggle chat panel (slide in from right)
        if (!profile?.isOnline) {
          setShowOfflinePopup(true);
        } else {
          setShowChatPanel(prev => !prev);
        }
        break;
      case 'birth-chart':
        setSelectedChart('birth-chart');
        setShowChartModal(true);
        break;
      case 'porutham':
        setSelectedChart('porutham');
        setShowChartModal(true);
        break;
      case 'navamsa':
        setSelectedChart('navamsa');
        setShowChartModal(true);
        break;
      case 'behavior':
        setSelectedChart('behavior');
        setShowChartModal(true);
        break;
    }
  }, [profile?.isOnline]);

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

  if (profile === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-white text-center p-8 bg-white/10 rounded-2xl backdrop-blur">
          <h2 className="text-2xl font-bold mb-4">Profile Not Found</h2>
          <p className="mb-6">We couldn't load your astrologer profile.</p>
          <button onClick={() => window.location.reload()} className="px-6 py-2 bg-purple-600 rounded-lg hover:bg-purple-700">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FE] font-sans text-slate-800 pb-24 pt-safe-top">
      {/* 1. Top Header & Status */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-purple-50 px-4 py-3 pt-safe-top">
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="relative">
                    <img
                        src={profile.userId?.image || "https://ui-avatars.com/api/?name=" + profile.userId?.name}
                        alt="Profile"
                        className="w-10 h-10 rounded-full object-cover border-2 border-purple-100"
                    />
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${profile.isOnline ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                </div>
                <div>
                    <h1 className="text-sm font-bold text-slate-800 leading-tight">
                        {profile.userId?.name || "Astrologer"}
                    </h1>
                     <div className="flex items-center gap-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${profile.isOnline ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                           {profile.isOnline ? 'ONLINE' : 'OFFLINE'}
                        </span>
                     </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                 <button onClick={toggleStatus} className={`p-2 rounded-full transition-all ${profile.isOnline ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                    <Zap size={20} className={profile.isOnline ? 'fill-current' : ''} />
                 </button>
                 <button className="p-2 rounded-full bg-slate-50 text-slate-600 relative">
                    <Bell size={20} />
                    {notifications > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>}
                 </button>
            </div>
        </div>

        {/* 2. Scrollable Tabs */}
        <div className="mt-3 overflow-x-auto pb-1 scrollbar-hide flex gap-2">
           {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => handleTabChange(item)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                   activeTab === item.id
                   ? `bg-slate-800 text-white shadow-md`
                   : 'bg-white text-slate-500 border border-slate-100'
                }`}
              >
                  <item.icon size={14} />
                  {item.label}
                  {item.badge && <span className="bg-red-500 text-white px-1.5 rounded-full text-[10px]">{item.badge}</span>}
              </button>
           ))}
        </div>
      </header>

      {/* 3. Main Content Area */}
      <div className="px-4 py-6 space-y-6">

        {activeTab === 'overview' && (
           <div className="space-y-6 animate-fadeIn">
              {/* Horizontal Stats Scroll */}
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
                 {/* Earnings Card */}
                 <div className="snap-center shrink-0 w-72 bg-gradient-to-br from-indigo-600 to-purple-700 p-5 rounded-3xl text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-4 opacity-10"><DollarSign size={80} /></div>
                     <p className="text-indigo-100 text-xs font-medium mb-1">Total Earnings</p>
                     <h2 className="text-3xl font-bold mb-4">₹{earnings}</h2>
                     <div className="flex gap-2">
                        <span className="bg-white/20 px-2 py-1 rounded-lg text-[10px] backdrop-blur-sm">Today: +₹450</span>
                        <span className="bg-white/20 px-2 py-1 rounded-lg text-[10px] backdrop-blur-sm">Calls: 12</span>
                     </div>
                 </div>

                 {/* Waitlist Card */}
                 <div
                   onClick={() => setActiveTab('waitlist')}
                   className="snap-center shrink-0 w-72 bg-white p-5 rounded-3xl border border-purple-100 shadow-lg relative overflow-hidden"
                 >
                     <div className="absolute top-0 right-0 p-4 opacity-5 text-purple-600"><Clock size={80} /></div>
                     <div className="flex justify-between items-start mb-2">
                        <p className="text-slate-400 text-xs font-bold uppercase">Waitlist</p>
                        <span className="bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full text-xs font-bold">
                           {pendingSessions.filter(s => s.status === 'waitlist').length} Queued
                        </span>
                     </div>
                     <h2 className="text-3xl font-bold text-slate-800 mb-4">{pendingSessions.filter(s => s.status === 'waitlist').length}</h2>
                     <button className="w-full py-2 bg-purple-50 text-purple-600 rounded-xl text-xs font-bold">View Queue</button>
                 </div>
              </div>

              {/* Quick Actions Grid */}
              <div>
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">Quick Actions</h3>
                 <div className="grid grid-cols-4 gap-3">
                    {[
                        { icon: MessageCircle, label: 'Chat', color: 'bg-blue-50 text-blue-600', onClick: () => setActiveTab('inbox') },
                        { icon: FiVideo, label: 'Live', color: 'bg-red-50 text-red-600', action: () => alert('Go Live feature coming soon') },
                        { icon: Sparkles, label: 'Chart', color: 'bg-purple-50 text-purple-600', action: () => setShowChartModal(true) },
                        { icon: Calendar, label: 'Plan', color: 'bg-orange-50 text-orange-600', action: () => alert('Schedule feature coming soon') },
                    ].map((item, idx) => (
                        <div key={idx} onClick={item.onClick || item.action} className="flex flex-col items-center gap-2 cursor-pointer active:scale-95 transition-transform bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.color}`}>
                                <item.icon size={20} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-600">{item.label}</span>
                        </div>
                    ))}
                 </div>
              </div>

              {/* Recent Activity / Pending Preview */}
              <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">Recent Requests</h3>
                  {pendingSessions.slice(0, 3).map(session => (
                      <div key={session.sessionId} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-50 mb-3 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500">
                                  {session.client?.name?.[0]}
                              </div>
                              <div>
                                  <h4 className="font-bold text-sm text-slate-800">{session.client?.name}</h4>
                                  <p className="text-[10px] text-slate-400 capitalize">{session.status} • {new Date(session.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                              </div>
                          </div>
                          <button onClick={() => acceptChat(session.sessionId)} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold">Accept</button>
                      </div>
                  ))}
                  {pendingSessions.length === 0 && <p className="text-center text-slate-400 text-xs py-4">No recent requests</p>}
              </div>
           </div>
        )}

        {/* Inbox Tab (Existing Logic, New UI) */}
        {activeTab === 'inbox' && (
            <div className="space-y-4 animate-fadeIn">
                 {pendingSessions.length === 0 && pendingVideoCalls.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MessageCircle size={32} className="text-slate-300" />
                        </div>
                        <p className="text-slate-400 font-medium">Inbox is empty</p>
                    </div>
                 ) : (
                    <>
                    {pendingSessions.map(session => (
                        <div key={session.sessionId} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                             <div className="flex justify-between items-start mb-3">
                                 <div className="flex items-center gap-3">
                                     <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg">
                                         {session.client?.name?.[0]}
                                     </div>
                                     <div>
                                         <h4 className="font-bold text-slate-800">{session.client?.name}</h4>
                                         <span className="inline-block bg-blue-100 text-blue-600 text-[10px] px-2 py-0.5 rounded-full font-bold">Chat Request</span>
                                     </div>
                                 </div>
                                 <span className="text-xs text-slate-400">{new Date(session.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                             </div>
                             <div className="flex gap-2 mt-4">
                                 <button onClick={() => acceptChat(session.sessionId)} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-200">Accept Chat</button>
                                 <button onClick={() => rejectChat(session.sessionId)} className="flex-1 bg-red-50 text-red-500 py-3 rounded-xl font-bold text-sm">Decline</button>
                             </div>
                        </div>
                    ))}
                    {/* Video Calls would map here similarly */}
                    </>
                 )}
            </div>
        )}

        {/* Waitlist Tab (Reused Logic) */}
        {activeTab === 'waitlist' && (
            <div className="space-y-4 animate-fadeIn">
                {pendingSessions.filter(s => s.status === 'waitlist').length === 0 ? (
                    <div className="text-center py-20">
                         <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                             <Clock size={32} className="text-purple-300" />
                         </div>
                         <p className="text-slate-400 font-medium">No waitlisted clients</p>
                    </div>
                ) : (
                    pendingSessions.filter(s => s.status === 'waitlist').map(session => (
                        <div key={session.sessionId} className="bg-white p-4 rounded-2xl shadow-sm border border-purple-50">
                             <div className="flex items-center gap-3 mb-3">
                                 <img
                                     src={`https://ui-avatars.com/api/?name=${session.client.name}`}
                                     className="w-12 h-12 rounded-full border-2 border-purple-100"
                                     alt={session.client.name}
                                 />
                                 <div>
                                     <h4 className="font-bold text-slate-800">{session.client.name}</h4>
                                     <p className="text-xs text-slate-500">Waited: {Math.floor((new Date() - new Date(session.createdAt)) / 60000)}m</p>
                                 </div>
                             </div>
                             {session.client.intakeDetails?.name && (
                                <div className="bg-purple-50 p-2 rounded-xl text-xs text-purple-700 mb-3 border border-purple-100">
                                   <strong>Intake:</strong> {session.client.intakeDetails.name}, {session.client.intakeDetails.dateOfBirth}
                                </div>
                             )}
                             <button onClick={() => handleAcceptChat(session)} className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-purple-200">
                                Chat Now
                             </button>
                        </div>
                    ))
                )}
            </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
            <div className="bg-white p-6 rounded-3xl shadow-sm animate-fadeIn">
                 <h2 className="text-xl font-bold mb-6">Edit Profile</h2>
                 <form onSubmit={async (e) => {
                    e.preventDefault();
                    // ... existing logic ...
                    try {
                        const formData = new FormData(e.target);
                        const updates = Object.fromEntries(formData.entries());
                        const res = await apiClient.put('/api/astrologer/profile', updates);
                        setProfile(prev => ({ ...prev, ...res.data }));
                        alert('Profile updated!');
                    } catch (err) { alert('Failed'); }
                 }} className="space-y-4">
                     <div>
                        <label className="text-xs font-bold text-slate-400 uppercase">Nickname</label>
                        <input name="nickName" defaultValue={profile?.nickName} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mt-1 font-bold text-slate-800" />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="text-xs font-bold text-slate-400 uppercase">Rate (₹)</label>
                            <input name="ratePerMinute" type="number" defaultValue={profile?.ratePerMinute} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mt-1 font-bold text-slate-800" />
                         </div>
                         <div>
                            <label className="text-xs font-bold text-slate-400 uppercase">Exp (Yrs)</label>
                            <input name="experience" defaultValue={profile?.experience} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mt-1 font-bold text-slate-800" />
                         </div>
                     </div>
                     <button className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold mt-4">Save Changes</button>
                 </form>
            </div>
        )}

      </div>

      {/* Full Screen Incoming Request (Preserved) */}
      {showIncomingPopup && incomingRequest && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-md p-6 animate-fadeIn text-white">
           <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-white/10 rounded-full animate-ping-slow"></div>
           </div>

           <div className="relative z-10 w-full max-w-sm text-center">
             <div className="mb-6 relative inline-block">
                <div className="w-28 h-28 mx-auto rounded-full p-1 bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse">
                    <img
                        src={incomingRequest.fromImage || "https://ui-avatars.com/api/?name=" + incomingRequest.fromName}
                        className="w-full h-full rounded-full object-cover border-4 border-slate-900"
                    />
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white text-slate-900 font-bold px-4 py-1 rounded-full text-xs uppercase tracking-wider shadow-lg whitespace-nowrap">
                    {incomingRequest.type} Request
                </div>
             </div>

             <h2 className="text-3xl font-bold mb-1">{incomingRequest.fromName}</h2>
             <p className="text-slate-400 text-sm mb-8">is requesting to connect...</p>

             <div className="space-y-3">
                 <button onClick={() => acceptIncomingRequest(incomingRequest)} className="w-full py-4 rounded-xl bg-green-500 text-white text-lg font-bold shadow-xl shadow-green-900/20 active:scale-95 transition-transform flex items-center justify-center gap-2">
                    <Phone size={20} className="fill-current" /> Accept
                 </button>

                 <button onClick={() => rejectIncomingRequest(incomingRequest)} className="w-full py-3 rounded-xl bg-slate-800 text-slate-400 font-bold active:scale-95 transition-transform flex items-center justify-center gap-2">
                    <X size={18} /> Decline
                 </button>
             </div>

             <div className="mt-6 text-slate-600 text-xs">
                Auto-decline in <span className="text-white font-mono">{autoDeclineTimer}s</span>
             </div>
           </div>
        </div>
      )}

      {/* Offline Popup */}
      {showOfflinePopup && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 text-center">
            <div className="bg-white p-6 rounded-3xl max-w-xs w-full animate-bounce-in">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🌙</div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">You are Offline</h3>
                <p className="text-slate-500 text-sm mb-4">Go online to receive calls and chats.</p>
                <div className="flex gap-2">
                    <button onClick={() => setShowOfflinePopup(false)} className="flex-1 py-3 text-slate-500 font-bold text-sm">Cancel</button>
                    <button onClick={toggleStatus} className="flex-1 py-3 bg-green-500 text-white rounded-xl font-bold text-sm shadow-md">Go Online</button>
                </div>
            </div>
        </div>
      )}

      {showChartModal && (
        <ChartModal
          show={showChartModal}
          onClose={() => setShowChartModal(false)}
          type={selectedChart}
        />
      )}

    </div>
  );
};

export default AstrologerDashboard;