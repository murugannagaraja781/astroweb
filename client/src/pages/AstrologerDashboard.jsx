import React, { useEffect, useState, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";
import AuthContext from "../context/AuthContext";

const socket = io(import.meta.env.VITE_API_URL);

const AstrologerDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    if (!user) return;

    socket.emit("join_room", user.id);

    loadSessions();

    socket.on("chat:request", (data) => {
      loadSessions();
    });

    socket.on("chat:joined", ({ sessionId }) => {
      socket.emit("join_room", sessionId);
      navigate(`/chat/${sessionId}`);
    });
  }, [user]);

  const loadSessions = async () => {
    try {
      const res = await axios.get(
        `/api/chat/sessions/pending/${user.id}`
      );
      // Ensure we always store an array in state
      const data = Array.isArray(res.data)
        ? res.data
        : res.data && Array.isArray(res.data.sessions)
        ? res.data.sessions
        : [];
      setSessions(data);
    } catch (err) {
      console.error('Failed to load pending sessions:', err);
      setSessions([]);
    }
  };

  const handleAcceptChat = useCallback(async (sessionId) => {
    try {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/chat/accept`, { sessionId }, {
            headers: { 'x-auth-token': localStorage.getItem('token') }
        });
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
              onClick={() => navigate(`/chat/${session.sessionId}`)}
            >
              <div>
                <h4 className="font-semibold text-gray-800">
                  Session ID: {session.sessionId}
                </h4>
                <span className="text-sm text-gray-600">{session.status}</span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onAccept(session.sessionId); }}
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

  return (
    <div>
      <h2>Pending Chat Requests</h2>

      <InboxTab pendingSessions={sessions} onAccept={handleAcceptChat} />
    </div>
  );
};

export default AstrologerDashboard;
