import { useState, useEffect } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  User,
  Phone,
  DollarSign,
  MessageSquare,
  Calendar,
  LogOut,
  Star,
  Activity,
  Check,
  X
} from "lucide-react";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:9001";

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
  const [socket, setSocket] = useState(null);
  const navigate = useNavigate();

  // --- Socket Initialization ---
  useEffect(() => {
    const token = localStorage.getItem("token");
    const newSocket = io(SOCKET_URL, {
      auth: { token }
    });
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    fetchProfile();
    fetchDashboardData();
    setupSocketListeners();

    return () => {
      socket.off("callUser");
      socket.off("callEnded");
      socket.off("callRejected");
    };
  }, [socket]);

  useEffect(() => {
    if (profile?.userId && socket) {
      socket.emit("join", profile.userId);
    }
  }, [profile?.userId, socket]);

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
      // alert("Failed to load profile");
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
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCallHistory(callsRes.data);

      // Fetch earnings
      const earningsRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/astrologer/earnings`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEarnings(earningsRes.data);

      // Fetch reviews
      const reviewsRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/astrologer/reviews`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReviews(reviewsRes.data);

      // Fetch analytics
      const analyticsRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/astrologer/analytics`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAnalytics(analyticsRes.data);

      // Fetch schedule
      const scheduleRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/astrologer/schedule`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSchedule(scheduleRes.data);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
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
      { day: "monday", slots: ["09:00-12:00", "14:00-18:00"], isAvailable: true },
      { day: "tuesday", slots: ["10:00-13:00", "15:00-19:00"], isAvailable: true },
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
    if (!socket) return;

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
          specialties: formData.specialties.split(",").map((spec) => spec.trim()),
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
    if (!incomingCall || !socket) return;

    if (!incomingCall.from) {
      console.error("Missing caller ID");
      alert("Error: Missing caller information");
      setIncomingCall(null);
      return;
    }

    socket.emit("answerCall", {
      to: incomingCall.from,
      callId: incomingCall.callId,
      astrologerId: profile.userId,
      astrologerName: profile.name,
      type: incomingCall.type,
    });

    setIncomingCall(null);

    if (incomingCall.type === "chat") {
      navigate(`/chat/${incomingCall.from}`, {
        state: {
          callerName: incomingCall.name,
          callType: "chat",
        },
      });
    } else {
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
    if (incomingCall && incomingCall.from && socket) {
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

  // --- Components ---

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-800 p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
          <h3 className="text-gray-400 text-sm font-medium">Today's Earnings</h3>
          <p className="text-2xl font-bold text-white">₹{earnings.today}</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-xl shadow-sm border-l-4 border-green-500">
          <h3 className="text-gray-400 text-sm font-medium">Total Calls</h3>
          <p className="text-2xl font-bold text-white">{analytics.totalCalls}</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-xl shadow-sm border-l-4 border-purple-500">
          <h3 className="text-gray-400 text-sm font-medium">Avg Rating</h3>
          <p className="text-2xl font-bold text-white">{analytics.avgRating}/5</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-xl shadow-sm border-l-4 border-orange-500">
          <h3 className="text-gray-400 text-sm font-medium">Online Status</h3>
          <p className={`text-2xl font-bold ${profile?.isOnline ? "text-green-400" : "text-red-400"}`}>
            {profile?.isOnline ? "Online" : "Offline"}
          </p>
        </div>
      </div>

      {/* Recent Calls */}
      <div className="bg-slate-800 rounded-xl shadow-sm p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Recent Calls</h3>
        <div className="space-y-3">
          {callHistory.slice(0, 5).map((call, index) => (
            <div key={index} className="flex justify-between items-center p-3 border-b border-slate-700">
              <div>
                <p className="font-medium text-white">{call.userName}</p>
                <p className="text-sm text-gray-400 capitalize">
                  {call.type} • {new Date(call.date).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium text-purple-300">₹{call.earnings}</p>
                <p className="text-sm text-gray-400">{call.duration} min</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const ProfileTab = () => (
    <div className="bg-slate-800 rounded-xl shadow-sm p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Profile Settings</h2>
      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-gray-300 font-medium mb-2">Bio</label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={onChange}
            placeholder="Tell clients about your expertise..."
            className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 text-white h-32"
          />
        </div>
        <div>
          <label className="block text-gray-300 font-medium mb-2">Experience</label>
          <input
            type="text"
            name="experience"
            value={formData.experience}
            onChange={onChange}
            placeholder="5+ years in Vedic Astrology"
            className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 text-white"
          />
        </div>
        <div>
          <label className="block text-gray-300 font-medium mb-2">Education</label>
          <input
            type="text"
            name="education"
            value={formData.education}
            onChange={onChange}
            placeholder="Certified Astrologer"
            className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 text-white"
          />
        </div>
        <div>
          <label className="block text-gray-300 font-medium mb-2">Languages</label>
          <input
            type="text"
            name="languages"
            value={formData.languages}
            onChange={onChange}
            placeholder="English, Hindi, Tamil"
            className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 text-white"
          />
        </div>
        <div>
          <label className="block text-gray-300 font-medium mb-2">Specialties</label>
          <input
            type="text"
            name="specialties"
            value={formData.specialties}
            onChange={onChange}
            placeholder="Vedic, Numerology, Tarot"
            className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 text-white"
          />
        </div>
        <div>
          <label className="block text-gray-300 font-medium mb-2">Rate Per Minute (₹)</label>
          <input
            type="number"
            name="ratePerMinute"
            value={formData.ratePerMinute}
            onChange={onChange}
            min="1"
            max="1000"
            className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 text-white"
          />
        </div>
        <div className="md:col-span-2">
          <button
            type="submit"
            className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors w-full"
          >
            Update Profile
          </button>
        </div>
      </form>
    </div>
  );

  const CallHistoryTab = () => (
    <div className="bg-slate-800 rounded-xl shadow-sm p-6">
      <h3 className="text-xl font-semibold text-white mb-4">Call History</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-gray-300">
          <thead>
            <tr className="border-b border-slate-700">
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
              <tr key={index} className="border-b border-slate-700 hover:bg-slate-700">
                <td className="p-3">{call.userName}</td>
                <td className="p-3 capitalize">{call.type}</td>
                <td className="p-3">{new Date(call.date).toLocaleDateString()}</td>
                <td className="p-3">{call.duration} min</td>
                <td className="p-3 font-medium text-green-400">₹{call.earnings}</td>
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
        <div className="bg-slate-800 p-6 rounded-xl shadow-sm">
          <h3 className="text-gray-400 text-sm font-medium">Today</h3>
          <p className="text-2xl font-bold text-white">₹{earnings.today}</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-xl shadow-sm">
          <h3 className="text-gray-400 text-sm font-medium">This Week</h3>
          <p className="text-2xl font-bold text-white">₹{earnings.weekly}</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-xl shadow-sm">
          <h3 className="text-gray-400 text-sm font-medium">This Month</h3>
          <p className="text-2xl font-bold text-white">₹{earnings.monthly}</p>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl shadow-sm p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Recent Transactions</h3>
        <div className="space-y-3">
          {callHistory.slice(0, 10).map((call, index) => (
            <div key={index} className="flex justify-between items-center p-3 border-b border-slate-700">
              <div>
                <p className="font-medium text-white">{call.userName}</p>
                <p className="text-sm text-gray-400">{new Date(call.date).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-green-400">+₹{call.earnings}</p>
                <p className="text-sm text-gray-400">{call.duration} min • {call.type}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const ReviewsTab = () => (
    <div className="bg-slate-800 rounded-xl shadow-sm p-6">
      <h3 className="text-xl font-semibold text-white mb-4">Customer Reviews</h3>
      <div className="space-y-4">
        {reviews.map((review, index) => (
          <div key={index} className="border-b border-slate-700 pb-4">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium text-white">{review.userName}</h4>
              <div className="flex items-center">
                <span className="text-yellow-500">⭐</span>
                <span className="ml-1 text-gray-300">{review.rating}/5</span>
              </div>
            </div>
            <p className="text-gray-400">{review.comment}</p>
            <p className="text-sm text-gray-500 mt-2">{new Date(review.date).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const ScheduleTab = () => {
    const [editingDay, setEditingDay] = useState(null);
    const [timeSlots, setTimeSlots] = useState("");

    const handleSaveSchedule = (day) => {
      const slots = timeSlots.split(",").map((slot) => slot.trim()).filter((slot) => slot);
      updateAvailability(day, slots);
      setEditingDay(null);
      setTimeSlots("");
    };

    return (
      <div className="bg-slate-800 rounded-xl shadow-sm p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Availability Schedule</h3>
        <div className="space-y-4">
          {schedule.map((daySchedule, index) => (
            <div key={index} className="flex justify-between items-center p-4 border border-slate-700 rounded-lg">
              <span className="font-medium capitalize text-white">{daySchedule.day}</span>
              <span className="text-gray-400">
                {daySchedule.slots.length > 0 ? daySchedule.slots.join(", ") : "Not Available"}
              </span>
              <button
                onClick={() => {
                  setEditingDay(daySchedule.day);
                  setTimeSlots(daySchedule.slots.join(", "));
                }}
                className="text-purple-400 hover:text-purple-300"
              >
                Edit
              </button>
            </div>
          ))}
        </div>

        {editingDay && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 p-6 rounded-xl max-w-md w-full border border-slate-700">
              <h3 className="text-xl font-semibold mb-4 text-white">Edit {editingDay} Schedule</h3>
              <input
                type="text"
                value={timeSlots}
                onChange={(e) => setTimeSlots(e.target.value)}
                placeholder="09:00-12:00, 14:00-18:00"
                className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg mb-4 text-white"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleSaveSchedule(editingDay)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg flex-1 hover:bg-purple-700"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingDay(null)}
                  className="bg-slate-600 text-white px-4 py-2 rounded-lg flex-1 hover:bg-slate-500"
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

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );

  if (!profile)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        Failed to load profile
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-900 text-gray-100">
      {/* Incoming Call Modal */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-md">
          <div className="bg-gradient-to-br from-slate-900 to-purple-950 p-8 rounded-3xl shadow-2xl text-center max-w-md w-full border border-purple-500/50 animate-in fade-in zoom-in duration-300 relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent animate-pulse"></div>
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl"></div>

            <div className="relative z-10">
              <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center animate-bounce shadow-[0_0_30px_rgba(168,85,247,0.4)] ${
                incomingCall.type === "chat" ? "bg-purple-600" : "bg-blue-600"
              }`}>
                {incomingCall.type === "chat" ? (
                  <MessageSquare className="w-10 h-10 text-white" />
                ) : (
                  <Phone className="w-10 h-10 text-white" />
                )}
              </div>

              <h2 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-purple-200">
                Incoming {incomingCall.type === "chat" ? "Chat Request" : "Video Call"}
              </h2>

              <div className="bg-white/5 rounded-xl p-4 mb-8 border border-white/10 backdrop-blur-sm">
                <p className="text-gray-400 text-sm uppercase tracking-wider mb-1">Client</p>
                <p className="text-2xl text-white font-bold">{incomingCall.name}</p>
                <p className="text-purple-300 text-sm mt-1">is waiting for you...</p>
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={rejectCall}
                  className="bg-slate-800 text-red-400 border border-red-500/30 px-8 py-4 rounded-full font-bold hover:bg-red-500/10 hover:border-red-500 hover:text-red-300 transition-all flex items-center gap-2 group"
                >
                  <X size={20} className="group-hover:scale-110 transition-transform" /> Reject
                </button>
                <button
                  onClick={acceptCall}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-10 py-4 rounded-full font-bold hover:shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:scale-105 transition-all flex items-center gap-2 animate-pulse"
                >
                  <Check size={20} /> Accept Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 max-w-7xl py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
              <LayoutDashboard className="text-purple-500" /> Astrologer Dashboard
            </h1>
            <p className="text-gray-400">Manage your profile and accept client calls</p>
          </div>

          {/* Status Toggle */}
          <div className="bg-slate-800 rounded-xl shadow-sm p-4 border border-slate-700">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${profile.isOnline ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" : "bg-red-500"}`}></div>
                <span className="text-gray-300">
                  Status:{" "}
                  <span className={profile.isOnline ? "text-green-400 font-medium" : "text-red-400 font-medium"}>
                    {profile.isOnline ? "Online" : "Offline"}
                  </span>
                </span>
              </div>
              <button
                onClick={toggleStatus}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  profile.isOnline
                    ? "bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/50"
                    : "bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white border border-green-500/50"
                }`}
              >
                {profile.isOnline ? "Go Offline" : "Go Online"}
              </button>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-slate-800 rounded-xl shadow-sm mb-6 overflow-x-auto border border-slate-700">
          <div className="flex border-b border-slate-700">
            {[
              { id: "overview", label: "Overview", icon: LayoutDashboard },
              { id: "profile", label: "Profile", icon: User },
              { id: "call-history", label: "Call History", icon: Phone },
              { id: "earnings", label: "Earnings", icon: DollarSign },
              { id: "reviews", label: "Reviews", icon: MessageSquare },
              { id: "schedule", label: "Schedule", icon: Calendar },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "text-purple-400 border-b-2 border-purple-500 bg-purple-500/10"
                    : "text-gray-400 hover:text-gray-200 hover:bg-slate-700"
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === "overview" && <OverviewTab />}
          {activeTab === "profile" && <ProfileTab />}
          {activeTab === "call-history" && <CallHistoryTab />}
          {activeTab === "earnings" && <EarningsTab />}
          {activeTab === "reviews" && <ReviewsTab />}
          {activeTab === "schedule" && <ScheduleTab />}
        </div>
      </div>
    </div>
  );
};

export default AstrologerDashboard;
