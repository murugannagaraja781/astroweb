import { useEffect, useState, useContext, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";
import AuthContext from "../context/AuthContext";

const AstrologerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [astro, setAstro] = useState(null);
  const [waiting, setWaiting] = useState(false);
  const [errorPopup, setErrorPopup] = useState(null);
  const [balance, setBalance] = useState(0);

  const API_URL =
    (typeof import.meta !== "undefined" &&
      import.meta.env &&
      import.meta.env.VITE_API_URL) ||
    process.env.VITE_API_URL ||
    "https://astroweb-production.up.railway.app";

  // Socket needs to be initialized with the URL
  // Note: In a real app, socket might be a singleton or from context
  const socket = io(API_URL);

  useEffect(() => {
    axios.get(`${API_URL}/api/public/astrologers/${id}`).then((res) => setAstro(res.data));
  }, [id, API_URL]);

  const handleAction = useCallback((action) => {
    if (!user) {
      alert("Please login to continue");
      navigate("/login");
      return;
    }

    if (user.role === "client" && balance < 1) {
      alert(
        "Insufficient balance! Please add money to your wallet. Minimum ₹1 required."
      );
      navigate("/dashboard");
      return;
    }

    if (!astro || !astro.isOnline) {
      alert("This astrologer is currently offline. Please try again later.");
      return;
    }

    if (action === "call") {
      navigate(`/call/${id}`);
    } else if (action === "chat") {
      setWaiting(true);
      setErrorPopup(null);

      const timeoutId = setTimeout(() => {
        setWaiting(false);
        setErrorPopup({
            message: "Connection timed out. The server is taking too long to respond.",
            type: "error"
        });
      }, 15000);

      socket.emit("user_online", { userId: user.id });

      socket.once("chat:requested", ({ sessionId }) => {
        console.log("Session created, joining room:", sessionId);
        socket.emit("join_chat", { sessionId });
      });

      axios.post(`${API_URL}/api/chat/request`, {
        astrologerId: id
      }, {
        headers: { 'x-auth-token': localStorage.getItem('token') }
      }).catch(err => {
        console.error("API Request Error:", err);
        clearTimeout(timeoutId);
        setWaiting(false);
        setErrorPopup({
            message: err.response?.data?.msg || "Failed to send chat request via API",
            type: "error"
        });
      });

      socket.once("chat:joined", ({ sessionId }) => {
        clearTimeout(timeoutId);
        setWaiting(false);
        navigate(`/chat/${sessionId}`);
      });

      socket.once("chat:error", (err) => {
        clearTimeout(timeoutId);
        setWaiting(false);
        console.error("Chat Error:", err);
        setErrorPopup({
            message: err.error || "Failed to connect to chat server.",
            type: "error"
        });
      });
    }
  }, [user, balance, astro, id, navigate, API_URL]);

  if (!astro) return <p>Loading...</p>;

  return (
    <div>
      <h1>{astro.name}</h1>
      <p>₹{astro.ratePerMinute}/min</p>

      <button onClick={() => handleAction('chat')}>
        Start Chat
      </button>
      <button onClick={() => handleAction('call')}>
        Start Call
      </button>

      {waiting && <p>Waiting for astrologer to accept…</p>}
      {errorPopup && <p style={{ color: 'red' }}>{errorPopup.message}</p>}
    </div>
  );
};

export default AstrologerDetail;
