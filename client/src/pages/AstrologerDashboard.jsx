import React, { useEffect, useState, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";
import AuthContext from "../context/AuthContext";

const API_URL =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_URL) ||
  process.env.VITE_API_URL ||
  "";
const socket = io(API_URL, {
  transports: ["websocket"],
  secure: true,
  reconnection: true,
  rejectUnauthorized: false,
});

const AstrologerDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState("inbox");
  const [activeSessions, setActiveSessions] = useState([]); // For future "Active Chats" tab

  const loadProfile = useCallback(async () => {
    if (!user) return;
    try {
      const res = await axios.get(
        `${API_URL}/api/astrologer/profile/${user.id}`,
        { headers: { "x-auth-token": localStorage.getItem("token") } }
      );
      setProfile(res.data);
    } catch (err) {
      console.error("Failed to load astrologer profile:", err);
      setProfile(null);
    }
  }, [user]);

  const loadSessions = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/chat/sessions/pending`, {
        headers: { "x-auth-token": localStorage.getItem("token") },
      });
      const list = (
        Array.isArray(res.data) ? res.data : res.data?.sessions || []
      ).filter(
        (s) => s.astrologer?.id === user?.id || s.astrologer === user?.id
      );
      setSessions(list);
    } catch (err) {
      console.error("Failed to load pending sessions:", err);
      setSessions([]);
    }
  };

  const loadActiveSessions = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/chat/sessions`, {
        headers: { "x-auth-token": localStorage.getItem("token") },
      });
      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.sessions || [];
      const list = data.filter(
        (s) =>
          s.status === "active" &&
          (s.astrologer?.id === user?.id || s.astrologer === user?.id)
      );
      setActiveSessions(list);
    } catch (err) {
      console.error("Failed to load active sessions:", err);
      setActiveSessions([]);
    }
  };

  const toggleOnlineStatus = useCallback(async () => {
    if (!profile) return;
    try {
      const newStatus = !profile.isOnline;
      await axios.put(
        `${API_URL}/api/astrologer/profile/${user.id}/status`,
        { isOnline: newStatus },
        { headers: { "x-auth-token": localStorage.getItem("token") } }
      );
      setProfile((prev) => ({ ...prev, isOnline: newStatus }));
      // Emit socket event to notify users about status change
      socket.emit("astrologer_status_change", {
        astrologerId: user.id,
        isOnline: newStatus,
      });
    } catch (err) {
      console.error("Failed to toggle online status:", err);
      alert("Failed to update status. Please try again.");
    }
  }, [profile, user]);

  useEffect(() => {
    if (!user) {
      navigate("/login"); // Redirect if not logged in
      return;
    }

    socket.emit("join_room", user.id);
    loadProfile();
    loadSessions();
    loadActiveSessions();

    socket.on("chat:request", (data) => {
      loadSessions(); // Reload pending sessions when a new request comes in
    });

    socket.on("chat:joined", ({ sessionId }) => {
      socket.emit("join_room", sessionId);
      navigate(`/chat/${sessionId}`);
    });

    socket.on("chat:ended", () => {
      loadActiveSessions(); // Reload active sessions when one ends
    });

    return () => {
      socket.off("chat:request");
      socket.off("chat:joined");
      socket.off("chat:ended");
    };
  }, [user, navigate, loadProfile]);

  const handleAcceptChat = useCallback(async (sessionId) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/chat/accept`,
        { sessionId },
        {
          headers: { "x-auth-token": localStorage.getItem("token") },
        }
      );
      // The socket event 'chat:joined' will be emitted by the server and handled by the listener above
    } catch (err) {
      console.error("Error accepting chat:", err);
      alert("Failed to accept chat. Please try again.");
    }
  }, []);

  const InboxTab = React.memo(({ pendingSessions, onAccept }) => (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        Inbox - Waiting Users
      </h3>
      {pendingSessions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No waiting users at the moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingSessions.map((session) => (
            <div
              key={session.sessionId}
              className="flex justify-between items-center p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              // Removed direct navigation on div click to avoid accidental navigation
            >
              <div>
                <h4 className="font-semibold text-gray-800">
                  Session ID: {session.sessionId}
                </h4>
                <span className="text-sm text-gray-600">{session.status}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAccept(session.sessionId);
                }}
                className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-sm flex items-center gap-2"
              >
                <span>Chat</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  ));

  const ActiveChatsTab = React.memo(({ activeSessions }) => (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Active Chats</h3>
      {activeSessions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No active chats at the moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeSessions.map((session) => (
            <div
              key={session.sessionId}
              className="flex justify-between items-center p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => navigate(`/chat/${session.sessionId}`)}
            >
              <div>
                <h4 className="font-semibold text-gray-800">
                  Session with User: {session.userId}
                </h4>
                <span className="text-sm text-gray-600">
                  Status: {session.status}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/chat/${session.sessionId}`);
                }}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
              >
                <span>View Chat</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  ));

  const ProfileTab = React.memo(({ profile, toggleOnlineStatus }) => (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">My Profile</h3>
      {profile ? (
        <div className="space-y-4">
          <p>
            <strong>Name:</strong> {profile.name}
          </p>
          <p>
            <strong>Email:</strong> {profile.email}
          </p>
          <div className="flex items-center justify-between">
            <p>
              <strong>Status:</strong> {profile.isOnline ? "Online" : "Offline"}
            </p>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                value=""
                className="sr-only peer"
                checked={profile.isOnline}
                onChange={toggleOnlineStatus}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                {profile.isOnline ? "Go Offline" : "Go Online"}
              </span>
            </label>
          </div>
          {/* Add more profile details as needed */}
        </div>
      ) : (
        <p>Loading profile...</p>
      )}
    </div>
  ));

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Astrologer Dashboard
      </h1>

      <div className="mb-6 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab("inbox")}
            className={`px-4 py-2 rounded-lg text-sm font-medium relative ${
              activeTab === "inbox"
                ? "bg-blue-600 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            Inbox
            {sessions.length > 0 && (
              <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                {sessions.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("activeChats")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              activeTab === "activeChats"
                ? "bg-blue-600 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            Active Chats
            {activeSessions.length > 0 && (
              <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                {activeSessions.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              activeTab === "profile"
                ? "bg-blue-600 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            Profile
          </button>
        </div>
        {profile && (
          <div className="flex items-center space-x-2">
            <span
              className={`text-sm font-medium ${
                profile.isOnline ? "text-green-600" : "text-red-600"
              }`}
            >
              {profile.isOnline ? "Online" : "Offline"}
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                value=""
                className="sr-only peer"
                checked={profile.isOnline}
                onChange={toggleOnlineStatus}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        )}
      </div>

      <div>
        {activeTab === "inbox" && (
          <InboxTab pendingSessions={sessions} onAccept={handleAcceptChat} />
        )}
        {activeTab === "activeChats" && (
          <ActiveChatsTab activeSessions={activeSessions} />
        )}
        {activeTab === "profile" && (
          <ProfileTab
            profile={profile}
            toggleOnlineStatus={toggleOnlineStatus}
          />
        )}
      </div>
    </div>
  );
};

export default AstrologerDashboard;
