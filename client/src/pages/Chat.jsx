 import { useEffect, useState, useRef, useContext, useCallback } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";

import AuthContext from "../context/AuthContext";
import { Send, Mic, MicOff, Star, Crown, Gem, Sparkles, ArrowLeft } from "lucide-react";


const socket = io(import.meta.env.VITE_API_URL || "https://astroweb-production.up.railway.app", {
  autoConnect: false
});

const Chat = () => {
  const { user } = useContext(AuthContext);
  const { id } = useParams();

  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUser, setOtherUser] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [error, setError] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const messagesEndRef = useRef(null);
  const lastMessageRef = useRef("");

  // Auto scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load chat data
  const fetchChat = useCallback(async () => {
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

  // Fetch session info
  const fetchSessionInfo = useCallback(async () => {
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

  useEffect(() => {
    if (user?.name) {
      socket.io.opts.query = { username: user.name };
      socket.connect();
    }

    if (id) {
      console.log(`[Chat] Joining session: ${id}`);
      socket.emit("join_chat", { sessionId: id });
    }

    fetchChat();
    fetchSessionInfo();

    // Poll session status every 2 seconds until it becomes active
    const statusPoll = setInterval(() => {
      fetchSessionInfo();
    }, 2000);

    // Stop polling after 30 seconds
    setTimeout(() => {
      clearInterval(statusPoll);
    }, 30000);

    // Socket Error Handling
    socket.on("connect_error", (err) => {
      setError(`Connection error: ${err.message}. Please refresh the page.`);
    });

    socket.on("disconnect", (reason) => {
      if (reason === "io server disconnect") {
        setError("Disconnected by server. Please refresh and try again.");
      } else {
        setError("Connection lost. Reconnecting...");
      }
    });

    socket.on("reconnect", () => {
      setError(null);
      if (id) {
        socket.emit("join_chat", { sessionId: id });
      }
    });

    return () => {
      clearInterval(statusPoll);
      socket.off("connect_error");
      socket.off("disconnect");
      socket.off("reconnect");
    };

    // Socket Error Handling
    socket.on("connect_error", (err) => {
      setError(`Connection error: ${err.message}. Please refresh the page.`);
    });

    socket.on("disconnect", (reason) => {
      if (reason === "io server disconnect") {
        setError("Disconnected by server. Please refresh and try again.");
      } else {
        setError("Connection lost. Reconnecting...");
      }
    });

    socket.on("reconnect", () => {
      setError(null);
      if (id) {
        socket.emit("join_chat", { sessionId: id });
      }
    });

    return () => {
      socket.off("connect_error");
      socket.off("disconnect");
      socket.off("reconnect");
    };

  socket.on("chat:message", (newMessage) => {
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
});



    socket.on("chat:typing", (data) => {
      // Only show typing if it's from the OTHER user
      if (data.userId && data.userId !== user.id) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 1500);
      }
    });

    // Listen for session info from socket
    socket.on("chat:session_info", (info) => {
      console.log("[Chat] Received session info:", info);
      setSessionInfo(info);
    });

    // Listen for chat acceptance
    socket.on("chat:accepted", (data) => {
      console.log("[Chat] Chat accepted:", data);
      fetchSessionInfo(); // Refresh session info to get updated status
    });

    // Listen for when astrologer accepts (client-side notification)
    socket.on("chat:accepted_by_astrologer", (data) => {
      console.log("[Chat] Astrologer accepted your request:", data);
      fetchSessionInfo(); // Refresh session info immediately
    });

    // Listen for chat started
    socket.on("chat:started", (data) => {
      console.log("[Chat] Chat started:", data);
      fetchSessionInfo(); // Refresh session info
    });

    return () => {
      socket.off("chat:message");
      socket.off("chat:typing");
      socket.off("chat:session_info");
      socket.off("chat:accepted");
      socket.off("chat:accepted_by_astrologer");
      socket.off("chat:started");
    };
  }, [id, fetchChat, fetchSessionInfo]);

  useEffect(scrollToBottom, [conversation]);

  // Stop polling when session becomes active
  useEffect(() => {
    if (sessionInfo?.status === 'active') {
      console.log('[Chat] Session is now active, UI should update');
    }
  }, [sessionInfo?.status]);

  // Session timer
  useEffect(() => {
    if (!sessionInfo?.startedAt) return;

    const interval = setInterval(() => {
      const now = new Date();
      const started = new Date(sessionInfo.startedAt);
      const diff = Math.floor((now - started) / 1000);
      setSessionDuration(diff);
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionInfo?.startedAt]);

  // Helper function to format duration
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // --- Send Message ---
 const sendMessage = async (e) => {
  e.preventDefault();
  if (!message.trim()) return;

  // Create TEMP ID for client-side dedupe
  const tempId = "tmp_" + Date.now() + "_" + Math.random().toString(36).slice(2);

  const newMsg = {
    tempId,
    senderId: user.id,
    text: message,
    timestamp: new Date(),
    pending: true,
  };

  // Add to UI immediately
  setConversation((prev) => [...prev, newMsg]);

  // Send to server
  socket.emit("chat:message", {
    sessionId: id,
    senderId: user.id,
    text: message,
    tempId, // VERY IMPORTANT
  });

  setMessage("");
};


  // --- Typing Event ---
  const handleTyping = () => {
    socket.emit("chat:typing", { sessionId: id, userId: user.id });
  };

  // --- Audio Record ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);

      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (e) =>
        audioChunksRef.current.push(e.data);

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/mp3" });
        const url = URL.createObjectURL(blob);

        const audioMsg = {
          senderId: user.id,
          audioUrl: url,
          timestamp: new Date(),
          status: "sent",
        };

        socket.emit("chat:message", {
          sessionId: id,
          senderId: user.id,
          text: "",
          type: "audio",
        });

        setConversation((prev) => [...prev, audioMsg]);

        const formData = new FormData();
        formData.append("audio", blob);
        formData.append("chatId", id);
        formData.append("sender", user.id);

        try {
          await axios.post(
            `${import.meta.env.VITE_API_URL}/api/chat/send-audio`,
            formData,
            { headers: { "Content-Type": "multipart/form-data" } }
          );
          audioMsg.status = "delivered";
        } catch (e) {
          audioMsg.status = "failed";
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-900 via-black to-yellow-900 text-yellow-50 relative overflow-hidden">
      {/* Error Popup */}
      {error && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md mx-4">
            <div className="text-red-500 text-6xl mb-4 text-center">⚠️</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Connection Error</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => setError(null)}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        input, textarea, select {
          color: #f9f4f4 !important;
          font-size: large;
        }
        .message-container {
          padding-bottom: 180px; /* Increased space for mobile footer */
        }
        @media (min-width: 768px) {
          .message-container {
            padding-bottom: 140px;
          }
        }
        /* Prevent keyboard from pushing footer up on mobile */
        .chat-footer {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
        }
        /* Safe area for iOS devices */
        @supports (padding-bottom: env(safe-area-inset-bottom)) {
          .chat-footer {
            padding-bottom: calc(1.5rem + env(safe-area-inset-bottom));
          }
        }
      `}</style>

      {/* Gold Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-2 h-2 bg-yellow-400 rounded-full opacity-60 animate-pulse"></div>
        <div className="absolute top-20 right-20 w-1 h-1 bg-yellow-300 rounded-full opacity-40"></div>
        <div className="absolute bottom-32 left-1/4 w-1 h-1 bg-yellow-500 rounded-full opacity-50 animate-pulse delay-700"></div>
        <div className="absolute top-1/2 right-16 w-1 h-1 bg-yellow-400 rounded-full opacity-30"></div>
        <div className="absolute bottom-20 right-1/3 w-2 h-2 bg-yellow-600 rounded-full opacity-40 animate-pulse delay-300"></div>
      </div>

      {/* Header */}
      <div className="relative flex items-center justify-between p-4 bg-black/80 backdrop-blur-lg border-b border-yellow-600/30 z-10">
        <div className="flex items-center gap-3">
          {/* Back Button */}
          <button
            onClick={() => window.history.back()}
            className="p-2 hover:bg-yellow-600/20 rounded-full transition-colors"
            title="Go back"
          >
            <ArrowLeft size={20} className="text-yellow-200" />
          </button>

          <div className="p-2 bg-gradient-to-r from-yellow-600 to-yellow-800 rounded-full">
            <Crown size={20} className="text-yellow-200" />
          </div>

          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-200 to-yellow-400 bg-clip-text text-transparent">
              {user?.role === 'client'
                ? sessionInfo?.astrologer?.name || 'Astrologer'
                : sessionInfo?.client?.name || 'Client'}
            </h1>
            <p className="text-sm text-yellow-300">
              {sessionDuration > 0 ? formatDuration(sessionDuration) : 'Starting...'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-yellow-300">
            <Star size={16} className="fill-yellow-400" />
            <span>₹{sessionInfo?.ratePerMinute || 0}/min</span>
          </div>

          {/* End Chat Button */}
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to end this chat session?')) {
                socket.emit('chat:end', { sessionId: id });
                window.history.back();
              }
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full text-sm font-semibold transition-colors shadow-lg"
          >
            End Chat
          </button>
        </div>
      </div>

      {/* Messages Container - Centered with extra bottom padding */}
      <div className="flex-1 overflow-y-auto relative z-0">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          {/* Messages List with extra bottom padding */}
          <div className="flex-1 overflow-y-auto px-4 pt-6 space-y-4 message-container">
            {conversation.length === 0 ? (
              <div className="text-center py-12">
                {sessionInfo?.status === 'requested' ? (
                  // Waiting for acceptance
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
                  // Chat is active but no messages yet
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
                const isAstrologerMsg = user.role === 'client' && !isMe;

                // Get name and initials for the sender
                const senderName = isMe
                  ? user.name
                  : (user.role === 'client'
                      ? sessionInfo?.astrologer?.name
                      : sessionInfo?.client?.name) || 'User';

                const getInitials = (name) => {
                  if (!name) return '?';
                  return name
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);
                };

                return (
                  <div
                    key={index}
                    className={`flex gap-2 ${isMe ? "flex-row-reverse" : "flex-row"} items-end`}
                  >
                    {/* Profile Icon */}
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      isMe
                        ? 'bg-gradient-to-br from-yellow-500 to-yellow-700 text-white'
                        : 'bg-gradient-to-br from-purple-500 to-purple-700 text-white'
                    }`}>
                      {getInitials(senderName)}
                    </div>

                    {/* Message Container */}
                    <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[75%] md:max-w-[65%]`}>
                      {/* Sender Name Label */}
                      <span className={`text-[10px] mb-1 font-medium flex items-center gap-1 ${
                        isMe ? 'text-yellow-400' : 'text-purple-400'
                      }`}>
                        {isAstrologerMsg && <Crown size={10} />}
                        {senderName}
                      </span>

                      {/* Message Bubble */}
                      <div
                        className={`p-4 rounded-2xl shadow-lg relative ${
                          isMe
                            ? "bg-gradient-to-br from-yellow-600 to-yellow-800 text-yellow-50 border border-yellow-500/30 rounded-tr-none"
                            : "bg-gradient-to-br from-purple-600 to-purple-800 text-white border border-purple-500/30 rounded-tl-none"
                        }`}
                      >
                        {/* Message Bubble Decoration */}
                        {isMe && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full opacity-80 shadow-[0_0_10px_rgba(250,204,21,0.5)]"></div>
                        )}

                        {msg.text && (
                          <p className="text-sm leading-relaxed text-white font-medium">{msg.text}</p>
                        )}

                        {msg.audioUrl && (
                          <div className="mt-2">
                            <audio
                              controls
                              className="w-48 h-8 rounded-lg bg-black/40 border border-yellow-600/30"
                            >
                              <source src={msg.audioUrl} type="audio/mp3" />
                            </audio>
                          </div>
                        )}

                        {/* Timestamp */}
                        <div className={`text-[10px] mt-2 flex items-center gap-1 ${
                          isMe ? 'text-yellow-100 justify-end' : 'text-purple-100 justify-start'
                        }`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                          {isMe && <span>✓</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="max-w-[70%] p-4 rounded-2xl bg-black/60 backdrop-blur-sm border border-yellow-600/30">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce delay-150"></div>
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce delay-300"></div>
                  </div>
                  <p className="text-xs text-yellow-400 mt-1">
                    {user?.role === 'astrologer' ? 'Client' : 'Astrologer'} is typing...
                  </p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>
      </div>

      {/* Input Area - Fixed at bottom with safe area for mobile */}
      <div className="chat-footer relative z-10 bg-gradient-to-t from-black/95 via-black/80 to-transparent pt-4 pb-safe-or-6">
        <div className="max-w-4xl mx-auto px-4">
          {/* Recording Indicator - Only shows when recording */}
          {isRecording && (
            <div className="text-center mb-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-full">
                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                <span className="text-red-300 text-sm">Recording... Click to stop</span>
              </div>
            </div>
          )}

          <form
            onSubmit={sendMessage}
            className="relative group"
          >
            <div className="relative">
              {/* Gold glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-600 to-yellow-800 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>

              <div className="relative bg-black/70 backdrop-blur-xl border border-yellow-600/40 rounded-2xl shadow-2xl flex items-center gap-2 md:gap-3 px-3 md:px-4 py-3">
                {/* Record Button */}
                {!isRecording ? (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="p-2 text-yellow-400 hover:text-yellow-200 hover:bg-yellow-600/20 rounded-full transition-all duration-200 flex-shrink-0"
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

                {/* Message Input with custom color */}
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onInput={handleTyping}
                  placeholder="Send your message..."
                  className="flex-1 bg-transparent placeholder-yellow-400/70 focus:outline-none text-lg min-w-0"
                  style={{ color: '#f9f4f4' }}
                />

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!message.trim()}
                  className={`p-2 rounded-full transition-all duration-200 flex-shrink-0 ${
                    message.trim()
                      ? "bg-gradient-to-r from-yellow-600 to-yellow-800 text-yellow-50 shadow-lg hover:shadow-yellow-500/25 hover:scale-110 border border-yellow-500/30"
                      : "text-yellow-600 opacity-50"
                  }`}
                >
                  <Send size={18} className="md:w-5 md:h-5" />
                </button>
              </div>
            </div>
          </form>

          {/* Mobile safe area indicator */}
          <div className="text-center mt-2">
            <p className="text-yellow-600/60 text-xs">
              🔮 Secure cosmic connection
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;