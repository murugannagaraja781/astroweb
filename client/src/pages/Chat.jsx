 import { useEffect, useState, useRef, useContext, useCallback } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

import AuthContext from "../context/AuthContext";
import { useChatSocket } from "../hooks/useChatSocket";
import ChartModal from "../components/ChartModal";
import { Send, Mic, MicOff, Star, Crown, Gem, Sparkles, ArrowLeft, Brain, Heart, Clock, Paperclip, Calendar, MessageCircle } from "lucide-react";

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
    <div className="h-[100dvh] flex flex-col bg-gray-50 text-gray-800 relative overflow-hidden">
      {/* Error Popup */}
      {socketError && (
        <div className="fixed inset-0 bg-indigo-900/60 backdrop-blur-sm flex items-center justify-center z-50">
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
          font-size: large;
        }
        /* Mobile-friendly safe area padding */
        .chat-footer {
          padding-bottom: env(safe-area-inset-bottom);
        }
      `}</style>

      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>

      {/* Header */}
      <div className="relative flex items-center justify-between p-4 bg-white/90 backdrop-blur-lg border-b border-gray-200 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Go back"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>

          <div className="p-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full">
            <Crown size={20} className="text-white" />
          </div>

          <div>
            <h1 className="text-xl font-bold text-gray-800">
              {user?.role === "client"
                ? sessionInfo?.astrologer?.name || "Astrologer"
                : sessionInfo?.client?.name || "Client"}
            </h1>
            {user?.role === "astrologer" && sessionInfo?.client?.birthDetails && (
               <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                  <span className="flex items-center gap-1">
                     <Calendar size={12} />
                     {`${sessionInfo.client.birthDetails.day}/${sessionInfo.client.birthDetails.month}/${sessionInfo.client.birthDetails.year}`}
                  </span>
                  <span className="flex items-center gap-1 border-l border-gray-300 pl-2">
                     <Clock size={12} />
                     {`${String(sessionInfo.client.birthDetails.hour).padStart(2, '0')}:${String(sessionInfo.client.birthDetails.minute).padStart(2, '0')}`}
                  </span>
                  <span className="flex items-center gap-1 border-l border-gray-300 pl-2">
                     📍 {sessionInfo.client.birthDetails.latitude?.toFixed(2)}, {sessionInfo.client.birthDetails.longitude?.toFixed(2)}
                  </span>
               </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-purple-600 font-medium">
            <Star size={16} className="fill-purple-600 text-purple-600" />
            <span>₹{sessionInfo?.ratePerMinute || 0}/min</span>
          </div>

          {/* Timer Display */}
          <div className="bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 font-mono text-sm">
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
            className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-bold hover:bg-red-100 transition-all"
          >
            End Chat
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden relative z-0">
        {id === "0" ? (
             <div className="flex-1 flex items-center justify-center text-center p-8">
                <div>
                   <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-200">
                      <MessageCircle className="w-10 h-10 text-purple-600" />
                   </div>
                   <h2 className="text-2xl font-bold text-gray-800 mb-2">Select a Conversation</h2>
                   <p className="text-gray-500 max-w-sm mx-auto">
                     Choose an online astrologer from the list to start a cosmic consultation.
                   </p>
                   <button
                     onClick={() => window.location.href = '/astrologers/chat'}
                     className="mt-6 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-purple-200"
                   >
                     Browse Astrologers
                   </button>
                </div>
             </div>
        ) : (
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          <div className="flex-1 overflow-y-auto px-4 pt-6 space-y-4 message-container pb-32">
             {/* Always show Birth Details at top if available */}
             {sessionInfo?.client?.birthDetails && (
                 <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 max-w-sm mx-auto text-left shadow-sm mb-6">
                    <div className="flex items-center gap-2 mb-2 text-purple-700 font-bold border-b border-purple-200 pb-2">
                       <Star size={16} className="fill-purple-600" />
                       <span>Birth Details Shared</span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-700">
                         <div className="flex justify-between"><span className="text-gray-500">Date:</span><span className="font-medium">{sessionInfo.client.birthDetails.day}/{sessionInfo.client.birthDetails.month}/{sessionInfo.client.birthDetails.year}</span></div>
                         <div className="flex justify-between"><span className="text-gray-500">Time:</span><span className="font-medium">{String(sessionInfo.client.birthDetails.hour).padStart(2, '0')}:{String(sessionInfo.client.birthDetails.minute).padStart(2, '0')}</span></div>
                         <div className="mt-2 text-xs text-center text-purple-500 italic bg-white p-2 rounded-lg border border-purple-100">System: Auto-filled into Astrologer's Chart.</div>
                    </div>
                 </div>
             )}

            {conversation.length === 0 ? (
              <div className="text-center py-12">
                {sessionInfo?.status === "requested" ? (
                  <>
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-100 to-purple-200 rounded-full mb-4 animate-pulse">
                      <Sparkles className="text-purple-600" size={24} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      Connecting to Cosmos...
                    </h3>
                    <p className="text-gray-500 text-sm max-w-md mx-auto">
                      Waiting for astrologer to accept your chat request...
                    </p>
                  </>
                ) : sessionInfo?.status === "rejected" || (socketError && socketError.includes("rejected")) ? (
                   <>
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                      <div className="text-red-500 text-2xl">⛔</div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      Request Rejected
                    </h3>
                    <p className="text-gray-500 text-sm max-w-md mx-auto mb-4">
                      The astrologer is currently busy or unavailable. Please try again later or choose another astrologer.
                    </p>
                    <button onClick={() => window.history.back()} className="px-6 py-2 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors">
                       Go Back
                    </button>
                  </>
                ) : (
                  <>
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-full mb-4">
                      <Gem className="text-yellow-600" size={24} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      Welcome to Royal Astrology
                    </h3>
                    <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
                      Begin your royal consultation with our expert astrologer.
                      Share your birth details and questions for divine guidance.
                    </p>

                    {/* Birth Details Card - Printed in Chat */}
                    {sessionInfo?.client?.birthDetails && (
                        <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 max-w-sm mx-auto text-left shadow-sm">
                           <div className="flex items-center gap-2 mb-2 text-purple-700 font-bold border-b border-purple-200 pb-2">
                              <Star size={16} className="fill-purple-600" />
                              <span>Birth Details Shared</span>
                           </div>
                           <div className="space-y-1 text-sm text-gray-700">
                              <div className="flex justify-between">
                                 <span className="text-gray-500">Date:</span>
                                 <span className="font-medium">{sessionInfo.client.birthDetails.day}/{sessionInfo.client.birthDetails.month}/{sessionInfo.client.birthDetails.year}</span>
                              </div>
                              <div className="flex justify-between">
                                 <span className="text-gray-500">Time:</span>
                                 <span className="font-medium">{String(sessionInfo.client.birthDetails.hour).padStart(2, '0')}:{String(sessionInfo.client.birthDetails.minute).padStart(2, '0')}</span>
                              </div>
                              <div className="flex justify-between">
                                 <span className="text-gray-500">Place:</span>
                                 <span className="font-medium">{sessionInfo.client.birthDetails.latitude?.toFixed(2)}, {sessionInfo.client.birthDetails.longitude?.toFixed(2)}</span>
                              </div>
                              <div className="mt-3 text-xs text-center text-purple-500 italic bg-white p-2 rounded-lg border border-purple-100">
                                 System: These details have been auto-filled into the astrologer's chart calculator.
                              </div>
                           </div>
                        </div>
                    )}
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
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${
                        isMe
                          ? "bg-gradient-to-br from-purple-600 to-indigo-600 text-white"
                          : "bg-white text-gray-700 border border-gray-200"
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
                          isMe ? "text-purple-600" : "text-gray-500"
                        }`}
                      >
                        {isAstrologerMsg && <Crown size={10} />}
                        {senderName}
                      </span>

                      <div
                        className={`p-4 rounded-2xl shadow-sm relative border ${
                          isMe
                            ? "bg-gradient-to-br from-purple-600 to-indigo-700 text-white border-purple-600 rounded-tr-none"
                            : "bg-white text-gray-800 border-gray-200 rounded-tl-none"
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
                              className="w-48 h-8 rounded-lg bg-gray-100 border border-gray-200"
                            >
                              <source src={msg.audioUrl} type="audio/mp3" />
                            </audio>
                          </div>
                        )}

                         {msg.mediaUrl && msg.type === 'image' && (
                          <div className="mt-2 text-center">
                            <img src={msg.mediaUrl} alt="shared" className="rounded-lg max-w-full h-auto border border-gray-200" />
                          </div>
                        )}

                        <div
                          className={`text-[10px] mt-2 flex items-center gap-1 ${
                            isMe
                              ? "text-purple-100 justify-end"
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
                <div className="max-w-[70%] p-4 rounded-2xl bg-white border border-gray-200 shadow-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-150"></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-300"></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
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
      <div className="chat-footer bg-white/90 backdrop-blur-lg border-t border-gray-200 p-4 z-20 shadow-lg">
        <div className="max-w-4xl mx-auto px-4">
          {isRecording && (
            <div className="text-center mb-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-full">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-red-600 text-sm">
                  Recording... Click to stop
                </span>
              </div>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="relative group">
            <div className="relative">
              <div className="absolute inset-0 bg-purple-100 rounded-2xl blur opacity-0 group-hover:opacity-50 transition-opacity"></div>

              <div className="relative bg-white border-2 border-gray-100 rounded-2xl flex items-center gap-2 md:gap-3 px-3 md:px-4 py-3 focus-within:border-purple-200 focus-within:ring-2 focus-within:ring-purple-100 transition-all shadow-sm">
                {!isRecording ? (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-all duration-200 flex-shrink-0"
                    title="Record Audio"
                  >
                    <Mic size={20} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-200 animate-pulse flex-shrink-0"
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
                  className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-all duration-200 flex-shrink-0"
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
                      : "text-gray-300 bg-gray-50 cursor-not-allowed"
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
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-blue-100 hover:border-blue-300 text-blue-600 text-xs font-semibold shadow-sm hover:shadow-md transition-all transform hover:scale-105"
              >
                <Star size={14} />
                Birth Chart
              </button>

              <button
                onClick={() => {
                  setSelectedChart('porutham');
                  setShowChartModal(true);
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-pink-100 hover:border-pink-300 text-pink-600 text-xs font-semibold shadow-sm hover:shadow-md transition-all transform hover:scale-105"
              >
                <Heart size={14} />
                Porutham
              </button>

              <button
                onClick={() => {
                  setSelectedChart('navamsa');
                  setShowChartModal(true);
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-purple-100 hover:border-purple-300 text-purple-600 text-xs font-semibold shadow-sm hover:shadow-md transition-all transform hover:scale-105"
              >
                <Sparkles size={14} />
                Navamsa
              </button>

              <button
                onClick={() => {
                  setSelectedChart('behavior');
                  setShowChartModal(true);
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-orange-100 hover:border-orange-300 text-orange-600 text-xs font-semibold shadow-sm hover:shadow-md transition-all transform hover:scale-105"
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
