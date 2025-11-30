import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import AuthContext from "../context/AuthContext";
import {
  Video,
  MessageCircle,
  Star,
  Award,
  Globe,
  Languages,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { io } from "socket.io-client";

const AstrologerDetail = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [astrologer, setAstrologer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [waiting, setWaiting] = useState(false);
  const [waitingType, setWaitingType] = useState(""); // "call" or "chat"
  const [socket, setSocket] = useState(null);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_API_URL);
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    fetchAstrologer();
    if (user) {
      fetchBalance();
    }
  }, [id, user]);

  const fetchBalance = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/wallet/balance`
      );
      setBalance(res.data.balance);
    } catch (err) {
      console.error("Error fetching balance:", err);
    }
  };

  const fetchAstrologer = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/public/astrologers`
      );
      const astro = res.data.find((a) => a._id === id);
      setAstrologer(astro);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching astrologer:", err);
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const handleAction = async (action) => {
    // Check if user is logged in
    if (!user) {
      alert("Please login to continue");
      navigate("/login");
      return;
    }

    // Check if user has sufficient balance (minimum ₹1)
    // Skip balance check for admin and astrologer users
    if (user.role === "client" && balance < 1) {
      alert(
        "Insufficient balance! Please add money to your wallet. Minimum ₹1 required."
      );
      navigate("/dashboard");
      return;
    }

    // Check if astrologer is online
    if (!astrologer.isOnline) {
      alert("This astrologer is currently offline. Please try again later.");
      return;
    }

    if (action === "call") {
      if (!socket) {
        alert("Connection not ready. Please try again.");
        return;
      }

      setWaiting(true);
      setWaitingType("call");

      try {
        // Initiate call via API to get callId
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/call/initiate`,
          {
            receiverId: id,
          }
        );
        const callId = res.data.callId;

        // Join user's own room for receiving responses
        socket.emit("join", user.id);

        // Emit video call request to astrologer
        socket.emit("callUser", {
          userToCall: id,
          from: user.id,
          name: user.name,
          type: "video",
          callId: callId,
        });

        // Wait for call acceptance
        socket.once("callAccepted", ({ callId: acceptedCallId }) => {
          console.log("[DEBUG] Video call accepted:", acceptedCallId);
          setWaiting(false);

          // Store call details in backend
          axios
            .post(`${import.meta.env.VITE_API_URL}/api/chatcalldetails`, {
              userId: user.id,
              astrologerId: id,
              sessionId: acceptedCallId,
              initiatedAt: new Date().toISOString(),
            })
            .catch((err) => console.error("Error storing call details:", err));

          // Navigate to video call page with callId
          navigate(`/call/${id}?callId=${acceptedCallId}`);
        });

        // Handle call rejection
        socket.once("callRejected", () => {
          setWaiting(false);
          alert("The astrologer is currently busy. Please try again later.");
        });
      } catch (err) {
        console.error("Error initiating call:", err);
        setWaiting(false);
        alert("Failed to initiate call. Please try again.");
      }
    } else if (action === "chat") {
      if (!socket) {
        alert("Connection not ready. Please try again.");
        return;
      }

      setWaiting(true);
      setWaitingType("chat");
      socket.emit("user_online", { userId: user.id });
      socket.emit("chat:request", {
        clientId: user.id,
        astrologerId: id,
        ratePerMinute: astrologer.profile?.ratePerMinute || 1,
      });
      socket.once("chat:joined", ({ sessionId }) => {
        console.log("[DEBUG] Client received chat:joined:", sessionId);
        setWaiting(false);
        // Store chat session details in backend
        axios
          .post(`${import.meta.env.VITE_API_URL}/api/chatcalldetails`, {
            userId: user.id,
            astrologerId: id,
            sessionId,
            initiatedAt: new Date().toISOString(),
          })
          .catch((err) => console.error("Error storing chat call:", err));
        navigate(`/chat/${sessionId}`);
      });
      socket.once("chat:error", () => {
        setWaiting(false);
        alert("Failed to request chat");
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-200 border-t-orange-600"></div>
      </div>
    );
  }

  if (!astrologer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Astrologer not found</p>
          <button
            onClick={() => navigate("/")}
            className="mt-4 text-orange-600 hover:text-orange-700 font-semibold"
          >
            Go back home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-purple-600 text-white py-8 px-4">
        <div className="container mx-auto">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-white hover:text-orange-100 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-16">
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
          {/* Profile Header */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-8">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-2xl">
                <span className="text-white text-5xl font-bold">
                  {getInitials(astrologer.name)}
                </span>
              </div>
              {astrologer.isOnline && (
                <span className="absolute bottom-2 right-2 w-8 h-8 bg-green-500 border-4 border-white rounded-full animate-pulse"></span>
              )}
            </div>

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                {astrologer.name}
              </h1>
              <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                {astrologer.isOnline ? (
                  <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Available Now
                  </span>
                ) : (
                  <span className="px-4 py-2 bg-gray-100 text-gray-600 rounded-full text-sm font-semibold">
                    Offline
                  </span>
                )}
              </div>
              {waiting && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                  <div className="bg-white rounded-xl shadow-xl p-6 w-80 text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange-200 border-t-orange-600 mx-auto mb-4"></div>
                    <p className="text-gray-700 font-medium">
                      {waitingType === "call"
                        ? "Calling astrologer..."
                        : "Waiting for astrologer to accept…"}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-center md:justify-start gap-2 text-2xl font-bold text-orange-600 mb-6">
                <Star className="w-6 h-6 fill-orange-600" />₹
                {astrologer.profile?.ratePerMinute || 0}/min
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <button
                  onClick={() => handleAction("call")}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Video size={20} />
                  Video Call
                </button>
                <button
                  onClick={() => handleAction("chat")}
                  className="flex items-center gap-2 bg-white text-orange-600 border-2 border-orange-500 px-6 py-3 rounded-xl font-semibold hover:bg-orange-50 transition-all transform hover:scale-105"
                >
                  <MessageCircle size={20} />
                  Chat
                </button>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Experience */}
            {astrologer.profile?.experience && (
              <div className="bg-orange-50 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Award className="w-6 h-6 text-orange-600" />
                  <h3 className="text-lg font-bold text-gray-800">
                    Experience
                  </h3>
                </div>
                <p className="text-gray-700 text-lg">
                  {astrologer.profile.experience} years
                </p>
              </div>
            )}

            {/* Languages */}
            {astrologer.profile?.languages &&
              astrologer.profile.languages.length > 0 && (
                <div className="bg-purple-50 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Languages className="w-6 h-6 text-purple-600" />
                    <h3 className="text-lg font-bold text-gray-800">
                      Languages
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {astrologer.profile.languages.map((lang, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-purple-200 text-purple-800 rounded-full text-sm font-medium"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              )}
          </div>

          {/* Specialties */}
          {astrologer.profile?.specialties &&
            astrologer.profile.specialties.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="w-6 h-6 text-orange-600" />
                  <h3 className="text-2xl font-bold text-gray-800">
                    Specialties
                  </h3>
                </div>
                <div className="flex flex-wrap gap-3">
                  {astrologer.profile.specialties.map((specialty, idx) => (
                    <span
                      key={idx}
                      className="px-4 py-2 bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 rounded-xl text-sm font-semibold"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>
            )}

          {/* Bio */}
          {astrologer.profile?.bio && (
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">About</h3>
              <p className="text-gray-700 leading-relaxed text-lg">
                {astrologer.profile.bio}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AstrologerDetail;
