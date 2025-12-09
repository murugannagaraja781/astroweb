 import { useEffect, useState, useRef, useContext, useCallback } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

import AuthContext from "../context/AuthContext";
import { useChatSocket } from "../hooks/useChatSocket";
import ChartModal from "../components/ChartModal";
import { Send, Mic, MicOff, Star, Crown, Gem, Sparkles, ArrowLeft, Brain, Heart, Clock, Paperclip } from "lucide-react";

const Chat = () => {
  const { user } = useContext(AuthContext);
  const { id } = useParams(); // sessionId

  const {
    conversation,
    setConversation,
    isTyping,
    sessionInfo,
    setSessionInfo,
    sessionDuration,
    error: socketError,
    sendMessage: sendSocketMessage,
    sendTyping,
    endSession
  } = useChatSocket(id, user);

  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [showChartModal, setShowChartModal] = useState(false);
  const [selectedChart, setSelectedChart] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const messagesEndRef = useRef(null);

  // Auto scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load chat history from REST
  const fetchChat = useCallback(async () => {
    if (!id || id === "0") return;
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/chat/history/session/${id}`,
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );
      setConversation(res.data.messages || []);
    } catch (error) {
      console.error("Error fetching chat:", error);
    }
  }, [id, setConversation]);

  // Fetch session info from REST
  const fetchSessionInfo = useCallback(async () => {
    if (!id || id === "0") return;
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
  }, [id, setSessionInfo]);

  // Initial load
  useEffect(() => {
    if (id && id !== "0" && user?.id) {
      fetchChat();
      fetchSessionInfo();
    }
  }, [id, user?.id, fetchChat, fetchSessionInfo]);

  // Poll session status fallback (optional, as socket pushes updates too)
  useEffect(() => {
    const statusPoll = setInterval(fetchSessionInfo, 5000);
    return () => clearInterval(statusPoll);
  }, [fetchSessionInfo]);

  useEffect(scrollToBottom, [conversation]);

  // Helper function to format duration
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // --- Send Message ---
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    sendSocketMessage(message);
    setMessage("");
  };

  // --- Typing Event ---
  const handleTyping = () => {
    sendTyping();
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
      sendSocketMessage("Sent an image", "image", url);

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
          sendSocketMessage("Voice message", "audio", url);

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
      {socketError && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md mx-4">
            <div className="text-red-500 text-6xl mb-4 text-center">⚠️</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Connection Error
            </h3>
            <p className="text-gray-600 mb-6">{socketError}</p>
          </div>
        </div>
      )}

      <style>{`
        input,
        textarea,
        select {
          color: #1f2937 !important; /* gray-800 */
          font-size: large;
        }
        .message-container {
          padding-bottom: 220px;
        }
        @media (min-width: 768px) {
          .message-container {
            padding-bottom: 140px;
          }
        }
        .chat-footer {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
        }
        @supports (padding-bottom: env(safe-area-inset-bottom)) {
          .chat-footer {
            padding-bottom: calc(1.5rem + env(safe-area-inset-bottom));
          }
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
      <div className="relative flex items-center justify-between p-4 bg-slate-900/90 backdrop-blur-lg border-b border-purple-500/30 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="p-2 hover:bg-purple-500/20 rounded-full transition-colors"
            title="Go back"
          >
            <ArrowLeft size={20} className="text-purple-200" />
          </button>

          <div className="p-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full">
            <Crown size={20} className="text-white" />
          </div>

          <div>
            <h1 className="text-xl font-bold text-gray-100">
              {user?.role === "client"
                ? sessionInfo?.astrologer?.name || "Astrologer"
                : sessionInfo?.client?.name || "Client"}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-purple-300">
            <Star size={16} className="fill-purple-400 text-purple-400" />
            <span>₹{sessionInfo?.ratePerMinute || 0}/min</span>
          </div>

          {/* Timer Display */}
          <div className="bg-slate-800/60 px-3 py-1.5 rounded-lg border border-purple-500/30 text-purple-200 font-mono text-sm">
            {sessionDuration > 0 ? formatDuration(sessionDuration) : "00:00"}
          </div>

          <button
            onClick={() => {
              if (
                window.confirm("Are you sure you want to end this chat session?")
              ) {
                endSession();
                window.history.back();
              }
            }}
            className="px-4 py-2 bg-red-500/20 text-red-300 border border-red-500/30 rounded-xl text-sm font-bold hover:bg-red-500/30 transition-all"
          >
            End Chat
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto relative z-0">
        {id === "0" ? (
             <div className="flex-1 flex items-center justify-center text-center p-8">
                <div>
                   <div className="w-20 h-20 bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500/30">
                      <MessageCircle className="w-10 h-10 text-purple-300" />
                   </div>
                   <h2 className="text-2xl font-bold text-gray-200 mb-2">Select a Conversation</h2>
                   <p className="text-gray-400 max-w-sm mx-auto">
                     Choose an online astrologer from the list to start a cosmic consultation.
                   </p>
                   <button
                     onClick={() => window.location.href = '/astrologers/chat'}
                     className="mt-6 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-all"
                   >
                     Browse Astrologers
                   </button>
                </div>
             </div>
        ) : (
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          <div className="flex-1 overflow-y-auto px-4 pt-6 space-y-4 message-container">
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

                         {msg.mediaUrl && msg.type === 'image' && (
                          <div className="mt-2">
                            <img src={msg.mediaUrl} alt="shared" className="rounded-lg max-w-full h-auto border border-white/10" />
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
       )}
      </div>

      {/* Input Area */}
      {id !== "0" && (
      <div className="chat-footer bg-slate-900/90 backdrop-blur-lg border-t border-purple-500/30 p-4 z-20">
        <div className="max-w-4xl mx-auto px-4">
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

          <form onSubmit={handleSendMessage} className="relative group">
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
                  type="file"
                  id="image-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileUpload}
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('image-upload').click()}
                  className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-all duration-200 flex-shrink-0"
                  title="Attach Image"
                >
                  <Paperclip size={20} />
                </button>

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

          {/* Chart Modal */}
          <ChartModal
            isOpen={showChartModal}
            onClose={() => setShowChartModal(false)}
            initialChart={selectedChart}
            initialData={user?.role === 'astrologer' ? sessionInfo?.client?.birthDetails : null}
          />

          {/* Show only for astrologers/admins */}
          {(user?.role === 'astrologer' || user?.role === 'admin') && (
            <div className="text-center mt-2">
              <p className="text-gray-500 text-xs">🔮 Secure cosmic connection</p>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
};

export default Chat;
