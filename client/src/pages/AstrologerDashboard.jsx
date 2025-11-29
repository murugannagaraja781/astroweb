import { useState, useEffect } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import {
  Phone,
  MessageSquare,
  Clock,
  Calendar,
  DollarSign,
  Star,
  User,
  Settings,
  LogOut,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

const socket = io(import.meta.env.VITE_API_URL);

const AstrologerDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    languages: "",
    specialties: "",
    ratePerMinute: 10,
    bio: "",
    experience: "",
    education: "",
  });
  const [incomingCall, setIncomingCall] = useState(null);
  const [loading, setLoading] = useState(false);
  const [callHistory, setCallHistory] = useState([]);
  const [earnings, setEarnings] = useState({ today: 0, weekly: 0, monthly: 0 });
  const [reviews, setReviews] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalCalls: 0,
    avgRating: 0,
    totalEarnings: 0,
  });
  const [pendingSessions, setPendingSessions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
    fetchDashboardData();
    setupSocketListeners();

    return () => {
      socket.off("callUser");
      socket.off("callEnded");
    };
  }, []);



  useEffect(() => {
    if (profile?.userId) {
      socket.emit("join", profile.userId);
      socket.emit("user_online", { userId: profile.userId });
    }
  }, [profile?.userId]);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/chat/sessions/pending`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setPendingSessions(res.data);
        console.log('[DEBUG] Fetched pending sessions', res.data);
      } catch (err) {
        console.error('Error fetching pending sessions:', err);
      }
    };
    if (activeTab === "inbox" && profile?.userId) {
      fetchPending();
    }
  }, [activeTab, profile?.userId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/astrologer/profile`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setProfile(res.data);
      setFormData({
        languages: res.data.languages?.join(",") || "",
        specialties: res.data.specialties?.join(",") || "",
        ratePerMinute: res.data.ratePerMinute || 10,
        bio: res.data.bio || "",
        experience: res.data.experience || "",
        education: res.data.education || "",
      });
    } catch (err) {
      console.error("Error fetching profile:", err);
      alert("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");

      // Fetch call history
      const callsRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/astrologer/call-history`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setCallHistory(callsRes.data);

      // Fetch earnings
      const earningsRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/astrologer/earnings`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setEarnings(earningsRes.data);

      // Fetch reviews
      const reviewsRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/astrologer/reviews`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setReviews(reviewsRes.data);

      // Fetch analytics
      const analyticsRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/astrologer/analytics`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setAnalytics(analyticsRes.data);

      // Fetch schedule
      const scheduleRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/astrologer/schedule`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSchedule(scheduleRes.data);

      // Fetch pending sessions
      const pendingRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/chat/sessions/pending`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setPendingSessions(pendingRes.data);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      // Set mock data for demonstration
      setMockData();
    }
  };

  const setMockData = () => {
    setCallHistory([
      {
        callId: "call_001",
        userId: "user_123",
        userName: "Alice Johnson",
        type: "video",
        date: "2024-01-15T10:30:00Z",
        duration: 15,
        earnings: 750,
        status: "completed",
        rating: 5,
      },
      {
        callId: "call_002",
        userId: "user_456",
        userName: "Bob Smith",
        type: "chat",
        date: "2024-01-14T14:20:00Z",
        duration: 10,
        earnings: 300,
        status: "completed",
        rating: 4,
      },
    ]);

    setEarnings({
      today: 1250,
      weekly: 8500,
      monthly: 32500,
      totalEarnings: 187500,
      currency: "INR",
    });

    setReviews([
      {
        reviewId: "rev_001",
        userId: "user_123",
        userName: "Alice Johnson",
        rating: 5,
        comment: "Excellent guidance! Very accurate predictions.",
        date: "2024-01-15T11:00:00Z",
        callId: "call_001",
      },
      {
        reviewId: "rev_002",
        userId: "user_456",
        userName: "Bob Smith",
        rating: 4,
        comment: "Good consultation, helped me understand my career path.",
        date: "2024-01-14T15:00:00Z",
        callId: "call_002",
      },
    ]);

    setSchedule([
      {
        day: "monday",
        slots: ["09:00-12:00", "14:00-18:00"],
        isAvailable: true,
      },
      {
        day: "tuesday",
        slots: ["10:00-13:00", "15:00-19:00"],
        isAvailable: true,
      },
      { day: "wednesday", slots: [], isAvailable: false },
      { day: "thursday", slots: ["09:00-17:00"], isAvailable: true },
      { day: "friday", slots: ["11:00-15:00"], isAvailable: true },
      { day: "saturday", slots: ["09:00-12:00"], isAvailable: true },
      { day: "sunday", slots: [], isAvailable: false },
    ]);

    setAnalytics({
      totalCalls: 150,
      totalEarnings: 187500,
      avgRating: 4.8,
      avgCallDuration: 12.5,
      successRate: 95.2,
    });
  };

  const setupSocketListeners = () => {
    socket.on("callUser", (data) => {
      console.log("Incoming call data:", data);
      setIncomingCall(data);
    });

    socket.on("callEnded", () => {
      setIncomingCall(null);
    });

    socket.on("callRejected", () => {
      setIncomingCall(null);
      alert("Call was rejected by user");
    });
    socket.on("chat:request", (payload) => {
      setIncomingCall({
        from: payload.clientId,
        name: "",
        callId: payload.sessionId,
        type: "chat",
      });
      // Refresh pending sessions
      fetchDashboardData();
    });
    socket.on("chat:joined", ({ sessionId }) => {
      navigate(`/chat/${sessionId}`);
    });
    socket.on("chat:request", (payload) => {
      setIncomingCall({
        from: payload.clientId,
        name: "",
        callId: payload.sessionId,
        type: "chat",
      });
      setPendingSessions((prev) => {
        const exists = prev.some((s) => s.sessionId === payload.sessionId);
        const next = exists
          ? prev
          : [
              ...prev,
              {
                sessionId: payload.sessionId,
                status: "requested",
                ratePerMinute: 0,
                createdAt: new Date().toISOString(),
                client: { id: payload.clientId, name: "" },
                astrologer: { id: profile?.userId, name: profile?.name || "" },
              },
            ];
        return next;
      });
    });

    socket.on("chat:joined", ({ sessionId }) => {
      setPendingSessions((prev) =>
        prev.filter((s) => s.sessionId !== sessionId)
      );
      navigate(`/chat/${sessionId}`);
    });
  };

  const handleAcceptChat = (sessionId) => {
    socket.emit("chat:accept", { sessionId });
    navigate(`/chat/${sessionId}`);
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
      alert("Failed to update status");
    }
  };

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/astrologer/profile`,
        {
          ...formData,
          languages: formData.languages.split(",").map((lang) => lang.trim()),
          specialties: formData.specialties
            .split(",")
            .map((spec) => spec.trim()),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchProfile();
      alert("Profile updated successfully");
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Failed to update profile");
    }
  };

  const acceptCall = () => {
    if (!incomingCall) {
      console.error("No incoming call data");
      return;
    }

    if (!incomingCall.from) {
      console.error("Missing caller ID");
      alert("Error: Missing caller information");
      setIncomingCall(null);
      return;
    }

    if (incomingCall.type === "chat") {
      socket.emit("chat:accept", { sessionId: incomingCall.callId });
    } else {
      socket.emit("answerCall", {
        to: incomingCall.from,
        callId: incomingCall.callId,
        astrologerId: profile.userId,
        astrologerName: profile.name,
        type: incomingCall.type,
      });
    }

    setIncomingCall(null);

    if (incomingCall.type !== "chat") {
      // `VideoCall` route expects `/call/:id`, not `/video-call/` — fix path
      navigate(`/call/${incomingCall.from}`, {
        state: {
          callerName: incomingCall.name,
          callId: incomingCall.callId,
          callType: "video",
        },
      });
    }
  };

  const rejectCall = () => {
    if (incomingCall && incomingCall.from) {
      socket.emit("rejectCall", {
        to: incomingCall.from,
        astrologerId: profile.userId,
      });
    }
    setIncomingCall(null);
  };

  const updateAvailability = async (day, timeSlots) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/astrologer/schedule`,
        { day, timeSlots },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchDashboardData();
      alert("Schedule updated successfully");
    } catch (err) {
      console.error("Error updating schedule:", err);
      alert("Failed to update schedule");
    }
  };

  // Tab Components
  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
          <h3 className="text-gray-500 text-sm font-medium">
            Today's Earnings
          </h3>
          <p className="text-2xl font-bold text-gray-800">₹{earnings.today}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
          <h3 className="text-gray-500 text-sm font-medium">Total Calls</h3>
          <p className="text-2xl font-bold text-gray-800">
            {analytics.totalCalls}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-purple-500">
          <h3 className="text-gray-500 text-sm font-medium">Avg Rating</h3>
          <p className="text-2xl font-bold text-gray-800">
            {analytics.avgRating}/5
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-orange-500">
          <h3 className="text-gray-500 text-sm font-medium">Online Status</h3>
          <p
            className={`text-2xl font-bold ${
              profile?.isOnline ? "text-green-600" : "text-red-600"
            }`}
          >
            {profile?.isOnline ? "Online" : "Offline"}
          </p>
        </div>
      </div>

      {/* Recent Calls */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Recent Calls
        </h3>
        <div className="space-y-3">
          {callHistory.slice(0, 5).map((call, index) => (
            <div
              key={index}
              className="flex justify-between items-center p-3 border-b"
            >
              <div>
                <p className="font-medium">{call.userName}</p>
                <p className="text-sm text-gray-500 capitalize">
                  {call.type} • {new Date(call.date).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">₹{call.earnings}</p>
                <p className="text-sm text-gray-500">{call.duration} min</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const ProfileTab = () => (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Profile Settings
      </h2>
      <form
        onSubmit={onSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <div className="md:col-span-2">
          <label className="block text-gray-700 font-medium mb-2">Bio</label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={onChange}
            placeholder="Tell clients about your expertise..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent h-32"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Experience
          </label>
          <input
            type="text"
            name="experience"
            value={formData.experience}
            onChange={onChange}
            placeholder="5+ years in Vedic Astrology"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Education
          </label>
          <input
            type="text"
            name="education"
            value={formData.education}
            onChange={onChange}
            placeholder="Certified Astrologer"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Languages (comma separated)
          </label>
          <input
            type="text"
            name="languages"
            value={formData.languages}
            onChange={onChange}
            placeholder="English, Hindi, Tamil"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Specialties (comma separated)
          </label>
          <input
            type="text"
            name="specialties"
            value={formData.specialties}
            onChange={onChange}
            placeholder="Vedic, Numerology, Tarot"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Rate Per Minute (₹)
          </label>
          <input
            type="number"
            name="ratePerMinute"
            value={formData.ratePerMinute}
            onChange={onChange}
            min="1"
            max="1000"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors w-full"
          >
            Update Profile
          </button>
        </div>
      </form>
    </div>
  );

  const CallHistoryTab = () => (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Call History</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3">User</th>
              <th className="text-left p-3">Type</th>
              <th className="text-left p-3">Date</th>
              <th className="text-left p-3">Duration</th>
              <th className="text-left p-3">Earnings</th>
              <th className="text-left p-3">Rating</th>
            </tr>
          </thead>
          <tbody>
            {callHistory.map((call, index) => (
              <tr key={index} className="border-b hover:bg-gray-50">
                <td className="p-3">{call.userName}</td>
                <td className="p-3 capitalize">{call.type}</td>
                <td className="p-3">
                  {new Date(call.date).toLocaleDateString()}
                </td>
                <td className="p-3">{call.duration} min</td>
                <td className="p-3 font-medium">₹{call.earnings}</td>
                <td className="p-3">
                  <div className="flex items-center">
                    <span className="text-yellow-500">⭐</span>
                    <span className="ml-1">{call.rating}/5</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const EarningsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-gray-500 text-sm font-medium">Today</h3>
          <p className="text-2xl font-bold text-gray-800">₹{earnings.today}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-gray-500 text-sm font-medium">This Week</h3>
          <p className="text-2xl font-bold text-gray-800">₹{earnings.weekly}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-gray-500 text-sm font-medium">This Month</h3>
          <p className="text-2xl font-bold text-gray-800">
            ₹{earnings.monthly}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Recent Transactions
        </h3>
        <div className="space-y-3">
          {callHistory.slice(0, 10).map((call, index) => (
            <div
              key={index}
              className="flex justify-between items-center p-3 border-b"
            >
              <div>
                <p className="font-medium">{call.userName}</p>
                <p className="text-sm text-gray-500">
                  {new Date(call.date).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium text-green-600">+₹{call.earnings}</p>
                <p className="text-sm text-gray-500">
                  {call.duration} min • {call.type}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const ReviewsTab = () => (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        Customer Reviews
      </h3>
      <div className="space-y-4">
        {reviews.map((review, index) => (
          <div key={index} className="border-b pb-4">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium">{review.userName}</h4>
              <div className="flex items-center">
                <span className="text-yellow-500">⭐</span>
                <span className="ml-1">{review.rating}/5</span>
              </div>
            </div>
            <p className="text-gray-600">{review.comment}</p>
            <p className="text-sm text-gray-400 mt-2">
              {new Date(review.date).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  const ScheduleTab = () => {
    const [editingDay, setEditingDay] = useState(null);
    const [timeSlots, setTimeSlots] = useState("");

    const handleSaveSchedule = (day) => {
      const slots = timeSlots
        .split(",")
        .map((slot) => slot.trim())
        .filter((slot) => slot);
      updateAvailability(day, slots);
      setEditingDay(null);
      setTimeSlots("");
    };

    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Availability Schedule
        </h3>
        <div className="space-y-4">
          {schedule.map((daySchedule, index) => (
            <div
              key={index}
              className="flex justify-between items-center p-4 border rounded-lg"
            >
              <span className="font-medium capitalize">{daySchedule.day}</span>
              <span className="text-gray-600">
                {daySchedule.slots.length > 0
                  ? daySchedule.slots.join(", ")
                  : "Not Available"}
              </span>
              <button
                onClick={() => {
                  setEditingDay(daySchedule.day);
                  setTimeSlots(daySchedule.slots.join(", "));
                }}
                className="text-indigo-600 hover:text-indigo-800"
              >
                Edit
              </button>
            </div>
          ))}
        </div>

        {/* Edit Modal */}
        {editingDay && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-xl max-w-md w-full">
              <h3 className="text-xl font-semibold mb-4">
                Edit {editingDay} Schedule
              </h3>
              <input
                type="text"
                value={timeSlots}
                onChange={(e) => setTimeSlots(e.target.value)}
                placeholder="09:00-12:00, 14:00-18:00"
                className="w-full p-3 border border-gray-300 rounded-lg mb-4"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleSaveSchedule(editingDay)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex-1"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingDay(null)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const InboxTab = () => (
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
            >
              <div>
                <h4 className="font-semibold text-gray-800">
                  {session.client.name || "Unknown User"}
                </h4>
                <p className="text-sm text-gray-500">
                  Requested {new Date(session.createdAt).toLocaleTimeString()}
                </p>
                <span className="inline-block mt-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium capitalize">
                  {session.status}
                </span>
              </div>
              <button
                onClick={() => handleAcceptChat(session.sessionId)}
                className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-sm flex items-center gap-2"
              >
                <span>Chat</span>
                <span className="bg-white text-green-600 text-xs px-1.5 py-0.5 rounded-full">
                  Now
                </span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );

  if (!profile)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Failed to load profile
      </div>
    );

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
            <p className="text-lg text-gray-600 mb-2">{incomingCall.name}</p>
            <p className="text-gray-500 mb-6">
              is requesting to connect with you
            </p>

            <div className="flex gap-4 justify-center">
              <button
                onClick={rejectCall}
                className="bg-red-500 text-white px-6 py-3 rounded-full font-bold hover:bg-red-600 transition-colors flex items-center gap-2"
              >
                <span>✕</span> Reject
              </button>
              <button
                onClick={acceptCall}
                className="bg-green-500 text-white px-6 py-3 rounded-full font-bold hover:bg-green-600 transition-colors animate-pulse flex items-center gap-2"
              >
                <span>✓</span> Accept
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 max-w-7xl py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Astrologer Dashboard
            </h1>
            <p className="text-gray-600">
              Manage your profile and accept client calls
            </p>
          </div>

          {/* Status Toggle */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    profile.isOnline ? "bg-green-500" : "bg-red-500"
                  }`}
                ></div>
                <span className="text-gray-600">
                  Status:{" "}
                  <span
                    className={
                      profile.isOnline
                        ? "text-green-600 font-medium"
                        : "text-red-600 font-medium"
                    }
                  >
                    {profile.isOnline ? "Online" : "Offline"}
                  </span>
                </span>
              </div>
              <button
                onClick={toggleStatus}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  profile.isOnline
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-green-500 hover:bg-green-600 text-white"
                }`}
              >
                {profile.isOnline ? "Go Offline" : "Go Online"}
              </button>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        {/* Navigation Tabs */}
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {[
            "overview",
            "inbox",
            "calls",
            "earnings",
            "reviews",
            "schedule",
            "profile",
          ].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap capitalize ${
                activeTab === tab
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {tab}
              {tab === "inbox" && pendingSessions.length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {pendingSessions.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === "overview" && <OverviewTab />}
          {activeTab === "inbox" && <InboxTab />}
          {activeTab === "calls" && <CallHistoryTab />}
          {activeTab === "earnings" && <EarningsTab />}
          {activeTab === "reviews" && <ReviewsTab />}
          {activeTab === "schedule" && <ScheduleTab />}
          {activeTab === "profile" && <ProfileTab />}
        </div>
      </div>
    </div>
  );
};

export default AstrologerDashboard;