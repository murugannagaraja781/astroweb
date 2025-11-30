import { useState, useEffect } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";

const AstrologerDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [profile, setProfile] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [pendingSessions, setPendingSessions] = useState([]);
  const [socket, setSocket] = useState(null);
  const navigate = useNavigate();

  // Initialize socket connection
  useEffect(() => {
    if (!profile?.name) return;

    const newSocket = io(import.meta.env.VITE_API_URL, {
      query: { username: profile.name }
    });
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [profile?.name]);

  useEffect(() => {
    fetchProfile();
  }, []);

  // Setup socket listeners when socket is ready
  useEffect(() => {
    if (!socket) return;

    socket.on("callUser", (data) => {
      setIncomingCall(data);
    });

    socket.on("chat:request", (payload) => {
      console.log("Chat request received:", payload);
      setIncomingCall({
        from: payload.clientId,
        name: "Client",
        callId: payload.sessionId,
        type: "chat",
      });
      fetchPendingSessions();
    });

    socket.on("chat:joined", ({ sessionId }) => {
      navigate(`/chat/${sessionId}`);
    });

    return () => {
      socket.off("callUser");
      socket.off("chat:request");
      socket.off("chat:joined");
    };
  }, [socket, navigate]);

  useEffect(() => {
    if (profile?.userId && socket) {
      socket.emit("join", profile.userId);
      fetchPendingSessions();
    }
  }, [profile?.userId, activeTab, socket]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/astrologer/profile`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setProfile(res.data);
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  useEffect(() => {
    if (activeTab === 'inbox') {
      fetchPendingSessions();
    }
  }, [activeTab]);

  const fetchPendingSessions = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/chat/sessions/pending`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setPendingSessions(res.data);
    } catch (err) {
      console.error("Error fetching sessions:", err);
    }
  };



  const acceptCall = () => {
    if (!incomingCall || !socket) return;

    if (incomingCall.type === "chat") {
      socket.emit("chat:accept", { sessionId: incomingCall.callId });
      navigate(`/chat/${incomingCall.callId}`);
    } else {
      socket.emit("answerCall", {
        to: incomingCall.from,
        callId: incomingCall.callId,
      });
      navigate(`/call/${incomingCall.from}?callId=${incomingCall.callId}`);
    }
    setIncomingCall(null);
  };

  const rejectCall = () => {
    if (incomingCall && socket) {
      socket.emit("rejectCall", { to: incomingCall.from });
    }
    setIncomingCall(null);
  };

  const toggleStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/astrologer/status`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProfile(res.data);
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const acceptChat = (sessionId) => {
    if (socket) {
      socket.emit("chat:accept", { sessionId });
    }
    navigate(`/chat/${sessionId}`);
  };

  const rejectChat = async (sessionId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/chat/reject`,
        { sessionId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Remove from list
      setPendingSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
    } catch (err) {
      console.error("Error rejecting chat:", err);
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Incoming Call Modal */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-md w-full">
            <div className="w-20 h-20 mx-auto mb-4 bg-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">📞</span>
            </div>
            <h2 className="text-2xl font-bold mb-2 text-gray-800">
              Incoming {incomingCall.type === "chat" ? "Chat" : "Video Call"}
            </h2>
            <p className="text-gray-600 mb-6">from {incomingCall.name}</p>

            <div className="flex gap-4 justify-center">
              <button
                onClick={rejectCall}
                className="bg-red-500 text-white px-6 py-3 rounded-full font-bold hover:bg-red-600"
              >
                Reject
              </button>
              <button
                onClick={acceptCall}
                className="bg-green-500 text-white px-6 py-3 rounded-full font-bold hover:bg-green-600 animate-pulse"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 max-w-7xl py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Astrologer Dashboard
            </h1>
            <p className="text-gray-600">
              Manage your profile and accept client calls
            </p>
          </div>

          <div className="bg-white rounded-xl p-4">
            <div className="flex items-center gap-4">
              <div
                className={`w-3 h-3 rounded-full ${
                  profile.isOnline ? "bg-green-500" : "bg-red-500"
                }`}
              ></div>
              <span className="text-gray-600">
                Status:{" "}
                <span
                  className={
                    profile.isOnline ? "text-green-600" : "text-red-600"
                  }
                >
                  {profile.isOnline ? "Online" : "Offline"}
                </span>
              </span>
              <button
                onClick={toggleStatus}
                className={`px-4 py-2 rounded-lg font-semibold text-white ${
                  profile.isOnline
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-green-500 hover:bg-green-600"
                }`}
              >
                {profile.isOnline ? "Go Offline" : "Go Online"}
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 overflow-x-auto">
          {["overview", "inbox", "calls", "earnings", "profile"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-xl font-semibold capitalize whitespace-nowrap ${
                activeTab === tab
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {tab}
              {tab === "inbox" && pendingSessions.length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {pendingSessions.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === "inbox" && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Pending Chat Requests
              </h3>
              {pendingSessions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No pending requests
                </p>
              ) : (
                <div className="space-y-4">
                  {pendingSessions.map((session) => (
                    <div
                      key={session.sessionId}
                      className="flex justify-between items-center p-4 border rounded-lg"
                    >
                      <div>
                        <p className="font-semibold">{session.userId?.name || session.client?.name || "Client"}</p>
                        <p className="text-sm text-gray-600">
                          Session: {session.sessionId}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => rejectChat(session.sessionId)}
                          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => acceptChat(session.sessionId)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Accept Chat
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "overview" && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Welcome, {profile.name}
              </h3>
              <p className="text-gray-600">
                You are currently {profile.isOnline ? "online" : "offline"} and
                ready to accept calls.
              </p>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Your Profile
              </h3>
              <p>
                <strong>Name:</strong> {profile.name}
              </p>
              <p>
                <strong>Rate:</strong> ₹{profile.ratePerMinute || 0}/min
              </p>
              <p>
                <strong>Experience:</strong> {profile.experience || "Not set"}{" "}
                years
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AstrologerDashboard;
