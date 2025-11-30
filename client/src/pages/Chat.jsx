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

    socket.on("chat:message", (newMessage) => {
      setConversation((prev) => {
        // Check if message already exists (deduplication)
        const isDuplicate = prev.some(
          msg => (msg._id && msg._id === newMessage._id) ||
                 (msg.text === newMessage.text &&
                  msg.senderId === newMessage.senderId &&
                  Math.abs(new Date(msg.timestamp).getTime() - new Date(newMessage.timestamp).getTime()) < 1000)
        );
        return isDuplicate ? prev : [...prev, newMessage];
      });
    });

    socket.on("chat:typing", () => {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 1500);
    });

    // Listen for session info from socket
    socket.on("chat:session_info", (info) => {
      console.log("[Chat] Received session info:", info);
      setSessionInfo(info);
    });

    socket.on("chat:accepted", () => {
      setSessionInfo(prev => ({ ...prev, status: 'accepted' }));
    });

    return () => {
      socket.off("chat:message");
      socket.off("chat:typing");
      socket.off("chat:session_info");
      socket.off("chat:accepted");
    };
  }, [id, fetchChat, fetchSessionInfo]);

  useEffect(scrollToBottom, [conversation]);

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
    if (!message.trim() || message === lastMessageRef.current) return;

    const newMsg = {
      senderId: user.id,
      text: message,
      timestamp: new Date(),
      status: "sent",
    };

    lastMessageRef.current = message;

    socket.emit("chat:message", {
      sessionId: id,
      senderId: user.id,
      text: message,
    });

    // Optimistic update removed to prevent duplicates - waiting for server echo
    // setConversation((prev) => [...prev, newMsg]);
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
        <div className="flex items-center gap-2 text-sm text-yellow-300">
          <Star size={16} className="fill-yellow-400" />
          <span>₹{sessionInfo?.ratePerMinute || 0}/min</span>
        </div>
      </div>

      {/* Messages Container - Centered with extra bottom padding */}
      <div className="flex-1 overflow-y-auto relative z-0">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          {/* Messages List with extra bottom padding */}
          <div className="flex-1 overflow-y-auto px-4 pt-6 space-y-4 message-container">
            {conversation.length === 0 ? (
              <div className="text-center py-12">
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
                  <p className="text-xs text-yellow-400 mt-1">Astrologer is typing...</p>
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

          {/* Start Session Button for Astrologer */}
          {user?.role === 'astrologer' && sessionInfo?.status === 'accepted' && (
            <div className="flex justify-center mb-4">
              <button
                onClick={() => socket.emit('chat:start', { sessionId: id })}
                className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-full shadow-lg animate-pulse"
              >
                Start Session & Billing
              </button>
            </div>
          )}

          {/* Waiting Message for Client */}
          {user?.role === 'client' && sessionInfo?.status === 'accepted' && (
            <div className="text-center text-yellow-200 mb-4 font-medium">
              Waiting for astrologer to start the session...
            </div>
          )}

          {/* Recording Indicator - Only shows when recording */}
          {isRecording && (
            <div className="text-center mb-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-full">
                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                <span className="text-red-300 text-sm">Recording... Click to stop</span>
              </div>
            </div>
          )}

         {/* --- INPUT SECTION (CLEAN + CONTROLLED BASED ON STATUS) --- */}
<form
  onSubmit={sendMessage}
  className="flex items-center gap-3"
>
  {/* Extra button (Sparkles) */}
  <button
    type="button"
    className="p-3 rounded-full bg-gray-800 text-yellow-500 hover:bg-gray-700 transition-colors"
    disabled={sessionInfo?.status !== 'active'}
  >
    <Sparkles size={20} />
  </button>

  <div className="flex-1 relative">
    <input
      type="text"
      value={message}
      onChange={(e) => {
        setMessage(e.target.value);
        handleTyping();
      }}
      disabled={sessionInfo?.status !== 'active'}
      placeholder={
        sessionInfo?.status === 'active'
          ? "Type a message..."
          : sessionInfo?.status === 'accepted'
          ? "Waiting for astrologer to start..."
          : "Chat not active"
      }
      className="w-full bg-gray-900/50 border border-gray-700 text-white rounded-full
                 py-3 pl-5 pr-12 focus:outline-none
                 focus:border-yellow-600 focus:ring-1 focus:ring-yellow-600
                 placeholder-gray-500 disabled:opacity-40 disabled:cursor-not-allowed"
    />

    {/* Mic Button */}
    <button
      type="button"
      onClick={isRecording ? stopRecording : startRecording}
      disabled={sessionInfo?.status !== 'active'}
      className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all
        ${isRecording
          ? "bg-red-600 shadow-lg shadow-red-500/50"
          : "hover:bg-gray-700 text-gray-400 hover:text-white"
        }
        disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {isRecording ? (
        <>
          <div className="absolute inset-0 rounded-full bg-red-500 animate-ping" />
          <MicOff size={18} className="text-white relative z-10" />
        </>
      ) : (
        <Mic size={18} />
      )}
    </button>
  </div>

  {/* Send Button */}
  <button
    type="submit"
    disabled={!message.trim() || sessionInfo?.status !== 'active'}
    className="p-3 rounded-full bg-gradient-to-r from-yellow-600 to-yellow-800
               text-white shadow-lg disabled:opacity-40 disabled:cursor-not-allowed
               transform active:scale-95 transition-all"
  >
    <Send size={20} />
  </button>
</form>

      </div>
    </div>
  </div>
  );
};

export default Chat;