import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useContext,
} from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import AgoraRTC from "agora-rtc-sdk-ng";
import axios from "axios";
import AuthContext from "../context/AuthContext";
import CallHistoryList from "../components/CallHistoryList";
import OnlineAstrologers from "../components/OnlineAstrologers";
import OffersList from "../components/OffersList";
import { ArrowLeft } from "lucide-react";
import { useToast } from "../context/ToastContext";

const SOCKET_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) || process.env.VITE_API_URL || '';
const APP_ID = (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_AGORA_APP_ID || import.meta.env.VITE_APP_ID)) || process.env.VITE_AGORA_APP_ID || process.env.VITE_APP_ID || '';

const AGORA_DEBUG = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_AGORA_DEBUG) || process.env.VITE_AGORA_DEBUG;
if (AGORA_DEBUG) {
  try { AgoraRTC.setLogLevel(4); } catch (e) {}
}

// Small helper to format duration mm:ss
const formatDuration = (sec) =>
  `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, "0")}`;

export default function VideoCall() {
  const { id: otherUserId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { addToast } = useToast();

  // Socket state
  const [socket, setSocket] = useState(null);

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

  const location = useLocation();

  // --- Socket setup ---
  useEffect(() => {
    const token = localStorage.getItem('token');
    const newSocket = io(SOCKET_URL, {
      auth: { token }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!user || !socket) return;

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

    // Billing updates
    socket.on("billingUpdate", ({ duration: dur, cost, balance: bal, earnings }) => {
       if (dur) setDuration(dur);
       if (bal !== undefined) setBalance(bal);
       // For astrologer, we could show earnings if we wanted, but balance is for client
    });

    return () => {
      socket.off("connect");
      socket.off("callAccepted");
      socket.off("callRejected");
      socket.off("endCall");
      socket.off("billingUpdate");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, callId, fetchRtcToken, socket]);

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

        // start timer - handled by billing update now, but keep as fallback/local
        if (!timerRef.current) {
             timerRef.current = setInterval(() => {
               setDuration((d) => d + 1);
             }, 1000);
        }
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
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callActive, callId, rtcToken, APP_ID, user, client]);

  // --- Initiate a call (client -> astrologer) ---
  const initiateCall = useCallback(async () => {
    if (!user || !otherUserId || !socket) return;
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
  }, [otherUserId, user, fetchRtcToken, addToast, socket]);

  // --- For astrologer: accept incoming call (incomingCallId from query or state) ---
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const incomingCallId = query.get("callId") || location.state?.callId;

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
  }, [user, fetchRtcToken, addToast, location.state]);

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
      if (callId && socket) {
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
  }, [client, callId, otherUserId, navigate, user?.role, socket]);

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
    <div className="relative h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black overflow-hidden">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-2 h-2 bg-yellow-400 rounded-full opacity-60 animate-pulse"></div>
        <div className="absolute top-20 right-20 w-1 h-1 bg-purple-400 rounded-full opacity-40"></div>
        <div className="absolute bottom-32 left-1/4 w-1 h-1 bg-yellow-500 rounded-full opacity-50 animate-pulse delay-700"></div>
        <div className="absolute top-1/2 right-16 w-1 h-1 bg-yellow-400 rounded-full opacity-30"></div>
        <div className="absolute bottom-20 right-1/3 w-2 h-2 bg-purple-600 rounded-full opacity-40 animate-pulse delay-300"></div>
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-20">
        <div className="flex items-center justify-between">
          {/* Back Button */}
          <button
            onClick={() => navigate(`/call/0`)}
            className="p-2 bg-yellow-600/20 hover:bg-yellow-600/40 rounded-full transition-colors"
          >
            <ArrowLeft className="text-yellow-200" size={20} />
          </button>

          {/* Call Info */}
          <div className="text-center">
            <p className="text-yellow-200 font-semibold text-lg">
              {user?.role === 'client' ? 'Astrologer' : 'Client'}
            </p>
            <p className="text-yellow-300 text-sm">
              {formatDuration(duration)}
            </p>
          </div>

          {/* Rate Badge */}
          <div className="bg-purple-600/80 backdrop-blur-sm px-3 py-1 rounded-full border border-purple-400/30">
            <span className="text-white text-sm font-medium">
              ₹{RATE_PER_MIN}/min
            </span>
          </div>
        </div>
      </div>

      {/* Remote Video (Full Screen) */}
      <div
        ref={remoteContainerRef}
        className="absolute inset-0 bg-black"
      >
        {remoteUsers.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center shadow-lg shadow-purple-500/50">
                <svg className="w-16 h-16 text-yellow-200" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-yellow-200 text-lg font-medium">Connecting...</p>
              <p className="text-purple-300 text-sm mt-2">Waiting for response</p>
            </div>
          </div>
        )}
      </div>

      {/* Local Video (Picture-in-Picture) */}
      <div className="absolute top-20 right-4 w-32 h-40 md:w-40 md:h-52 rounded-xl overflow-hidden border-2 border-yellow-500 shadow-lg shadow-yellow-500/50 z-10">
        <div ref={localVideoEl} className="w-full h-full bg-gray-800" />
        <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded text-xs text-yellow-200 font-medium">
          You
        </div>
      </div>

      {/* Control Buttons */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4 z-20">
        {!callId && user?.role === "client" && (
          <button
            onClick={initiateCall}
            className="px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-full font-bold text-white shadow-lg shadow-green-500/50 transition-all transform hover:scale-105"
          >
            Start Call
          </button>
        )}

        {callActive ? (
          <>
            {/* Mute Button */}
            <button
              className="p-4 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 rounded-full transition-all shadow-lg"
              title="Mute"
            >
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7 4a3 3 0 106 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
              </svg>
            </button>

            {/* Video Toggle */}
            <button
              className="p-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 rounded-full transition-all shadow-lg"
              title="Toggle Video"
            >
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
              </svg>
            </button>

            {/* End Call */}
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to end this call?')) {
                  leaveCall();
                }
              }}
              className="p-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-full transition-all shadow-lg shadow-red-500/50 transform hover:scale-105"
              title="End Call"
            >
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
            </button>
          </>
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
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-full font-bold text-white shadow-lg shadow-blue-500/50 transition-all transform hover:scale-105"
            >
              Join Call
            </button>
          )
        )}
      </div>

      {/* Balance Warning */}
      {user?.role === 'client' && balance < RATE_PER_MIN && RATE_PER_MIN > 0 && (
        <div className="absolute top-20 left-4 bg-red-600/90 backdrop-blur-sm px-4 py-3 rounded-lg border border-red-400/30 z-20">
          <p className="text-white text-sm font-semibold">⚠️ Low Balance</p>
          <p className="text-white text-xs mt-1">Add money to continue</p>
        </div>
      )}
    </div>
  );
}

