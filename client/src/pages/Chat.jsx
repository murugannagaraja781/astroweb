 import { useEffect, useState, useRef, useContext, useCallback } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";
import AuthContext from "../context/AuthContext";
import { Send, Mic, MicOff, PhoneCall, PhoneOff, Loader, Star, Moon, Sun } from "lucide-react";

const socket = io(import.meta.env.VITE_API_URL || "https://astroweb-y0i6.onrender.com");

const Chat = () => {
  const { user } = useContext(AuthContext);
  const { id } = useParams();

  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUser, setOtherUser] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const messagesEndRef = useRef(null);

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

  useEffect(() => {
    if (id) {
      console.log(`[Chat] Joining session: ${id}`);
      socket.emit("join_chat", { sessionId: id });
    }

    fetchChat();

    socket.on("chat:message", (newMessage) => {
      setConversation((prev) => [...prev, newMessage]);
    });

    socket.on("chat:typing", () => {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 1500);
    });

    return () => {
      socket.off("chat:message");
      socket.off("chat:typing");
    };
  }, [id, fetchChat]);

  useEffect(scrollToBottom, [conversation]);

  // --- Send Message ---
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const newMsg = {
      senderId: user.id,
      text: message,
      timestamp: new Date(),
      status: "sent",
    };

    socket.emit("chat:message", {
      sessionId: id,
      senderId: user.id,
      text: message,
    });
    setConversation((prev) => [...prev, newMsg]);
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
    <div className="h-screen flex flex-col bg-gradient-to-br from-indigo-950 via-purple-900 to-violet-950 text-white relative overflow-hidden">
      {/* Cosmic Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-2 h-2 bg-white rounded-full opacity-60 animate-pulse"></div>
        <div className="absolute top-20 right-20 w-1 h-1 bg-yellow-200 rounded-full opacity-40"></div>
        <div className="absolute bottom-32 left-1/4 w-1 h-1 bg-blue-300 rounded-full opacity-50 animate-pulse delay-700"></div>
        <div className="absolute top-1/2 right-16 w-1 h-1 bg-white rounded-full opacity-30"></div>
        <div className="absolute bottom-20 right-1/3 w-2 h-2 bg-purple-300 rounded-full opacity-40 animate-pulse delay-300"></div>
      </div>

      {/* Header */}
      <div className="relative flex items-center justify-between p-4 bg-white/5 backdrop-blur-lg border-b border-white/10 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full">
            <Moon size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">
              Cosmic Connection
            </h1>
            <p className="text-sm text-purple-200">
              Chat with {otherUser?.name || "Astrologer"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-purple-200">
          <Star size={16} className="fill-current" />
          <span>Online</span>
        </div>
      </div>

      {/* Messages Container - Centered */}
      <div className="flex-1 overflow-y-auto relative z-0">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          {/* Messages List */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
            {conversation.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full mb-4">
                  <Star className="text-white" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-purple-200 mb-2">
                  Welcome to Your Cosmic Journey
                </h3>
                <p className="text-purple-300 text-sm max-w-md mx-auto">
                  Begin your spiritual conversation with the astrologer.
                  Share your thoughts, ask questions, and discover the universe's guidance.
                </p>
              </div>
            ) : (
              conversation.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${
                    msg.sender === user.id ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[70%] p-4 rounded-2xl shadow-lg relative ${
                      msg.sender === user.id
                        ? "bg-gradient-to-br from-purple-600 to-pink-600 text-white"
                        : "bg-white/10 backdrop-blur-sm border border-white/20 text-white"
                    }`}
                  >
                    {/* Message Bubble Decoration */}
                    {msg.sender === user.id && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-purple-600 rounded-full opacity-60"></div>
                    )}

                    {msg.text && (
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                    )}

                    {msg.audioUrl && (
                      <div className="mt-2">
                        <audio
                          controls
                          className="w-48 h-8 rounded-lg bg-black/20"
                        >
                          <source src={msg.audioUrl} type="audio/mp3" />
                        </audio>
                      </div>
                    )}

                    {/* Timestamp */}
                    <div className={`text-xs mt-2 ${
                      msg.sender === user.id ? 'text-purple-200' : 'text-purple-300'
                    }`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="max-w-[70%] p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-150"></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-300"></div>
                  </div>
                  <p className="text-xs text-purple-300 mt-1">Astrologer is typing...</p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="relative z-10 bg-gradient-to-t from-indigo-950/80 via-purple-900/80 to-transparent pt-8 pb-6">
        <div className="max-w-4xl mx-auto px-4">
          <form
            onSubmit={sendMessage}
            className="relative group"
          >
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>

              <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl flex items-center gap-3 px-4 py-3">
                {/* Record Button */}
                {!isRecording ? (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="p-2 text-purple-300 hover:text-purple-100 hover:bg-white/10 rounded-full transition-all duration-200"
                    title="Record Audio"
                  >
                    <Mic size={20} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-white/10 rounded-full transition-all duration-200 animate-pulse"
                    title="Stop Recording"
                  >
                    <MicOff size={20} />
                  </button>
                )}

                {/* Message Input */}
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onInput={handleTyping}
                  placeholder="Send a cosmic message..."
                  className="flex-1 bg-transparent text-white placeholder-purple-300 focus:outline-none text-sm md:text-base"
                />

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!message.trim()}
                  className={`p-2 rounded-full transition-all duration-200 ${
                    message.trim()
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:shadow-xl hover:scale-110"
                      : "text-purple-400 opacity-50"
                  }`}
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </form>

          {/* Recording Indicator */}
          {isRecording && (
            <div className="text-center mt-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-full">
                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                <span className="text-red-300 text-sm">Recording... Click to stop</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;