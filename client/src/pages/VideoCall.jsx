import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useContext,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import AgoraRTC from "agora-rtc-sdk-ng";
import axios from "axios";
import AuthContext from "../context/AuthContext";
import CallHistoryList from "../components/CallHistoryList";
import OnlineAstrologers from "../components/OnlineAstrologers";
import OffersList from "../components/OffersList";
import { ArrowLeft } from "lucide-react";
import { useToast } from "../context/ToastContext";

const SOCKET_URL = import.meta.env.VITE_API_URL;
const APP_ID =
  import.meta.env.VITE_AGORA_APP_ID || import.meta.env.VITE_APP_ID || "";
const socket = io(SOCKET_URL, { autoConnect: false });

// Small helper to format duration mm:ss
const formatDuration = (sec) =>
  `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, "0")}`;

export default function VideoCall() {
  const { id: otherUserId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { addToast } = useToast();

  // Agora client - memoized so it doesn't recreate on every render
  const client = useMemo(
    () => AgoraRTC.createClient({ mode: "rtc", codec: "vp8" }),
    []
  );

  // local/remote tracks and state
  const localVideoTrackRef = useRef(null);
  const localAudioTrackRef = useRef(null);
  const localVideoEl = useRef(null);
  const remoteContainerRef = useRef(null);

  const [callId, setCallId] = useState(null);
  const [rtcToken, setRtcToken] = useState(null);
  const [callActive, setCallActive] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState([]);

  const [duration, setDuration] = useState(0);
  const timerRef = useRef(null);

  // Wallet and pricing state
  const [balance, setBalance] = useState(0);
  const RATE_PER_MIN = 1; // ₹1 per minute

  // Call history for otherUserId === '0'
  const [callHistory, setCallHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // --- Helpers: fetch wallet balance, fetch token ---
  const fetchBalance = useCallback(async () => {
    if (!user) return;
    try {
      const res = await axios.get(`${SOCKET_URL}/api/wallet/balance`);
      setBalance(res.data.balance || 0);
    } catch (err) {
      console.error("Failed to fetch balance", err);
      addToast("Failed to fetch wallet balance", "error");
    }
  }, [user, addToast]);

  const fetchRtcToken = useCallback(async (channel, uid) => {
    try {
      const res = await axios.get(`${SOCKET_URL}/api/agora/token`, {
        params: { channel, uid },
      });
      return res.data.token;
    } catch (err) {
      console.error("Failed to fetch RTC token", err);
      throw err;
    }
  }, []);

  // --- Socket setup ---
  useEffect(() => {
    if (!user) return;
    socket.auth = { userId: user.id };
    socket.connect();

    // Events
    socket.on("connect", () => console.log("socket connected", socket.id));

    socket.on("callAccepted", async ({ callId: acceptedCallId }) => {
      console.log("call accepted", acceptedCallId);
      addToast("Call accepted", "success");

      // If we are the client initiator we probably already have callId but ensure
      const cid = acceptedCallId || callId;
      if (!cid) return;
      setCallId(cid);

      try {
        const token = await fetchRtcToken(cid, user.id);
        setRtcToken(token);
        setCallActive(true); // only set active after token set
      } catch (err) {
        addToast("Failed to get call token", "error");
      }
    });

    socket.on("callRejected", () => {
      addToast("Call rejected by remote user", "error");
      setCallActive(false);
      setCallId(null);
    });

    socket.on("endCall", () => {
      addToast("Call ended by remote user", "info");
      leaveCall();
    });

    return () => {
      socket.off("connect");
      socket.off("callAccepted");
      socket.off("callRejected");
      socket.off("endCall");
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, callId, fetchRtcToken]);

  // --- Fetch call history when otherUserId === '0' ---
  useEffect(() => {
    if (otherUserId !== "0" || !user) return;
    const fetchHistory = async () => {
      try {
        const res = await axios.get(`${SOCKET_URL}/api/call/history`);
        setCallHistory(res.data || []);
      } catch (err) {
        console.error("Error fetching call history:", err);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistory();
  }, [otherUserId, user]);

  // --- Fetch wallet balance on mount (non-admins) ---
  useEffect(() => {
    if (!user) return;
    if (user.role !== "admin") fetchBalance();
  }, [user, fetchBalance]);

  // --- Join process using manual Agora SDK flow ---
  useEffect(() => {
    let joined = false;

    const handleUserPublished = async (remoteUser, mediaType) => {
      try {
        await client.subscribe(remoteUser, mediaType);
        if (mediaType === "video") {
          // create or reuse DOM element for remote user
          const el = document.createElement("div");
          el.id = `remote-${remoteUser.uid}`;
          el.className = "remote-video p-1";
          el.style.width = "100%";
          el.style.height = "100%";
          remoteContainerRef.current?.appendChild(el);
          remoteUser.videoTrack?.play(el);
        }
        if (mediaType === "audio") {
          remoteUser.audioTrack?.play();
        }
        setRemoteUsers((prev) => {
          if (prev.find((u) => u.uid === remoteUser.uid)) return prev;
          return [...prev, remoteUser];
        });
      } catch (err) {
        console.error("Failed to handle user-published", err);
      }
    };

    const handleUserUnpublished = (remoteUser) => {
      // Remove DOM
      const el = document.getElementById(`remote-${remoteUser.uid}`);
      if (el && el.parentNode) el.parentNode.removeChild(el);
      setRemoteUsers((prev) => prev.filter((u) => u.uid !== remoteUser.uid));
    };

    const startJoin = async () => {
      if (!callActive || !callId || !rtcToken || !APP_ID || !user) return;
      joined = true;

      try {
        await client.join(APP_ID, callId, rtcToken, user.id);

        // create local tracks
        const [audioTrack, videoTrack] = await Promise.all([
          AgoraRTC.createMicrophoneAudioTrack(),
          AgoraRTC.createCameraVideoTrack(),
        ]);

        localAudioTrackRef.current = audioTrack;
        localVideoTrackRef.current = videoTrack;

        // play local preview
        if (localVideoEl.current) {
          videoTrack.play(localVideoEl.current);
        }

        // publish
        await client.publish([audioTrack, videoTrack]);

        // set listeners for remote users
        client.on("user-published", handleUserPublished);
        client.on("user-unpublished", handleUserUnpublished);

        // start timer
        timerRef.current = setInterval(() => {
          setDuration((d) => d + 1);
        }, 1000);
      } catch (err) {
        console.error("Agora join/publish failed", err);
        addToast("Video call setup failed", "error");
        // cleanup on failure
        await leaveCall();
      }
    };

    startJoin();

    return () => {
      client.off("user-published", handleUserPublished);
      client.off("user-unpublished", handleUserUnpublished);
      if (joined) {
        // cleanup handled by leaveCall if it runs; but ensure no interval leak
        clearInterval(timerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callActive, callId, rtcToken, APP_ID, user, client]);

  // --- Initiate a call (client -> astrologer) ---
  const initiateCall = useCallback(async () => {
    if (!user || !otherUserId) return;
    try {
      const res = await axios.post(`${SOCKET_URL}/api/call/initiate`, {
        receiverId: otherUserId,
      });
      const newCallId = res.data.callId;
      setCallId(newCallId);

      // fetch token immediately so we can join once remote accepts
      // some servers might give token as part of initiation; adjust if your API returns token
      const token = await fetchRtcToken(newCallId, user.id);
      setRtcToken(token);

      // Emit to remote user that we are calling and include callId
      socket.emit("callUser", {
        userToCall: otherUserId,
        from: user.id,
        name: user.name,
        callId: newCallId,
        type: "video",
      });

      addToast("Ringing...", "info");
    } catch (err) {
      console.error("Initiate call failed", err);
      addToast("Failed to start call", "error");
    }
  }, [otherUserId, user, fetchRtcToken, addToast]);

  // --- For astrologer: accept incoming call (incomingCallId from query) ---
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const incomingCallId = query.get("callId");
    if (user && user.role === "astrologer" && incomingCallId) {
      (async () => {
        setCallId(incomingCallId);
        try {
          const token = await fetchRtcToken(incomingCallId, user.id);
          setRtcToken(token);
          setCallActive(true);
        } catch (err) {
          addToast("Failed to join incoming call", "error");
        }
      })();
    }
  }, [user, fetchRtcToken, addToast]);

  // --- Leave call ---
  const leaveCall = useCallback(async () => {
    try {
      // stop and close local tracks
      if (localVideoTrackRef.current) {
        try {
          localVideoTrackRef.current.stop();
          localVideoTrackRef.current.close();
        } catch (e) {
          console.warn("local video cleanup", e);
        }
        localVideoTrackRef.current = null;
      }
      if (localAudioTrackRef.current) {
        try {
          localAudioTrackRef.current.stop();
          localAudioTrackRef.current.close();
        } catch (e) {
          console.warn("local audio cleanup", e);
        }
        localAudioTrackRef.current = null;
      }

      // unpublish and leave
      try {
        await client.unpublish();
      } catch (e) {
        // ignore if not published
      }

      try {
        await client.leave();
      } catch (e) {
        console.warn("client leave failed", e);
      }

      clearInterval(timerRef.current);
      setDuration(0);
      setCallActive(false);

      // notify backend
      if (callId) {
        try {
          await axios.post(`${SOCKET_URL}/api/call/end`, { callId, duration });
          socket.emit("endCall", { to: otherUserId });
        } catch (err) {
          console.error("Error ending call on server", err);
        }
      }

      // navigate back
      navigate(
        user?.role === "astrologer" ? "/astrologer-dashboard" : "/dashboard"
      );
    } catch (err) {
      console.error("Error leaving call", err);
    }
  }, [client, callId, otherUserId, navigate, user?.role]);

  // --- Render views ---
  if (otherUserId === "0") {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-white p-4 shadow-sm border-b border-gray-100 sticky top-0 z-10">
          <h1 className="text-xl font-bold text-gray-800">
            Video Call Astrologers
          </h1>
        </div>

        <div className="p-4 max-w-4xl mx-auto">
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Online Now
            </h2>
            <OnlineAstrologers />
          </div>

          <OffersList />

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

  // If we have a user and an otherUserId (normal call page)
  return (
    <div
      className={user?.role === "astrologer" ? "theme-orange" : "theme-dark"}
    >
      <div className="h-screen flex flex-col items-center justify-center text-white">
        <div className="absolute top-4 left-4 z-10">
          <button
            onClick={() => navigate(`/call/0`)}
            className="bg-white/10 p-2 rounded-full hover:bg-white/20 mb-2"
          >
            <ArrowLeft />
          </button>
          <p>Duration: {formatDuration(duration)}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full h-3/4 p-4">
          <div className="relative border-2 border-indigo-500 rounded overflow-hidden bg-black flex items-center justify-center">
            <div ref={localVideoEl} style={{ width: "100%", height: "100%" }} />
            <samp className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 rounded z-10">
              You
            </samp>
          </div>

          <div
            ref={remoteContainerRef}
            className="relative border-2 border-green-500 rounded overflow-hidden bg-black"
          >
            {/* remote videos appended here by SDK */}
            {remoteUsers.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <img
                  src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
                  alt="User"
                  className="w-32 h-32 rounded-full"
                />
              </div>
            )}
            <samp className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 rounded z-10">
              Remote
            </samp>
          </div>
        </div>

        <div className="mt-4 flex gap-4">
          {!callId && user?.role === "client" && (
            <button
              onClick={initiateCall}
              className="bg-green-600 px-6 py-3 rounded-full font-bold hover:bg-green-700"
            >
              Call
            </button>
          )}

          {callActive ? (
            <button
              onClick={leaveCall}
              className="bg-red-600 px-6 py-3 rounded-full font-bold hover:bg-red-700"
            >
              End Call
            </button>
          ) : (
            callId && (
              <button
                onClick={async () => {
                  try {
                    const token = await fetchRtcToken(callId, user.id);
                    setRtcToken(token);
                    setCallActive(true);
                  } catch (e) {
                    addToast("Failed to join", "error");
                  }
                }}
                className="bg-blue-600 px-6 py-3 rounded-full font-bold hover:bg-blue-700"
              >
                Join Call
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
