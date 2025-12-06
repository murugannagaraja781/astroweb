 import { useEffect, useState, useRef, useContext, useCallback } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";

import AuthContext from "../context/AuthContext";
import ChartModal from "../components/ChartModal";
import { Send, Mic, MicOff, Star, Crown, Gem, Sparkles, ArrowLeft, Brain, Heart, Clock, User, Calendar, MapPin, X } from "lucide-react";

// Single shared socket instance
const socket = io(
  import.meta.env.VITE_API_URL || "https://astroweb-production.up.railway.app",
  { autoConnect: false }
);

const Chat = () => {
  const { user } = useContext(AuthContext);
  const { id } = useParams(); // sessionId

  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUser, setOtherUser] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [error, setError] = useState(null);
  const [showChartModal, setShowChartModal] = useState(false);
  const [selectedChart, setSelectedChart] = useState(null);
  const [showIntakeInfoModal, setShowIntakeInfoModal] = useState(false); // New state for intake modal

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const messagesEndRef = useRef(null);

  // Auto scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load chat history from REST
  const fetchChat = useCallback(async () => {
    if (!id) return;
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/chat/history/session/${id}`,
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );
      setConversation(res.data.messages || []);
      setOtherUser(null);
    } catch (error) {
      console.error("Error fetching chat:", error);
    }
  }, [id]);

  // Fetch session info from REST
  const fetchSessionInfo = useCallback(async () => {
    if (!id) return;
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/chat/session/${id}`,
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );
      setSessionInfo(res.data);
    } catch (error) {
      console.error("Error fetching session info:", error);
    }
  }, [id]);

  // Main socket + data setup
  useEffect(() => {
    if (!user?.id || !id) return;

    // Attach identity to socket
    socket.io.opts.query = { username: user.name, userId: user.id };

    if (!socket.connected) {
      socket.connect();
    }

    console.log("[Chat] Joining session:", id);
    socket.emit("user_online", { userId: user.id });
    socket.emit("join_chat", { sessionId: id, userId: user.id });

    // Initial load
    fetchChat();
    fetchSessionInfo();

    // Poll session status every 2 seconds (max 30s)
    const statusPoll = setInterval(() => {
      fetchSessionInfo();
    }, 2000);

    const statusTimeout = setTimeout(() => {
      clearInterval(statusPoll);
    }, 30000);

    // ---- SOCKET LISTENERS ----

    const onConnectError = (err) => {
      console.error("[socket] connect_error", err);
      setError(`Connection error: ${err.message}. Please refresh the page.`);
    };

    const onDisconnect = (reason) => {
      console.warn("[socket] disconnect:", reason);
      if (reason === "io server disconnect") {
        setError("Disconnected by server. Please refresh and try again.");
      } else {
        setError("Connection lost. Reconnecting...");
      }
    };

    const onReconnect = () => {
      console.log("[socket] reconnect");
      setError(null);
      socket.emit("join_chat", { sessionId: id, userId: user.id });
      fetchChat();
      fetchSessionInfo();
    };

    const onChatMessage = (newMessage) => {
      setConversation((prev) => {
        // 1. TEMP ID MATCH → Replace pending message
        if (newMessage.tempId) {
          const exists = prev.some((msg) => msg.tempId === newMessage.tempId);
          if (exists) {
            return prev.map((msg) =>
              msg.tempId === newMessage.tempId
                ? { ...msg, ...newMessage, pending: false }
                : msg
            );
          }
        }

        // 2. REAL DB ID MATCH → do NOT add again
        if (newMessage._id) {
          const exists = prev.some((msg) => msg._id === newMessage._id);
          if (exists) return prev;
        }

        // 3. Otherwise add new message normally
        return [...prev, newMessage];
      });
    };

    const onChatTyping = (data) => {
      if (data.userId && data.userId !== user.id) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 1500);
      }
    };

    const onChatSessionInfo = (info) => {
      console.log("[Chat] Received session info:", info);
      setSessionInfo(info);
    };

    const onChatAccepted = (data) => {
      console.log("[Chat] Chat accepted:", data);
      fetchSessionInfo();
    };

    const onChatAcceptedByAstrologer = (data) => {
      console.log("[Chat] Astrologer accepted your request:", data);
      fetchSessionInfo();
    };

    const onChatStarted = (data) => {
      console.log("[Chat] Chat started:", data);
      fetchSessionInfo();
    };

    const onWalletUpdate = (data) => {
      // data: { sessionId, balance, elapsed }
      if (data.elapsed) {
        setSessionDuration(data.elapsed);
      }
    };

    // attach listeners
    socket.on("connect_error", onConnectError);
    socket.on("disconnect", onDisconnect);
    socket.on("reconnect", onReconnect);
    socket.on("chat:message", onChatMessage);
    socket.on("chat:typing", onChatTyping);
    socket.on("chat:session_info", onChatSessionInfo);
    socket.on("chat:accepted", onChatAccepted);
    socket.on("chat:accepted_by_astrologer", onChatAcceptedByAstrologer);
    socket.on("chat:started", onChatStarted);
    socket.on("wallet:update", onWalletUpdate);

    // cleanup
    return () => {
      clearInterval(statusPoll);
      clearTimeout(statusTimeout);

      socket.off("connect_error", onConnectError);
      socket.off("disconnect", onDisconnect);
      socket.off("reconnect", onReconnect);
      socket.off("chat:message", onChatMessage);
      socket.off("chat:typing", onChatTyping);
      socket.off("chat:session_info", onChatSessionInfo);
      socket.off("chat:accepted", onChatAccepted);
      socket.off("chat:accepted_by_astrologer", onChatAcceptedByAstrologer);
      socket.off("chat:started", onChatStarted);
      socket.off("wallet:update", onWalletUpdate);
    };
  }, [id, user?.id, user?.name, fetchChat, fetchSessionInfo]);

  useEffect(scrollToBottom, [conversation]);

  // Session status watcher (optional)
  useEffect(() => {
    if (sessionInfo?.status === "active") {
      console.log("[Chat] Session is now active, UI should update");
    }
  }, [sessionInfo?.status]);

  // Session timer (fallback if socket doesn't send updates often enough)
  useEffect(() => {
    if (!sessionInfo?.startedAt || sessionInfo.status !== "active") return;

    const interval = setInterval(() => {
      const start = new Date(sessionInfo.startedAt);
      const now = new Date();
      const diff = Math.floor((now - start) / 1000);
      setSessionDuration(diff);
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionInfo]);

  // Helper function to format duration
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // --- Send Message ---
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    if (!user?.id || !id) return;

    if (!socket.connected) {
      setError("Not connected to chat server. Please refresh.");
      return;
    }

    const tempId =
      "tmp_" + Date.now() + "_" + Math.random().toString(36).slice(2);

    const newMsg = {
      tempId,
      senderId: user.id,
      text: message,
      timestamp: new Date().toISOString(),
      pending: true,
    };

    // Optimistic UI
    setConversation((prev) => [...prev, newMsg]);

    socket.emit("chat:message", {
      sessionId: id,
      senderId: user.id,
      text: message,
      tempId,
    });

    setMessage("");
  };

  // --- Typing Event ---
  const handleTyping = () => {
    if (!user?.id || !id) return;
    if (!socket.connected) return;

    socket.emit("chat:typing", { sessionId: id, userId: user.id });
  };

  // --- File Upload ---
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);
    formData.append("chatId", id);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/chat/upload/image`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const { url } = res.data;

      // Send image message via socket
      socket.emit("chat:message", {
        sessionId: id,
        senderId: user.id,
        text: "Sent an image",
        type: "image",
        mediaUrl: url,
      });
    } catch (err) {
      console.error("Error uploading image:", err);
      alert("Failed to upload image");
    }
  };

  // --- Audio Recording ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("voice", blob);
        formData.append("chatId", id);

        try {
          const token = localStorage.getItem("token");
          const res = await axios.post(
            `${import.meta.env.VITE_API_URL}/api/chat/upload/voice`,
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
                Authorization: `Bearer ${token}`,
              },
            }
          );

          const { url } = res.data;

          const audioMsg = {
            senderId: user.id,
            audioUrl: url,
            timestamp: new Date().toISOString(),
            status: "sent",
          };

          setConversation((prev) => [...prev, audioMsg]);

          socket.emit("chat:message", {
            sessionId: id,
            senderId: user.id,
            text: "Voice message",
            type: "audio",
            mediaUrl: url,
            duration: 0, // You might want to calculate duration
          });
        } catch (err) {
          console.error("Error uploading voice note:", err);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access denied");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
    }
  };

  // ---------- UI ----------
  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-gray-300 relative overflow-hidden">
      {/* Error Popup */}
      {error && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md mx-4">
            <div className="text-red-500 text-6xl mb-4 text-center">⚠️</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Connection Error
            </h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => setError(null)}
              className="w-full bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <style>{`
        input,
        textarea,
        select {
          color: #1f2937 !important; /* gray-800 */
          font-size: 16px; /* Prevent IOS zoom */
        }
        .message-container {
          padding-bottom: 20px; /* Space for scroll */
        }
        /* Sticky Footer adjustments */
        .chat-footer {
          z-index: 30;
        }
      `}</style>

      {/* Background stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-2 h-2 bg-purple-400 rounded-full opacity-60 animate-pulse"></div>
        <div className="absolute top-20 right-20 w-1 h-1 bg-blue-300 rounded-full opacity-40"></div>
        <div className="absolute bottom-32 left-1/4 w-1 h-1 bg-indigo-500 rounded-full opacity-50 animate-pulse delay-700"></div>
        <div className="absolute top-1/2 right-16 w-1 h-1 bg-purple-300 rounded-full opacity-30"></div>
        <div className="absolute bottom-20 right-1/3 w-2 h-2 bg-blue-400 rounded-full opacity-40 animate-pulse delay-300"></div>
      </div>

      {/* Header */}
      <div className="flex-none relative flex items-center justify-between p-3 md:p-4 bg-slate-900/90 backdrop-blur-lg border-b border-purple-500/30 z-20">
        <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
          <button
            onClick={() => window.history.back()}
            className="p-1.5 md:p-2 hover:bg-purple-500/20 rounded-full transition-colors flex-shrink-0"
            title="Go back"
          >
            <ArrowLeft size={20} className="text-purple-200" />
          </button>

          <div className="p-1.5 md:p-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex-shrink-0">
            <Crown size={18} className="text-white md:w-5 md:h-5" />
          </div>

          <div className="min-w-0">
            <h1 className="text-base md:text-xl font-bold text-gray-100 truncate">
              {user?.role === "client"
                ? sessionInfo?.astrologer?.name || "Astrologer"
                : sessionInfo?.client?.name || "Client"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          <div className="hidden md:flex items-center gap-2 text-sm text-purple-300">
            <Star size={16} className="fill-purple-400 text-purple-400" />
            <span>₹{sessionInfo?.ratePerMinute || 0}/min</span>
          </div>

          {/* Timer Display */}
          <div className="bg-slate-800/60 px-2 md:px-3 py-1 md:py-1.5 rounded-lg border border-purple-500/30 text-purple-200 font-mono text-xs md:text-sm">
            {sessionDuration > 0 ? formatDuration(sessionDuration) : "00:00"}
          </div>

          <button
            onClick={() => {
              if (
                window.confirm("Are you sure you want to end this chat session?")
              ) {
                socket.emit("chat:end", { sessionId: id });
                window.history.back();
              }
            }}
            className="p-2 md:px-4 md:py-2 bg-red-500/20 text-red-300 border border-red-500/30 rounded-xl md:rounded-xl text-sm font-bold hover:bg-red-500/30 transition-all flex items-center justify-center"
            title="End Chat"
          >
             <span className="md:hidden">✕</span>
             <span className="hidden md:inline">End Chat</span>
          </button>

          {sessionInfo?.intakeDetails && (
             <button
                onClick={() => setShowIntakeInfoModal(true)}
                className="p-1.5 md:p-2 bg-purple-500/20 rounded-full text-purple-300 hover:bg-purple-500/30 transition-colors flex-shrink-0"
                title="View Client Intake Details"
             >
                <User size={18} className="md:w-5 md:h-5" />
             </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto relative z-0 scroll-smooth">
        <div className="max-w-4xl mx-auto min-h-full flex flex-col justify-end">
          <div className="px-4 py-4 space-y-4 message-container">

            {/* System Message: Intake Details Card (Visible to Astrologers) */}
            {sessionInfo?.intakeDetails && (user?.role === 'astrologer' || user?.role === 'admin') && (
              <div className="mx-auto max-w-sm mb-6 relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-200"></div>
                  <div className="relative bg-[#1a1a2e] border border-white/10 p-5 rounded-2xl shadow-xl">
                    <div className="flex items-center gap-3 mb-3 border-b border-white/10 pb-2">
                       <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                          <User size={16} className="text-purple-300" />
                       </div>
                       <h3 className="font-serif font-bold text-white tracking-wide">Birth Details</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                       <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Name</p>
                          <p className="text-gray-200 font-medium">{sessionInfo.intakeDetails.name}</p>
                       </div>
                       <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Date of Birth</p>
                          <p className="text-gray-200 font-medium">{sessionInfo.intakeDetails.dateOfBirth}</p>
                       </div>
                       <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Time</p>
                          <p className="text-gray-200 font-medium">{sessionInfo.intakeDetails.timeOfBirth}</p>
                       </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Place</p>
                          <p className="text-gray-200 font-medium truncate" title={sessionInfo.intakeDetails.placeOfBirth}>
                            {sessionInfo.intakeDetails.placeOfBirth}
                          </p>
                       </div>
                       {(sessionInfo.intakeDetails.gender) && (
                         <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Gender</p>
                            <p className="text-gray-200 font-medium">{sessionInfo.intakeDetails.gender}</p>
                         </div>
                       )}
                    </div>
                  </div>
              </div>
            )}

            {conversation.length === 0 ? (
              <div className="text-center py-12">
                {sessionInfo?.status === "requested" ? (
                  <>
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-purple-800 rounded-full mb-4 animate-pulse">
                      <Sparkles className="text-purple-200" size={24} />
                    </div>
                    <h3 className="text-lg font-semibold text-purple-200 mb-2">
                      Connecting to Cosmos...
                    </h3>
                    <p className="text-purple-300 text-sm max-w-md mx-auto">
                      Waiting for astrologer to accept your chat request...
                    </p>
                  </>
                ) : (
                  <>
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-yellow-600 to-yellow-800 rounded-full mb-4">
                      <Gem className="text-yellow-200" size={24} />
                    </div>
                    <h3 className="text-lg font-semibold text-yellow-200 mb-2">
                      Welcome to Royal Astrology
                    </h3>
                    <p className="text-yellow-300 text-sm max-w-md mx-auto">
                      Begin your royal consultation with our expert astrologer.
                      Share your birth details and questions for divine guidance.
                    </p>
                  </>
                )}
              </div>
            ) : (
              conversation.map((msg, index) => {
                const isMe = msg.senderId === user.id || msg.sender === user.id;
                const isAstrologerMsg = user.role === "client" && !isMe;

                const senderName = isMe
                  ? user.name
                  : (user.role === "client"
                      ? sessionInfo?.astrologer?.name
                      : sessionInfo?.client?.name) || "User";

                const getInitials = (name) => {
                  if (!name) return "?";
                  return name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);
                };

                return (
                  <div
                    key={index}
                    className={`flex gap-2 ${
                      isMe ? "flex-row-reverse" : "flex-row"
                    } items-end`}
                  >
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        isMe
                          ? "bg-gradient-to-br from-purple-600 to-indigo-600 text-white"
                          : "bg-gradient-to-br from-slate-600 to-slate-800 text-white"
                      }`}
                    >
                      {getInitials(senderName)}
                    </div>

                    <div
                      className={`flex flex-col ${
                        isMe ? "items-end" : "items-start"
                      } max-w-[75%] md:max-w-[65%]`}
                    >
                      <span
                        className={`text-[10px] mb-1 font-medium flex items-center gap-1 ${
                          isMe ? "text-purple-300" : "text-gray-400"
                        }`}
                      >
                        {isAstrologerMsg && <Crown size={10} />}
                        {senderName}
                      </span>

                      <div
                        className={`p-4 rounded-2xl shadow-lg relative ${
                          isMe
                            ? "bg-gradient-to-br from-purple-600 to-indigo-700 text-white border border-purple-500/30 rounded-tr-none"
                            : "bg-gradient-to-br from-slate-700 to-slate-800 text-gray-100 border border-slate-600/30 rounded-tl-none"
                        }`}
                      >
                        {isMe && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-400 rounded-full opacity-80 shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
                        )}

                        {msg.text && (
                          <p className="text-sm leading-relaxed font-medium">
                            {msg.text}
                          </p>
                        )}

                        {msg.audioUrl && (
                          <div className="mt-2">
                            <audio
                              controls
                              className="w-48 h-8 rounded-lg bg-black/20 border border-white/10"
                            >
                              <source src={msg.audioUrl} type="audio/mp3" />
                            </audio>
                          </div>
                        )}

                        <div
                          className={`text-[10px] mt-2 flex items-center gap-1 ${
                            isMe
                              ? "text-purple-200 justify-end"
                              : "text-gray-400 justify-start"
                          }`}
                        >
                          {msg.timestamp &&
                            new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          {isMe && <span>✓</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {isTyping && (
              <div className="flex justify-start">
                <div className="max-w-[70%] p-4 rounded-2xl bg-slate-800/80 backdrop-blur-sm border border-slate-700/50">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-300"></div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {user?.role === "astrologer" ? "Client" : "Astrologer"} is
                    typing...
                  </p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="flex-none chat-footer bg-slate-900 pt-3 pb-safe-or-4 border-t border-slate-800 w-full">
        <div className="max-w-4xl mx-auto px-4 pb-4">
          {isRecording && (
            <div className="text-center mb-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-full">
                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                <span className="text-red-300 text-sm">
                  Recording... Click to stop
                </span>
              </div>
            </div>
          )}

          <form onSubmit={sendMessage} className="relative group">
            <div className="relative">
              <div className="absolute inset-0 bg-purple-500/20 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>

              <div className="relative bg-white border border-gray-200 rounded-2xl shadow-xl flex items-center gap-2 md:gap-3 px-3 md:px-4 py-3">
                {!isRecording ? (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-all duration-200 flex-shrink-0"
                    title="Record Audio"
                  >
                    <Mic size={20} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-full transition-all duration-200 animate-pulse flex-shrink-0"
                    title="Stop Recording"
                  >
                    <MicOff size={20} />
                  </button>
                )}

                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onInput={handleTyping}
                  placeholder="Type your message..."
                  className="flex-1 bg-transparent placeholder-gray-400 focus:outline-none text-lg min-w-0 text-gray-800"
                  style={{ color: "#1f2937" }}
                />

                <button
                  type="submit"
                  disabled={!message.trim()}
                  className={`p-2 rounded-full transition-all duration-200 flex-shrink-0 ${
                    message.trim()
                      ? "bg-purple-600 text-white shadow-lg hover:bg-purple-700 hover:scale-110"
                      : "text-gray-400 bg-gray-100"
                  }`}
                >
                  <Send size={18} className="md:w-5 md:h-5" />
                </button>
              </div>
            </div>
          </form>

          {/* Astrology Chart Quick Access - Only for Astrologers */}
          {user?.role === 'astrologer' && (
            <div className="mt-3 flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => {
                  setSelectedChart('birth-chart');
                  setShowChartModal(true);
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-xs font-semibold shadow-md hover:shadow-lg transition-all transform hover:scale-105"
              >
                <Star size={14} />
                Birth Chart
              </button>

              <button
                onClick={() => {
                  setSelectedChart('porutham');
                  setShowChartModal(true);
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white text-xs font-semibold shadow-md hover:shadow-lg transition-all transform hover:scale-105"
              >
                <Heart size={14} />
                Porutham
              </button>

              <button
                onClick={() => {
                  setSelectedChart('navamsa');
                  setShowChartModal(true);
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white text-xs font-semibold shadow-md hover:shadow-lg transition-all transform hover:scale-105"
              >
                <Sparkles size={14} />
                Navamsa
              </button>

              <button
                onClick={() => {
                  setSelectedChart('behavior');
                  setShowChartModal(true);
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-semibold shadow-md hover:shadow-lg transition-all transform hover:scale-105"
              >
                <Brain size={14} />
                Behavior
              </button>

              {/* Dasha button removed per request */}
            </div>
          )}

          {/* Show only for astrologers/admins */}
          {(user?.role === 'astrologer' || user?.role === 'admin') && (
            <div className="text-center mt-2">
              <p className="text-gray-500 text-xs">🔮 Secure cosmic connection</p>
            </div>
          )}
        </div>
      </div>
      {/* Chart Modal */}
      <ChartModal
        isOpen={showChartModal}
        onClose={() => setShowChartModal(false)}
        initialChart={selectedChart}
        intakeData={sessionInfo?.intakeDetails}
      />

      {/* Intake Details Modal (Separate from Chart Modal for quick view) */}
      {showIntakeInfoModal && sessionInfo?.intakeDetails && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowIntakeInfoModal(false)}>
             <div className="bg-[#1a1a2e] border border-[#D4AF37]/30 rounded-2xl w-full max-w-sm shadow-2xl transform transition-all scale-100 p-6 relative"
                  onClick={e => e.stopPropagation()}>

                  <button className="absolute top-4 right-4 text-gray-400 hover:text-white"
                          onClick={() => setShowIntakeInfoModal(false)}>
                      <X size={20} />
                  </button>

                  <div className="flex items-center gap-3 mb-6">
                       <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#8a701f] text-white flex items-center justify-center font-bold text-lg shadow-lg">
                          {sessionInfo.intakeDetails.name?.[0]?.toUpperCase()}
                       </div>
                       <div>
                          <h3 className="text-xl font-bold text-white font-serif">{sessionInfo.intakeDetails.name}</h3>
                          <p className="text-sm text-[#D4AF37]">Birth Details</p>
                       </div>
                  </div>

                  <div className="space-y-4">
                      <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                         <div className="p-2 bg-black/20 rounded-lg text-purple-300"><Calendar size={18} /></div>
                         <div>
                            <p className="text-xs text-gray-500 uppercase tracking-widest">Date of Birth</p>
                            <p className="text-gray-200 font-medium">{sessionInfo.intakeDetails.dateOfBirth}</p>
                         </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                         <div className="p-2 bg-black/20 rounded-lg text-blue-300"><Clock size={18} /></div>
                         <div>
                            <p className="text-xs text-gray-500 uppercase tracking-widest">Time of Birth</p>
                            <p className="text-gray-200 font-medium">{sessionInfo.intakeDetails.timeOfBirth}</p>
                         </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                         <div className="p-2 bg-black/20 rounded-lg text-pink-300"><MapPin size={18} /></div>
                         <div>
                            <p className="text-xs text-gray-500 uppercase tracking-widest">Place of Birth</p>
                            <p className="text-gray-200 font-medium">{sessionInfo.intakeDetails.placeOfBirth}</p>
                         </div>
                      </div>
                  </div>

                  <button className="w-full mt-6 py-3 bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 border border-[#D4AF37]/50 text-[#D4AF37] rounded-xl font-bold transition-all uppercase tracking-wider text-sm"
                          onClick={() => setShowIntakeInfoModal(false)}>
                      Close Details
                  </button>
             </div>
         </div>
      )}
    </div>
  );
};

export default Chat;
