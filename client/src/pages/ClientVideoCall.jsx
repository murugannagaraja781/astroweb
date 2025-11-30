// ClientVideoCall.jsx
import React, { useEffect, useRef, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import AuthContext from "../context/AuthContext";

export default function ClientVideoCall({ astrologerId }) {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const socketRef = useRef(null);
  const [waiting, setWaiting] = useState(false);
  const [joined, setJoined] = useState(false);

  // Connect socket once (lazy)
  const ensureSocket = () => {
    if (socketRef.current) return socketRef.current;

    const s = io(import.meta.env.VITE_API_URL, {
      query: { username: user?.name || "anonymous" },
      transports: ["websocket"],
      autoConnect: true,
    });

    socketRef.current = s;
    return s;
  };

  useEffect(() => {
    // Clean up on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.off("callAccepted");
        socketRef.current.off("callRejected");
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createRoomId = () => {
    // stable roomId for this client-astrologer pair
    if (!user || !astrologerId) return null;
    return `${user.id}-${astrologerId}`;
  };

  const handleRequestCall = async () => {
    if (!user) {
      alert("Please login to continue");
      navigate("/login");
      return;
    }

    // Basic client-side check for astrologerId
    if (!astrologerId) {
      alert("Astrologer missing. Try again.");
      return;
    }

    setWaiting(true);

    try {
      // 1) Create call session on backend (reliable)
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/call/initiate`,
        { receiverId: astrologerId },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      const callId = res.data.callId;
      if (!callId) {
        throw new Error("No callId returned from server");
      }

      // 2) Ensure socket connection and join a stable room (client's personal room)
      const s = ensureSocket();

      // join the client's personal room so server can push responses
      s.emit("join", user.id);
      setJoined(true);

      // 3) Listen once for acceptance/rejection
      const onAccepted = ({ callId: acceptedCallId }) => {
        console.log("[ClientVideoCall] callAccepted:", acceptedCallId);
        cleanupListeners();

        // Optionally store details in backend (you may already store on server)
        axios.post(
          `${import.meta.env.VITE_API_URL}/api/chatcalldetails`,
          {
            userId: user.id,
            astrologerId,
            sessionId: acceptedCallId,
            initiatedAt: new Date().toISOString(),
          },
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        ).catch((err) => console.error("Error storing call details:", err));

        setWaiting(false);
        // navigate to the video call page carrying callId
        navigate(`/call/${astrologerId}?callId=${acceptedCallId}`);
      };

      const onRejected = () => {
        console.log("[ClientVideoCall] callRejected");
        cleanupListeners();
        setWaiting(false);
        alert("Astrologer is busy or rejected the call. Please try again later.");
      };

      function cleanupListeners() {
        if (!socketRef.current) return;
        socketRef.current.off("callAccepted", onAccepted);
        socketRef.current.off("callRejected", onRejected);
      }

      socketRef.current.once("callAccepted", onAccepted);
      socketRef.current.once("callRejected", onRejected);

      // 4) Emit signaling event to astrologer (server should forward to astrologer)
      // Using same payload shape you used earlier
      s.emit("callUser", {
        userToCall: astrologerId,
        from: user.id,
        name: user.name,
        type: "video",
        callId,
      });

      // Optionally, start a client-side fallback timeout
      const TIMEOUT_MS = 30_000;
      const timeoutId = setTimeout(() => {
        cleanupListeners();
        setWaiting(false);
        alert("No response from astrologer. Please try again.");
      }, TIMEOUT_MS);

      // clear timeout if user accepted/rejected
      socketRef.current.once("callAccepted", () => clearTimeout(timeoutId));
      socketRef.current.once("callRejected", () => clearTimeout(timeoutId));
    } catch (err) {
      console.error("Error requesting call:", err);
      setWaiting(false);
      const errorMsg = err.response?.data?.message || err.message || "Unknown error";
      alert(`Failed to request call: ${errorMsg}`);
    }
  };

  return (
    <div>
      <button
        onClick={handleRequestCall}
        disabled={waiting}
        className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition ${
          waiting ? "bg-gray-300 text-gray-700" : "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
        }`}
      >
        {waiting ? (
          <>
            <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            </svg>
            Calling...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 7v6a10 10 0 0010 10h0a10 10 0 0010-10V7" />
            </svg>
            Video Call
          </>
        )}
      </button>
    </div>
  );
}
