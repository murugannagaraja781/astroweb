import { useEffect, useState, useRef, useContext, useCallback } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";
import AuthContext from "../context/AuthContext";
import { Send, Mic, MicOff, PhoneCall, PhoneOff, Loader } from "lucide-react";

const API_URL = process.env.VITE_API_URL || "https://astroweb-production.up.railway.app";
const socket = io(API_URL);

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
        `${API_URL}/api/chat/history/session/${id}`,
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );
      setConversation(res.data.messages || []);
      setOtherUser(null);
    } catch (error) {
      console.error('[Chat] Failed to fetch chat history:', error);
      setConversation([]);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
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
    } catch (error) {}
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-purple-900 to-black text-white">
      {/* Header */}
      <div className="flex items-center p-4 bg-white/10 backdrop-blur-lg border-b border-white/20">
        <h1 className="text-xl font-semibold">
          Chat with {otherUser?.name || "User"}
        </h1>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-28">
        {conversation.map((msg, index) => (
          <div
            key={index}
            className={`w-full flex ${
              msg.sender === user.id ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[75%] p-3 rounded-2xl shadow-lg ${
                msg.sender === user.id
                  ? "bg-purple-600 text-white"
                  : "bg-white/15 border border-white/20"
              }`}
            >
              {msg.text && <p className="text-sm">{msg.text}</p>}

              {msg.audioUrl && (
                <audio controls className="mt-2 w-full">
                  <source src={msg.audioUrl} type="audio/mp3" />
                </audio>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="text-gray-300 text-sm italic px-3">Typing…</div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Footer */}
      <form onSubmit={sendMessage} className="w-full px-4 pb-6 pt-2 bg-transparent z-10">
        <div
          className="
            max-w-3xl mx-auto
            bg-white/15 backdrop-blur-xl
            border border-white/20
            shadow-[0_8px_20px_rgba(0,0,0,0.4)]
            rounded-3xl
            flex items-center gap-3
            px-4 py-3
          "
        >
          {!isRecording ? (
            <button
              type="button"
              onClick={startRecording}
              className="text-purple-300 hover:text-purple-100"
            >
              <Mic size={22} />
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              className="text-red-400 hover:text-red-300"
            >
              <MicOff size={22} />
            </button>
          )}

          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onInput={handleTyping}
            placeholder="Type your message…"
            className="
              flex-1 bg-transparent text-white placeholder-gray-300
              focus:outline-none text-sm md:text-base
            "
          />

          <button
            type="submit"
            className="
              bg-gradient-to-br from-purple-600 to-pink-600
              text-white p-2 rounded-full shadow-lg
              hover:scale-110 transition-transform
            "
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat;
