import { useEffect, useState, useRef, useContext, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import AgoraRTC, {
  AgoraRTCProvider,
  useLocalCameraTrack,
  useLocalMicrophoneTrack,
  usePublish,
  useRemoteUsers,
  useJoin,
  LocalUser,
  RemoteUser,
} from "agora-rtc-react";
import axios from "axios";
import AuthContext from "../context/AuthContext";
import CallHistoryList from "../components/CallHistoryList";
import OnlineAstrologers from "../components/OnlineAstrologers";
import OffersList from "../components/OffersList";
import { ArrowLeft } from "lucide-react";
import { useToast } from "../context/ToastContext";

const socket = io(import.meta.env.VITE_API_URL);
// Use VITE_AGORA_APP_ID so we can manage different environments (dev/prod)
// Fallback to server env if provided in the README/server .env — but prefer client-side Vite env.
const APP_ID =
  import.meta.env.VITE_AGORA_APP_ID || import.meta.env.VITE_APP_ID || "";

// Helper component to fetch and display astrologers
const OnlineAstrologersWrapper = () => {
  const [astrologers, setAstrologers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAstrologers = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/public/astrologers`
        );
        setAstrologers(res.data);
      } catch (err) {
        console.error("Failed to fetch astrologers", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAstrologers();
  }, []);

  if (loading) {
    return (
      <div className="h-24 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  return <OnlineAstrologers astrologers={astrologers} />;
};

const VideoCallContent = ({
  client,
  callId,
  receiverId,
  setCallActive,
  callActive,
  userRole,
}) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { addToast } = useToast();

  // Agora Hooks
  const { localCameraTrack } = useLocalCameraTrack();
  const { localMicrophoneTrack } = useLocalMicrophoneTrack();
  const remoteUsers = useRemoteUsers();

  // useJoin & usePublish are controlled by `callActive` (2nd arg) — they won't attempt join until true.
  // Guard against missing APP_ID (e.g. env not configured) and missing user/callId to prevent runtime errors.
  const [rtcToken, setRtcToken] = useState(null);
  useJoin(
    { appid: APP_ID, channel: callId, uid: user?.id, token: rtcToken || null },
    !!callActive && !!APP_ID && !!user && !!callId && !!rtcToken
  );
  usePublish(
    [localMicrophoneTrack, localCameraTrack],
    !!callActive && !!localMicrophoneTrack && !!localCameraTrack
  );

  const [duration, setDuration] = useState(0);
  const [cost, setCost] = useState(0);
  const [rate] = useState(1); // ₹1 per minute
  const [balance, setBalance] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!APP_ID) {
      console.error(
        "Agora APP_ID not configured. Set VITE_AGORA_APP_ID in client/.env"
      );
      addToast("Video codec (Agora) not configured. Contact support.", "error");
      return;
    }
    if (user && user.role !== "admin") {
      const fetchBalance = async () => {
        try {
          const res = await axios.get(
            `${import.meta.env.VITE_API_URL}/api/wallet/balance`
          );
          setBalance(res.data.balance);
        } catch (err) {
          console.error("❌ Failed to fetch balance:", err);
          addToast("Failed to fetch wallet balance", "error");
        }
      };
      fetchBalance();
    }
  }, [user, addToast]);

  const leaveCall = useCallback(async () => {
    setCallActive(false);
    clearInterval(timerRef.current);

    socket.emit("endCall", { to: receiverId });

    if (callId) {
      try {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/call/end`, {
          callId,
          duration,
        });
      } catch (err) {
        console.error("Error ending call:", err);
      }
    }

    try {
      // Unpublish and stop local tracks
      if (
        Array.isArray(localMicrophoneTrack) ||
        Array.isArray(localCameraTrack)
      ) {
        // very unlikely but handle array traces
        (localMicrophoneTrack || []).forEach((t) => t?.stop?.());
        (localCameraTrack || []).forEach((t) => t?.stop?.());
      } else {
        localMicrophoneTrack?.stop?.();
        localCameraTrack?.stop?.();
      }

      if (client && client.leave) {
        await client.leave();
      }
    } catch (err) {
      console.error("Agora leave error:", err);
    }

    navigate(
      userRole === "astrologer" ? "/astrologer-dashboard" : "/dashboard"
    );
  }, [
    callId,
    client,
    localMicrophoneTrack,
    localCameraTrack,
    receiverId,
    userRole,
    navigate,
    setCallActive,
    duration,
  ]);

  useEffect(() => {
    console.log("VideoCallContent mount", {
      APP_ID,
      callId,
      userId: user?.id,
      callActive,
    });
    console.log("local tracks", { localCameraTrack, localMicrophoneTrack });
    if (callActive && (user?.role === "admin" || balance > 0)) {
      const maxDuration =
        user?.role === "admin" ? Infinity : (balance / rate) * 60; // seconds
      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          const newDuration = prev + 1;
          if (newDuration >= maxDuration) {
            leaveCall();
            addToast("Call ended due to insufficient balance.", "warning");
          }
          return newDuration;
        });
        setCost((prev) => prev + rate / 60);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [
    callActive,
    balance,
    rate,
    leaveCall,
    addToast,
    callId,
    localCameraTrack,
    localMicrophoneTrack,
    user?.id,
    user?.role,
  ]);

  useEffect(() => {
    // Request Agora RTC token from server when starting/joining a call
    const fetchRtcToken = async () => {
      if (!callActive || !callId || !user) return;
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/agora/token`,
          {
            params: { channel: callId, uid: user.id },
          }
        );
        setRtcToken(res.data.token);
      } catch (err) {
        console.error("Failed to fetch Agora RTC token", err);
        addToast("Video token acquisition failed", "error");
      }
    };
    fetchRtcToken();
  }, [callActive, callId, user, addToast]);

  useEffect(() => {
    socket.on("callEnded", () => {
      console.log("socket event: callEnded");
      addToast("Call ended by remote user", "info");
      leaveCall();
    });

    socket.on("callAccepted", ({ callId }) => {
      console.log("socket event: callAccepted", callId);
      setCallActive(true);
      addToast("Call accepted", "success");
    });

    socket.on("callRejected", () => {
      console.log("socket event: callRejected");
      addToast("Call rejected by remote user", "error");
      setCallActive(false);
    });

    return () => {
      socket.off("callEnded");
      socket.off("callAccepted");
      socket.off("callRejected");
    };
  }, [leaveCall, addToast, setCallActive]);

  return (
    <div
      className={`h-screen flex flex-col items-center justify-center text-white ${
        userRole === "astrologer" ? "bg-orange-900" : "bg-gray-900"
      }`}
    >
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={() => navigate("/call/0")}
          className="bg-white/10 p-2 rounded-full hover:bg-white/20 mb-2"
        >
          <ArrowLeft />
        </button>
        <p>
          Duration: {Math.floor(duration / 60)}:
          {(duration % 60).toString().padStart(2, "0")}
        </p>
        <p>Cost: ₹{cost.toFixed(2)}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full h-3/4 p-4">
        <div className="relative border-2 border-indigo-500 rounded overflow-hidden bg-black">
          <LocalUser
            audioTrack={localMicrophoneTrack}
            cameraTrack={localCameraTrack}
            micOn={true}
            cameraOn={true}
            cover="https://www.agora.io/en/wp-content/uploads/2022/10/3d-spatial-audio-icon.svg"
          >
            <div className="absolute inset-0 flex items-center justify-center z-0">
              <img
                src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
                alt="Placeholder"
                className="w-24 h-24 opacity-50"
              />
            </div>
            <samp className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 rounded z-10">
              You
            </samp>
          </LocalUser>
        </div>

        {remoteUsers.map((user) => (
          <div
            key={user.uid}
            className="relative border-2 border-green-500 rounded overflow-hidden bg-black"
          >
            <RemoteUser
              user={user}
              cover="https://cdn-icons-png.flaticon.com/512/149/149071.png"
            >
              <samp className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 rounded z-10">
                Remote
              </samp>
            </RemoteUser>
            {!user.hasVideo && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <img
                  src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
                  alt="User"
                  className="w-32 h-32 rounded-full"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-4">
        <button
          onClick={leaveCall}
          className="bg-red-600 px-6 py-3 rounded-full font-bold hover:bg-red-700"
        >
          End Call
        </button>
      </div>
    </div>
  );
};

const VideoCall = () => {
  const { id: otherUserId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [callId, setCallId] = useState(null);
  const [callActive, setCallActive] = useState(false);
  const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
  const query = new URLSearchParams(window.location.search);
  const incomingCallId = query.get("callId");
  const { addToast } = useToast();

  const [callHistory, setCallHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    if (otherUserId === "0" && user) {
      const fetchHistory = async () => {
        try {
          const res = await axios.get(
            `${import.meta.env.VITE_API_URL}/api/call/history`
          );
          setCallHistory(res.data);
          setLoadingHistory(false);
        } catch (err) {
          console.error("Error fetching call history:", err);
          setLoadingHistory(false);
        }
      };
      fetchHistory();
    }
  }, [otherUserId, user]);

  useEffect(() => {
    if (!user || otherUserId === "0") return;

    socket.emit("join", user.id);

    const startCall = async () => {
      try {
        if (user.role === "client") {
          // Client initiates
          const res = await axios.post(
            `${import.meta.env.VITE_API_URL}/api/call/initiate`,
            {
              receiverId: otherUserId,
            }
          );
          console.log("call initiation response", res.data);
          const newCallId = res.data.callId;
          setCallId(newCallId);
          setCallActive(true);

          // Send call signal
          socket.emit("callUser", {
            userToCall: otherUserId,
            from: user.id,
            name: user.name,
            callId: newCallId,
            type: "video",
          });
        } else if (user.role === "astrologer") {
          // Astrologer joins
          if (incomingCallId) {
            setCallId(incomingCallId);
            setCallActive(true);
          } else {
            addToast("No call ID found for astrologer to join.", "error");
          }
        }
      } catch (err) {
        console.error("Error starting call:", err);
        addToast("Call failed to start", "error");
        throw err;
      }
    };

    startCall();
  }, [user, otherUserId, incomingCallId, addToast]);

  // --- RENDER: History View (ID = 0) ---
  if (otherUserId === "0") {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-white p-4 shadow-sm border-b border-gray-100 sticky top-0 z-10">
          <h1 className="text-xl font-bold text-gray-800">
            Video Call Astrologers
          </h1>
        </div>

        <div className="p-4 max-w-4xl mx-auto">
          {/* Online Astrologers Section */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Online Now
            </h2>
            <OnlineAstrologersWrapper />
          </div>

          {/* Offers Section */}
          <OffersList />

          {/* History Section */}
          {user ? (
            <div className="mt-8">
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                Call History
              </h2>
              {loadingHistory ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <CallHistoryList calls={callHistory} userRole={user?.role} />
              )}
            </div>
          ) : (
            <div className="mt-8 p-6 bg-blue-50 rounded-xl text-center border border-blue-100">
              <p className="text-gray-600 mb-4">
                Login to view your call history and consult with top
                astrologers.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="bg-blue-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-blue-700 transition-colors"
              >
                Login Now
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!callId) return <div className="text-white">Initializing Call...</div>;

  return (
    <AgoraRTCProvider client={client}>
      <div
        className={user?.role === "astrologer" ? "theme-orange" : "theme-dark"}
      >
        <VideoCallContent
          client={client}
          callId={callId}
          receiverId={otherUserId}
          callActive={callActive}
          setCallActive={setCallActive}
          userRole={user?.role}
        />
      </div>
    </AgoraRTCProvider>
  );
};

export default VideoCall;
