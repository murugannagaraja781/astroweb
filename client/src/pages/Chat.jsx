import { useEffect, useState, useRef, useContext } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import AuthContext from "../context/AuthContext";

const Chat = () => {
  const { user } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [chatId, setChatId] = useState(null);
  const messagesEndRef = useRef(null);

  // CONNECT SOCKET
  useEffect(() => {
    const s = io(import.meta.env.VITE_API_URL);
    setSocket(s);

    return () => s.disconnect();
  }, []);

  // INIT CHAT + JOIN ROOM
  useEffect(() => {
    if (!socket || !user) return;

    const startChat = async () => {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/chat/initiate`,
        { receiverId: "ASTRO_ID" }
      );

      setChatId(res.data.chatId);

      socket.emit("join", res.data.chatId);
    };

    startChat();

  }, [socket, user]);

  // LISTEN FOR SOCKET EVENTS
  useEffect(() => {
    if (!socket) return;

    socket.on("receiveMessage", (msg) => {
      setMessages(prev => [...prev, msg]);
      scrollToBottom();
    });

    return () => {
      socket.off("receiveMessage");
    };

  }, [socket]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const msg = {
      roomId: chatId,
      senderId: user.id,
      text: message,
      timestamp: new Date(),
      type: "text"
    };

    socket.emit("sendMessage", msg);
    setMessage("");
  };

  return (
    <div className="h-screen flex flex-col">

      <div className="flex-1 overflow-y-auto p-4 bg-gray-100">
        {messages.map((msg, i) => (
          <div key={i} className={`p-3 my-2 rounded ${msg.senderId === user.id ? 'bg-orange-500 text-white ml-auto' : 'bg-white'}`}>
            {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef}></div>
      </div>

      <form onSubmit={sendMessage} className="p-3 flex gap-2 bg-white border-t">
        <input
          className="flex-1 border p-2 rounded"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button className="bg-orange-600 text-white px-4 rounded">Send</button>
      </form>
    </div>
  );
};

export default Chat;
