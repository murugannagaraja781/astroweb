 import { useEffect, useState, useRef, useContext, useCallback } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";
import AuthContext from "../context/AuthContext";
import { Send, Mic, MicOff, Star, Crown, Gem, Sparkles } from "lucide-react";

const socket = io(import.meta.env.VITE_API_URL || "https://astroweb-y0i6.onrender.com");

const Chat = () => {
  const { user } = useContext(AuthContext);
  const { id } = useParams();

  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUser, setOtherUser] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const messagesEndRef = useRef(null);
  const lastMessageRef = useRef("");

  // Auto scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const [sessionStatus, setSessionStatus] = useState("loading");
  const [walletBalance, setWalletBalance] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef(null);

  // Load chat data & session details
  const fetchChat = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      // Fetch history
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/chat/history/session/${id}`,
        { headers }
      );
      setConversation(res.data.messages || []);
      setOtherUser(null); // Will be set from session details if needed

      // Fetch session details for status & balance
      try {
        const sessionRes = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/chat/call?sessionId=${id}`,
          { headers }
        );
        if (sessionRes.data) {
          setSessionStatus(sessionRes.data.status);
          // If user is client, show their balance. If astrologer, show earnings/timer?
          // For now, let's just show timer for both.
          if (sessionRes.data.status === 'active') {
             // Calculate elapsed if active
             const start = new Date(sessionRes.data.startedAt).getTime();
             const now = Date.now();
             setElapsedTime(Math.floor((now - start) / 1000));
          }
        }
      } catch (err) {
        console.error("Error fetching session details:", err);
        setSessionStatus("unknown");
      }

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
      setConversation((prev) => {
        const isDuplicate = prev.some(
          msg => msg.text === newMessage.text &&
                 msg.senderId === newMessage.senderId &&
                 new Date(msg.timestamp).getTime() === new Date(newMessage.timestamp).getTime()
        );
        return isDuplicate ? prev : [...prev, newMessage];
      });
    });

    socket.on("chat:typing", () => {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 1500);
    });

    socket.on("wallet:update", (data) => {
      if (data.sessionId === id) {
        setWalletBalance(data.balance);
        setElapsedTime(data.elapsed);
      }
    });

    socket.on("chat:joined", () => {
        setSessionStatus("active");
    });

    return () => {
      socket.off("chat:message");
      socket.off("chat:typing");
      socket.off("wallet:update");
      socket.off("chat:joined");
    };
  }, [id, fetchChat]);

  // Timer effect
  useEffect(() => {
    if (sessionStatus === 'active') {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [sessionStatus]);

  useEffect(scrollToBottom, [conversation]);

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
    <div className="h-screen flex flex-col bg-[#e5ddd5] relative overflow-hidden">
      <style jsx>{`
        .whatsapp-bg {
          background-image: url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png");
          background-repeat: repeat;
          opacity: 0.4;
        }
        .message-shadow {
          box-shadow: 0 1px 0.5px rgba(0,0,0,0.13);
        }
        .chat-footer {
          padding-bottom: env(safe-area-inset-bottom);
        }
      `}</style>

      {/* WhatsApp Background Pattern */}
      <div className="absolute inset-0 whatsapp-bg pointer-events-none"></div>

      {/* Header */}
      <div className="relative flex items-center justify-between px-4 py-3 bg-[#008069] text-white shadow-md z-10">
        <div className="flex items-center gap-3">
          <div className="p-1 bg-white/20 rounded-full">
            <Crown size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">
              {otherUser?.name || "Astrologer"}
            </h1>
            <div className="flex items-center gap-2 text-xs text-white/80">
              <span>{sessionStatus === 'active' ? 'Online' : 'Waiting...'}</span>
              {sessionStatus === 'active' && (
                <>
                  <span>•</span>
                  <span>{formatTime(elapsedTime)}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <Sparkles size={20} />
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto relative z-0">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          <div className="flex-1 overflow-y-auto px-4 pt-4 pb-20 space-y-2 message-container">
            {conversation.length === 0 ? (
              <div className="text-center py-8">
                <div className="inline-block bg-[#fff5c4] rounded-lg p-3 shadow-sm text-xs text-gray-600">
                  🔒 Messages are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them.
                </div>
              </div>
            ) : (
              conversation.map((msg, index) => {
                const isMe = msg.sender === user.id;

                return (
                  <div
                    key={index}
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[85%] md:max-w-[65%] px-3 py-1.5 rounded-lg message-shadow relative text-sm ${
                        isMe
                          ? "bg-[#d9fdd3] text-gray-900 rounded-tr-none"
                          : "bg-white text-gray-900 rounded-tl-none"
                      }`}
                    >
                      {/* Tail for bubbles */}
                      {isMe ? (
                        <div className="absolute top-0 -right-2 w-0 h-0 border-[8px] border-transparent border-t-[#d9fdd3] border-r-0"></div>
                      ) : (
                        <div className="absolute top-0 -left-2 w-0 h-0 border-[8px] border-transparent border-t-white border-l-0"></div>
                      )}

                      {msg.text && (
                        <p className="leading-relaxed whitespace-pre-wrap break-words pr-16 pb-1">{msg.text}</p>
                      )}

                      {msg.audioUrl && (
                        <div className="mt-1 mb-1">
                          <audio
                            controls
                            className="w-56 h-8"
                          >
                            <source src={msg.audioUrl} type="audio/mp3" />
                          </audio>
                        </div>
                      )}

                      {/* Timestamp & Status */}
                      <div className="absolute bottom-1 right-2 flex items-center gap-1">
                        <span className="text-[10px] text-gray-500">
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </span>
                        {isMe && (
                          <span className="text-[#53bdeb]">
                            {/* Double Tick Icon */}
                            <svg viewBox="0 0 16 11" height="10" width="14" preserveAspectRatio="xMidYMid meet" className="" version="1.1" x="0px" y="0px" enableBackground="new 0 0 16 11">
                              <path fill="currentColor" d="M11.057,9.766l-1.106-1.134c-0.153-0.156-0.399-0.159-0.56-0.005c-0.164,0.156-0.167,0.409-0.005,0.57 l1.383,1.417c0.153,0.156,0.399,0.159,0.56,0.005l4.542-4.542c0.164-0.156,0.167-0.409,0.005-0.57c-0.153-0.156-0.399-0.159-0.56-0.005 L11.057,9.766z"></path>
                              <path fill="currentColor" d="M6.057,9.766l-1.106-1.134c-0.153-0.156-0.399-0.159-0.56-0.005c-0.164,0.156-0.167,0.409-0.005,0.57 l1.383,1.417c0.153,0.156,0.399,0.159,0.56,0.005l4.542-4.542c0.164-0.156,0.167-0.409,0.005-0.57c-0.153-0.156-0.399-0.159-0.56-0.005 L6.057,9.766z"></path>
                              <path fill="currentColor" d="M10.284,4.225L5.742,8.879L4.359,7.462c-0.153-0.156-0.399-0.159-0.56-0.005c-0.164,0.156-0.167,0.409-0.005,0.57 l1.667,1.708c0.153,0.156,0.399,0.159,0.56,0.005l4.833-4.95c0.164-0.156,0.167-0.409,0.005-0.57 C10.696,4.064,10.45,4.061,10.284,4.225z"></path>
                              <path fill="currentColor" d="M1.534,4.225L0.151,5.642c-0.153,0.156-0.399-0.159-0.56-0.005c-0.164,0.156-0.167,0.409-0.005,0.57 l1.667,1.708c0.153,0.156,0.399,0.159,0.56,0.005l4.833-4.95c0.164-0.156,0.167-0.409,0.005-0.57c-0.153-0.156-0.399-0.159-0.56-0.005 L1.534,4.225z"></path>
                            </svg>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="chat-footer absolute bottom-0 left-0 right-0 bg-[#f0f2f5] px-2 py-2 z-20">
        <div className="max-w-4xl mx-auto flex items-end gap-2">
           {/* Record Button */}
           {!isRecording ? (
            <button
              type="button"
              onClick={startRecording}
              disabled={sessionStatus !== 'active'}
              className={`p-3 transition-colors mb-1 ${sessionStatus === 'active' ? 'text-gray-500 hover:text-gray-700' : 'text-gray-300 cursor-not-allowed'}`}
            >
              <Mic size={24} />
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              className="p-3 text-red-500 animate-pulse mb-1"
            >
              <MicOff size={24} />
            </button>
          )}

          <form
            onSubmit={sendMessage}
            className="flex-1 flex items-end gap-2 bg-white rounded-2xl px-4 py-2 shadow-sm border border-gray-100"
          >
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onInput={handleTyping}
              disabled={sessionStatus !== 'active'}
              placeholder={sessionStatus === 'active' ? "Type a message" : "Waiting for astrologer to accept..."}
              className="flex-1 bg-transparent focus:outline-none text-gray-800 text-base py-2 max-h-32 overflow-y-auto disabled:text-gray-400"
              style={{ color: '#111b21' }}
            />
          </form>

          {/* Send Button */}
          <button
            onClick={sendMessage}
            disabled={!message.trim() || sessionStatus !== 'active'}
            className={`p-3 rounded-full mb-1 transition-all duration-200 ${
              message.trim() && sessionStatus === 'active'
                ? "bg-[#008069] text-white shadow-md hover:bg-[#006d59]"
                : "bg-transparent text-gray-400"
            }`}
          >
            <Send size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;