// AstrologerDashboard.jsx
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  Clock,
  Edit2
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
  const [showProfileEdit, setShowProfileEdit] = useState(false);
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
      alert(request.type)
      setPendingSessions(prev => prev.filter(s => s.sessionId == request.sessionId));
    } else if (request.type === "video") {
       alert(request.type)
      setPendingVideoCalls(prev => prev.filter(v => v.id == request.id));
    } else if (request.type === "audio") {
       alert(request.type)
      setPendingAudioCalls(prev => prev.filter(a => a.id == request.id));
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

  const handleProfileUpdate = useCallback(async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
       name: formData.get('name'),
       experience: formData.get('experience'),
       ratePerMinute: formData.get('ratePerMinute'),
       bio: formData.get('bio'),
       isChatEnabled: formData.get('isChatEnabled') === 'on',
       isCallEnabled: formData.get('isCallEnabled') === 'on',
       isVideoEnabled: formData.get('isVideoEnabled') === 'on',
    };

    try {
       await apiClient.put('/api/astrologer/profile', data);
       fetchProfile();
       setShowProfileEdit(false);
       alert("Profile updated successfully!");
    } catch (err) {
       console.error("Failed to update profile", err);
       alert("Failed to update profile. Please try again.");
    }
  }, [fetchProfile]);

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
    <div className="min-h-screen bg-[#F8F9FE] font-sans text-slate-800 pb-24">
      {/* Top Header & Status Bar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-3">
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
                    <h1 className="text-lg font-bold text-slate-800 leading-tight">
                        {profile.userId?.name || "Astrologer"}
                    </h1>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Star size={12} className="text-yellow-400 fill-yellow-400" />
                        <span>4.9 (1.2k Reviews)</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                 <button onClick={toggleStatus} className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${profile.isOnline ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {profile.isOnline ? 'ONLINE' : 'OFFLINE'}
                 </button>
                 <button className="p-2 rounded-full bg-slate-50 text-slate-600 relative">
                    <Bell size={20} />
                    {notifications > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>}
                 </button>
            </div>
        </div>
      </header>

      <div className="px-4 py-6 space-y-6">

        {/* Availability Toggles */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Availability</h3>
            <div className="flex gap-4">
                {['Chat', 'Call', 'Video'].map((type) => (
                    <div key={type} className="flex-1 flex flex-col items-center gap-2">
                        <div className={`w-full h-10 rounded-xl flex items-center justify-center transition-all ${profile.isOnline ? 'bg-purple-50 text-purple-600' : 'bg-slate-50 text-slate-400'}`}>
                            {type === 'Chat' && <MessageCircle size={20} />}
                            {type === 'Call' && <Phone size={20} />}
                            {type === 'Video' && <FiVideo size={20} />}
                        </div>
                        <span className="text-xs font-medium text-slate-600">{type}</span>
                        <div className={`w-10 h-5 rounded-full relative transition-colors ${profile.isOnline ? 'bg-green-500' : 'bg-slate-300'}`}>
                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${profile.isOnline ? 'left-6' : 'left-1'}`}></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-2xl text-white shadow-lg shadow-indigo-200">
                <div className="flex items-center gap-2 mb-2 opacity-80">
                    <DollarSign size={16} />
                    <span className="text-xs font-medium">Earnings (Today)</span>
                </div>
                <div className="text-2xl font-bold">₹{earnings}</div>
                <div className="text-xs mt-1 text-indigo-100">+12% from yesterday</div>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                 <div className="flex items-center gap-2 mb-2 text-slate-500">
                    <Clock size={16} />
                    <span className="text-xs font-medium">Talk Time</span>
                </div>
                <div className="text-2xl font-bold text-slate-800">4h 12m</div>
                <div className="text-xs mt-1 text-green-500">Target reached! 🎯</div>
            </div>
        </div>

        {/* Feature Grid */}
        <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Quick Actions</h3>
            <div className="grid grid-cols-4 gap-4">
                {[
                    { icon: MessageCircle, label: 'Chat', color: 'bg-blue-100 text-blue-600', onClick: () => setActiveTab('inbox') },
                    { icon: FiVideo, label: 'Go Live', color: 'bg-red-100 text-red-600' },
                    { icon: Sparkles, label: 'Remedies', color: 'bg-yellow-100 text-yellow-600', action: () => setShowChartModal(true) }, // Using existing chart modal
                    { icon: Users, label: 'Waitlist', color: 'bg-purple-100 text-purple-600' },
                    { icon: BarChart3, label: 'Stats', color: 'bg-green-100 text-green-600' },
                    { icon: Calendar, label: 'Schedule', color: 'bg-orange-100 text-orange-600' },
                    { icon: Star, label: 'Reviews', color: 'bg-pink-100 text-pink-600' },
                    { icon: Settings, label: 'Settings', color: 'bg-slate-100 text-slate-600' },
                ].map((item, idx) => (
                    <div key={idx} onClick={item.onClick || item.action} className="flex flex-col items-center gap-2 cursor-pointer active:scale-95 transition-transform">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${item.color} shadow-sm`}>
                            <item.icon size={24} />
                        </div>
                        <span className="text-xs font-medium text-slate-600 text-center leading-tight">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* Suggested Users / Inbox Preview */}
        {activeTab === 'inbox' && (
            <div>
                 <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Requests</h3>
                    <span className="bg-purple-100 text-purple-600 px-2 py-0.5 rounded text-xs font-bold">{pendingSessions.length + pendingVideoCalls.length}</span>
                 </div>

                 <div className="space-y-3">
                    {/* Combine pending lists or just show sessions for now */}
                    {pendingSessions.length === 0 && pendingVideoCalls.length === 0 && (
                        <div className="text-center py-8 bg-white rounded-2xl border border-slate-100 border-dashed">
                             <p className="text-slate-400 text-sm">No pending requests</p>
                             <p className="text-xs text-slate-300 mt-1">Updates live automatically</p>
                        </div>
                    )}

                    {pendingSessions.map(session => (
                        <div key={session.sessionId} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
                             <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                     {session.client?.name?.[0] || 'C'}
                                 </div>
                                 <div>
                                     <h4 className="font-bold text-sm text-slate-800">{session.client?.name || 'Client'}</h4>
                                     <p className="text-xs text-slate-500">Chat Request • 2 mins ago</p>
                                 </div>
                             </div>
                             <div className="flex gap-2 items-center">
                                 {session.intakeDetails && (
                                     <button
                                         onClick={() => alert(JSON.stringify(session.intakeDetails, null, 2))}
                                         className="p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-colors"
                                         title="View Details"
                                     >
                                        <MessageCircle size={16} />
                                     </button>
                                 )}
                                 <button onClick={() => acceptChat(session.sessionId)} className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md shadow-green-200">Accept</button>
                                 <button onClick={() => rejectChat(session.sessionId)} className="bg-red-50 text-red-500 px-3 py-1.5 rounded-lg text-xs font-bold">Reject</button>
                             </div>
                        </div>
                    ))}

                    {pendingVideoCalls.map(call => (
                        <div key={call.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center animate-pulse border-purple-200">
                             <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
                                     <FiVideo size={18} />
                                 </div>
                                 <div>
                                     <h4 className="font-bold text-sm text-slate-800">{call.fromName || 'Client'}</h4>
                                     <p className="text-xs text-slate-500">Video Call • Just now</p>
                                 </div>
                             </div>
                             <div className="flex gap-2">
                                 <button onClick={() => acceptIncomingRequest(call)} className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md shadow-green-200">Accept</button>
                             </div>
                        </div>
                    ))}
                 </div>
            </div>
        )}

      </div>

      {/* Popups and Modals */}
      {showIncomingPopup && incomingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden relative">
             <div className="h-32 bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center relative overflow-hidden">
                <div className="absolute w-20 h-20 bg-white/10 rounded-full -top-10 -left-10"></div>
                <div className="absolute w-40 h-40 bg-white/10 rounded-full -bottom-20 -right-10"></div>
                <div className="text-center relative z-10">
                    <div className="w-20 h-20 mx-auto bg-white rounded-full p-1 shadow-lg mb-2">
                        <img
                            src={incomingRequest.fromImage || "https://ui-avatars.com/api/?name=" + incomingRequest.fromName}
                            className="w-full h-full rounded-full object-cover"
                        />
                    </div>
                    <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold backdrop-blur-md">Incoming {incomingRequest.type}</span>
                </div>
             </div>

             <div className="p-6 text-center">
                 <h2 className="text-xl font-bold text-slate-800 mb-1">{incomingRequest.fromName}</h2>
                 <p className="text-slate-500 text-sm mb-6">is requesting a connection</p>

                 <div className="flex gap-4">
                     <button onClick={() => rejectIncomingRequest(incomingRequest)} className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold flex items-center justify-center gap-2">
                        <X size={18} /> Decline
                     </button>
                     <button onClick={() => acceptIncomingRequest(incomingRequest)} className="flex-1 py-3 rounded-xl bg-green-500 text-white font-bold shadow-lg shadow-green-200 flex items-center justify-center gap-2 animate-bounce-subtle">
                        <Phone size={18} /> Accept
                     </button>
                 </div>
                 <div className="mt-4 text-xs text-slate-400">Auto-decline in {autoDeclineTimer}s</div>
             </div>
          </div>
        </div>
      )}

      {showOfflinePopup && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 text-center">
            <div className="bg-white p-6 rounded-3xl max-w-xs w-full">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🌙</div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">You are Offline</h3>
                <p className="text-slate-500 text-sm mb-4">Go online to receive calls and chats.</p>
                <div className="flex gap-2">
                    <button onClick={() => setShowOfflinePopup(false)} className="flex-1 py-2 text-slate-600 font-bold text-sm">Cancel</button>
                    <button onClick={toggleStatus} className="flex-1 py-2 bg-green-500 text-white rounded-xl font-bold text-sm shadow-md">Go Online</button>
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

      {/* Side Chat Panel Placeholder - Optional if needed */}
      {showChatPanel && (
          <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-2xl z-50 transform transition-transform translate-x-0">
               <div className="p-4 border-b flex justify-between items-center">
                   <h3 className="font-bold">Quick Chat</h3>
                   <button onClick={() => setShowChatPanel(false)}><X size={20}/></button>
               </div>
               <div className="p-4 text-center text-slate-400 mt-10">Select a chat to view</div>
          </div>
      )}

      {/* Profile Edit Modal */}
      {showProfileEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">
              <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                 <h3 className="text-lg font-bold text-gray-900">Edit Profile</h3>
                 <button onClick={() => setShowProfileEdit(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                    <X size={20} className="text-gray-500" />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                 <form id="profile-form" onSubmit={handleProfileUpdate} className="space-y-4">
                    <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                       <input
                         name="name"
                         defaultValue={profile?.name}
                         required
                         className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                       />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Experience (Years)</label>
                          <input
                            name="experience"
                            type="number"
                            defaultValue={profile?.experience}
                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                          />
                       </div>
                       <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹/min)</label>
                          <input
                            name="ratePerMinute"
                            type="number"
                            defaultValue={profile?.ratePerMinute}
                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                          />
                       </div>
                    </div>

                    <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                       <textarea
                         name="bio"
                         defaultValue={profile?.bio}
                         rows={3}
                         className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none transition-all"
                       />
                    </div>

                    <div className="bg-purple-50 p-4 rounded-xl space-y-3 border border-purple-100">
                       <h4 className="text-sm font-bold text-purple-900 mb-2 flex items-center gap-2">
                         <Sparkles size={14} /> Service Capabilities
                       </h4>

                       <label className="flex items-center justify-between cursor-pointer p-2 hover:bg-white rounded-lg transition-colors">
                          <span className="flex items-center gap-3 text-sm font-medium text-gray-700">
                             <div className="p-1.5 bg-green-100 text-green-600 rounded-lg">
                               <MessageCircle size={16} />
                             </div>
                             Chat Enabled
                          </span>
                          <input type="checkbox" name="isChatEnabled" defaultChecked={profile?.isChatEnabled !== false} className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500" />
                       </label>

                       <label className="flex items-center justify-between cursor-pointer p-2 hover:bg-white rounded-lg transition-colors">
                          <span className="flex items-center gap-3 text-sm font-medium text-gray-700">
                             <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                               <Phone size={16} />
                             </div>
                             Audio Call Enabled
                          </span>
                          <input type="checkbox" name="isCallEnabled" defaultChecked={profile?.isCallEnabled !== false} className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500" />
                       </label>

                       <label className="flex items-center justify-between cursor-pointer p-2 hover:bg-white rounded-lg transition-colors">
                          <span className="flex items-center gap-3 text-sm font-medium text-gray-700">
                             <div className="p-1.5 bg-rose-100 text-rose-600 rounded-lg">
                               <FiVideo size={16} />
                             </div>
                             Video Call Enabled
                          </span>
                          <input type="checkbox" name="isVideoEnabled" defaultChecked={profile?.isVideoEnabled !== false} className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500" />
                       </label>
                    </div>
                 </form>
              </div>

              <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
                 <button
                   type="button"
                   onClick={() => setShowProfileEdit(false)}
                   className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-xl transition-colors"
                 >
                   Cancel
                 </button>
                 <button
                   type="submit"
                   form="profile-form"
                   className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg transform active:scale-95"
                 >
                   Save Changes
                 </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default AstrologerDashboard;