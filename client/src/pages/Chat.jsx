 import { useEffect, useState, useRef, useContext, useCallback } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";

import AuthContext from "../context/AuthContext";
import ChartModal from "../components/ChartModal";
import IntakeModal from "../components/IntakeModal";
import { Send, Mic, MicOff, Star, Crown, Gem, Sparkles, ArrowLeft, Brain, Heart, Clock } from "lucide-react";

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
  const [showIntakeModal, setShowIntakeModal] = useState(false);

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

      // Check for intake details if user is client
      if (user?.role === 'client') {
          if (!res.data.intakeDetails || !res.data.intakeDetails.name) {
              setShowIntakeModal(true);
          } else {
              setShowIntakeModal(false);
          }
      }
    } catch (error) {
      console.error("Error fetching session info:", error);
    }
  }, [id, user?.role]);

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
    <div className="flex flex-col h-[100dvh] bg-space-900 text-gray-300 relative overflow-hidden">
      {/* Error Popup */}
      {error && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md mx-4 animate-bounce-in">
            <div className="text-red-500 text-6xl mb-4 text-center">⚠️</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2 text-center">Connection Error</h3>
            <p className="text-gray-600 mb-6 text-center">{error}</p>
            <button
              onClick={() => setError(null)}
              className="w-full bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Global Mobile Styles */}
      <style>{`
        input, textarea, select { color: #1f2937 !important; font-size: 16px; }
        /* Hide scrollbar */
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Background stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-10 left-10 w-2 h-2 bg-purple-400 rounded-full opacity-60 animate-pulse"></div>
        <div className="absolute top-20 right-20 w-1 h-1 bg-blue-300 rounded-full opacity-40"></div>
        <div className="absolute bottom-32 left-1/4 w-1 h-1 bg-indigo-500 rounded-full opacity-50 animate-pulse delay-700"></div>
      </div>

      {/* 1. Header (Sticky Top + Safe Area) */}
      <div className="shrink-0 relative z-30 bg-white/5 backdrop-blur-xl border-b border-white/5 pt-[env(safe-area-inset-top)]">
         <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.history.back()}
                className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors active:scale-95"
              >
                <ArrowLeft size={22} className="text-gray-200" />
              </button>

              <div className="flex items-center gap-3">
                  <div className="relative">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 p-[2px]">
                          <div className="w-full h-full rounded-full bg-space-900 border-2 border-transparent flex items-center justify-center font-bold text-white text-sm">
                             {(user?.role === "client" ? sessionInfo?.astrologer?.name : sessionInfo?.client?.name)?.[0] || 'U'}
                          </div>
                      </div>
                      <div className="absolute -bottom-0 -right-0 w-3 h-3 bg-green-500 border-2 border-space-900 rounded-full"></div>
                  </div>

                  <div>
                    <h1 className="text-base font-bold text-white leading-tight">
                      {user?.role === "client" ? sessionInfo?.astrologer?.name || "Astrologer" : sessionInfo?.client?.name || "Client"}
                    </h1>
                    {/* Timer / Rate */}
                     <div className="flex items-center gap-2 text-xs text-purple-300">
                        <span className="font-mono bg-purple-900/50 px-1.5 py-0.5 rounded border border-purple-500/20">
                           {sessionDuration > 0 ? formatDuration(sessionDuration) : "00:00"}
                        </span>
                        <span>•</span>
                        <span>₹{sessionInfo?.ratePerMinute || 0}/min</span>
                     </div>
                  </div>
              </div>
            </div>

            <button
                onClick={() => {
                  if (window.confirm("End chat session?")) {
                    socket.emit("chat:end", { sessionId: id });
                    window.history.back();
                  }
                }}
                className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-xs font-bold active:scale-95 transition-transform"
            >
              End
            </button>
         </div>
      </div>

      {/* 2. Messages (Scrollable Area) */}
      <div className="flex-1 overflow-y-auto relative z-10 scrollbar-hide bg-space-900" onClick={() => { if(window.innerWidth < 768) {/* hint to close keyboard */} }}>
         <div className="min-h-full flex flex-col justify-end px-4 py-4 space-y-3 pb-4">

            {/* Welcome / Loading State */}
            {conversation.length === 0 && (
               <div className="text-center py-10 opacity-70">
                   <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/5">
                      <Sparkles className="text-purple-300" size={32} />
                   </div>
                   <p className="text-sm text-purple-200 font-medium">
                      {sessionInfo?.status === "requested" ? "Connecting to Astrologer..." : "Start your consultation"}
                   </p>
                   {sessionInfo?.status === "requested" && <p className="text-xs text-purple-400 mt-2">Please wait for acceptance</p>}
               </div>
            )}

            {/* Message List */}
            {conversation.map((msg, index) => {
                const isMe = msg.senderId === user.id || msg.sender === user.id;
                // Group consecutive messages logic could go here

                return (
                  <div key={index} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                     <div
                        className={`max-w-[80%] px-4 py-3 rounded-2xl shadow-sm relative text-sm leading-relaxed ${
                            isMe
                            ? 'bg-purple-600 text-white rounded-br-none'
                            : 'bg-space-800 border border-white/10 text-gray-200 rounded-bl-none'
                        }`}
                     >
                        {msg.text && <span>{msg.text}</span>}
                        {msg.mediaUrl && msg.type === 'image' && (
                            <img src={msg.mediaUrl} alt="Shared" className="rounded-xl mt-1 max-w-full h-auto border border-white/10" />
                        )}
                        {msg.audioUrl && (
                             <audio controls className="w-full mt-1 h-8 opacity-90 rounded custom-audio" src={msg.audioUrl} />
                        )}

                        <div className={`text-[10px] mt-1 flex items-center justify-end gap-1 opacity-70 ${isMe ? 'text-purple-200' : 'text-gray-500'}`}>
                           {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                           {isMe && <span className="text-[10px] ml-0.5">✓</span>}
                        </div>
                     </div>
                  </div>
                );
            })}

            {isTyping && (
               <div className="flex justify-start">
                   <div className="bg-space-800 border border-white/10 px-4 py-3 rounded-2xl rounded-bl-none">
                       <div className="flex space-x-1">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-300"></div>
                       </div>
                   </div>
               </div>
            )}

            <div ref={messagesEndRef} className="h-1" />
         </div>
      </div>

      {/* 3. Input Area (Sticky Bottom + Safe Area) */}
      <div className="shrink-0 bg-space-900 border-t border-white/5 pb-[env(safe-area-inset-bottom)] z-40 bg-opacity-95 backdrop-blur-md">
         {isRecording && (
             <div className="absolute -top-12 left-0 right-0 flex justify-center pointer-events-none">
                 <div className="bg-red-500/90 text-white px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 animate-pulse shadow-lg backdrop-blur-sm">
                    <div className="w-2 h-2 bg-white rounded-full"></div> Recording...
                 </div>
             </div>
         )}

         <div className="p-3">
             {/* Quick Actions for Astrologer */}
             {user?.role === 'astrologer' && (
                <div className="flex gap-2 overflow-x-auto pb-3 px-1 scrollbar-hide">
                    {[
                       { icon: Star, label: 'Chart', action: () => { setSelectedChart('birth-chart'); setShowChartModal(true); }, color: 'bg-blue-500/20 text-blue-400' },
                       { icon: Heart, label: 'Match', action: () => { setSelectedChart('porutham'); setShowChartModal(true); }, color: 'bg-pink-500/20 text-pink-400' },
                       { icon: Sparkles, label: 'Navamsa', action: () => { setSelectedChart('navamsa'); setShowChartModal(true); }, color: 'bg-purple-500/20 text-purple-400' },
                       { icon: Brain, label: 'Behavior', action: () => { setSelectedChart('behavior'); setShowChartModal(true); }, color: 'bg-orange-500/20 text-orange-400' },
                    ].map((btn, idx) => (
                       <button key={idx} onClick={btn.action} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold border border-white/5 whitespace-nowrap active:scale-95 transition-transform ${btn.color}`}>
                          <btn.icon size={12} /> {btn.label}
                       </button>
                    ))}
                </div>
             )}

             <form onSubmit={sendMessage} className="flex items-center gap-2">
                 {/* Voice/Record Button */}
                 {!isRecording ? (
                     <button type="button" onClick={startRecording} className="w-10 h-10 rounded-full bg-space-800 flex items-center justify-center text-gray-400 hover:text-white active:bg-space-700 transition-colors">
                        <Mic size={20} />
                     </button>
                 ) : (
                     <button type="button" onClick={stopRecording} className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 animate-pulse">
                        <MicOff size={20} />
                     </button>
                 )}

                 {/* Text Input */}
                 <div className="flex-1 relative">
                     <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onInput={handleTyping}
                        placeholder="Type a message..."
                        className="w-full bg-space-800 text-white rounded-full px-5 py-3 pr-10 border border-white/10 focus:border-purple-500/50 focus:outline-none placeholder-gray-500 text-sm"
                        style={{ fontSize: '16px' }} // Prevent iOS zoom
                     />
                     <button
                        type="button"
                        onClick={() => document.getElementById('image-upload')?.click()}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-purple-400"
                     >
                        <Sparkles size={16} /> {/* Placeholder for file attachment icon if needed, Sparkles used for now */}
                     </button>
                     <input type="file" id="image-upload" className="hidden" accept="image/*" onChange={handleFileUpload} />
                 </div>

                 {/* Send Button */}
                 <button
                    type="submit"
                    disabled={!message.trim()}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                       message.trim() ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50 scale-100' : 'bg-space-800 text-gray-500 scale-95'
                    }`}
                 >
                    <Send size={18} className={message.trim() ? 'ml-0.5' : ''} />
                 </button>
             </form>
         </div>
      </div>

      {user?.role === 'client' && (
          <IntakeModal
            isOpen={showIntakeModal}
            sessionId={id}
            onSubmit={(data) => {
                setSessionInfo(prev => ({ ...prev, intakeDetails: data }));
                setShowIntakeModal(false);
            }}
          />
      )}

      <ChartModal
        isOpen={showChartModal}
        onClose={() => setShowChartModal(false)}
        initialChart={selectedChart}
        initialData={sessionInfo?.intakeDetails}
      />
    </div>
  );
};

export default Chat;
