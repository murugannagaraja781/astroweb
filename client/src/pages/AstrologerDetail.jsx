 import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import AuthContext from "../context/AuthContext";
import ClienttoAstrologyvideocall from './AstrologertoClientVideoCall';
import {
  Video,
  MessageCircle,
  Star,
  Award,
  Globe,
  Languages,
  Sparkles,
  ArrowLeft,
  Clock,
  Users,
  Zap,
  Heart,
  Shield,
  Camera,
  Phone,
  Eye,
  CrystalBall,
  Moon,
  Sun,
  Planet,
  Pyramid,
  Lotus,
  PalmReading,
  TarotCards,
  Horoscope,
  Zodiac,
  Crystal,
  Meditation,
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
  const [waitingType, setWaitingType] = useState("");
  const [socket, setSocket] = useState(null);
  const [showVideoCall, setShowVideoCall] = useState(false);

  // Initialize socket connection
  useEffect(() => {
    if (!user?.name) return;

    const newSocket = io(import.meta.env.VITE_API_URL, {
      query: { username: user.name }
    });
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user?.name]);

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

  const handleVideoCall = () => {
    if (!user) {
      alert("Please login to continue");
      navigate("/login");
      return;
    }

    if (user.role === "client" && balance < 1) {
      alert("Insufficient balance! Please add money to your wallet.");
      navigate("/dashboard");
      return;
    }

    if (!astrologer.isOnline) {
      alert("This astrologer is currently offline. Please try again later.");
      return;
    }

    setShowVideoCall(true);
  };

  const handleChat = async () => {
    if (!user) {
      alert("Please login to continue");
      navigate("/login");
      return;
    }

    if (user.role === "client" && balance < 1) {
      alert("Insufficient balance! Please add money to your wallet.");
      navigate("/dashboard");
      return;
    }

    if (!astrologer.isOnline) {
      alert("This astrologer is currently offline. Please try again later.");
      return;
    }

    if (!socket) {
      alert("Connection not ready. Please try again.");
      return;
    }

    setWaiting(true);
    setWaitingType("chat");

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/chat/request`,
        { astrologerId: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { sessionId, ratePerMinute } = res.data;

      socket.emit("user_online", { userId: user.id });
      socket.emit("chat:request", {
        clientId: user.id,
        astrologerId: id,
        ratePerMinute: ratePerMinute || 1,
        sessionId: sessionId
      });

      navigate(`/chat/${sessionId}`);
    } catch (err) {
      console.error("Error requesting chat:", err);
      setWaiting(false);
      alert("Failed to request chat. Please try again.");
    }
  };

  // Cosmic background elements
  const CosmicBackground = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Stars */}
      <div className="absolute top-10 left-10 w-2 h-2 bg-white rounded-full opacity-40 animate-pulse"></div>
      <div className="absolute top-20 right-20 w-1 h-1 bg-yellow-200 rounded-full opacity-60 animate-pulse delay-75"></div>
      <div className="absolute bottom-16 left-1/4 w-1.5 h-1.5 bg-blue-200 rounded-full opacity-50 animate-pulse delay-150"></div>
      <div className="absolute top-1/2 right-1/3 w-1 h-1 bg-purple-200 rounded-full opacity-70 animate-pulse delay-200"></div>
      <div className="absolute bottom-32 left-16 w-1 h-1 bg-pink-200 rounded-full opacity-60 animate-pulse delay-300"></div>

      {/* Planets */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full opacity-10"></div>
      <div className="absolute -bottom-32 -left-20 w-60 h-60 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full opacity-10"></div>

      {/* Cosmic dust */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent"></div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
        <CosmicBackground />
        <div className="text-center relative z-10">
          <div className="relative mb-6">
            <CrystalBall className="w-16 h-16 text-purple-300 mx-auto animate-pulse" />
            <div className="absolute inset-0 bg-purple-300 rounded-full blur-xl opacity-20 animate-ping"></div>
          </div>
          <p className="text-purple-200 text-lg font-light">Connecting to cosmic energies...</p>
          <div className="mt-4 flex justify-center space-x-2">
            <div className="w-2 h-2 bg-purple-300 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-purple-300 rounded-full animate-bounce delay-100"></div>
            <div className="w-2 h-2 bg-purple-300 rounded-full animate-bounce delay-200"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!astrologer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
        <CosmicBackground />
        <div className="text-center relative z-10">
          <div className="relative mb-6">
            <Pyramid className="w-20 h-20 text-purple-300 mx-auto mb-4" />
            <div className="absolute inset-0 bg-purple-300 rounded-full blur-xl opacity-20"></div>
          </div>
          <p className="text-xl text-purple-200 mb-4 font-light">Astrologer not found in cosmic realm</p>
          <button
            onClick={() => navigate("/")}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 shadow-2xl hover:shadow-purple-500/25"
          >
            Return to Cosmic Universe
          </button>
        </div>
      </div>
    );
  }

  if (showVideoCall) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative">
        <CosmicBackground />
        <div className="container mx-auto p-4 relative z-10">
          <button
            onClick={() => setShowVideoCall(false)}
            className="flex items-center gap-3 text-white hover:text-purple-200 mb-6 transition-colors group bg-white/10 backdrop-blur-lg rounded-2xl px-4 py-3 border border-white/20"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to Cosmic Profile
          </button>
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 text-white border border-white/20 shadow-2xl">
            <div className="text-center mb-6">
              <div className="relative inline-block mb-4">
                <Video className="w-16 h-16 text-purple-300 mx-auto" />
                <div className="absolute inset-0 bg-purple-300 rounded-full blur-xl opacity-20"></div>
              </div>
              <h3 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">
                Cosmic Video Connection
              </h3>
              <p className="text-purple-200 font-light">Connecting you through spiritual dimensions</p>
            </div>
            <ClienttoAstrologyvideocall />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      <CosmicBackground />

      {/* Cosmic Header */}
      <div className="relative text-white py-8 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-600/30 via-pink-600/20 to-blue-600/10 backdrop-blur-sm"></div>

        <div className="container mx-auto relative z-10">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-3 text-white hover:text-purple-200 mb-6 transition-colors group bg-white/10 backdrop-blur-lg rounded-2xl px-4 py-3 border border-white/20"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Cosmic Realm</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 -mt-8 relative z-20 pb-20">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden border border-white/20">
          {/* Profile Header */}
          <div className="relative p-6 md:p-8 text-white">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/80 via-pink-600/70 to-blue-600/60 backdrop-blur-sm"></div>

            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 relative z-10">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-2xl border-4 border-white/30 relative overflow-hidden">
                  <span className="text-white text-2xl md:text-4xl font-bold relative z-10">
                    {getInitials(astrologer.name)}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                </div>
                {astrologer.isOnline && (
                  <div className="absolute bottom-1 right-1 md:bottom-2 md:right-2 w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-green-400 to-emerald-600 border-4 border-white/30 rounded-full animate-pulse flex items-center justify-center shadow-lg">
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-white rounded-full"></div>
                  </div>
                )}
                {/* Cosmic Orbital Rings */}
                <div className="absolute -inset-4 border-2 border-purple-300/30 rounded-full animate-spin-slow"></div>
                <div className="absolute -inset-6 border-2 border-pink-300/20 rounded-full animate-spin-slow reverse"></div>
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                  <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-white to-purple-100 bg-clip-text text-transparent">
                    {astrologer.name}
                  </h1>

                  <div className="flex items-center justify-center md:justify-start gap-3">
                    {astrologer.isOnline ? (
                      <span className="px-4 py-2 bg-green-500/20 backdrop-blur-sm text-green-100 rounded-2xl text-sm font-semibold flex items-center gap-2 border border-green-400/30">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        ✨ Cosmic Guidance Available
                      </span>
                    ) : (
                      <span className="px-4 py-2 bg-gray-500/20 text-gray-300 rounded-2xl text-sm font-semibold flex items-center gap-2 border border-gray-400/30">
                        <Moon className="w-4 h-4" />
                        🌙 Meditating in Cosmic Realm
                      </span>
                    )}
                  </div>
                </div>

                {/* Rate */}
                <div className="flex items-center justify-center md:justify-start gap-2 text-xl md:text-2xl font-bold text-yellow-300 mb-6">
                  <Star className="w-5 h-5 md:w-6 md:h-6 fill-yellow-300" />
                  ₹{astrologer.profile?.ratePerMinute || 0}/min
                  <span className="text-sm text-purple-200 ml-2 font-light">Cosmic Consultation</span>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                  <button
                    onClick={handleVideoCall}
                    className="flex items-center justify-center gap-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-2xl font-bold hover:from-green-600 hover:to-emerald-700 transition-all shadow-2xl hover:shadow-3xl transform hover:scale-105 group flex-1 sm:flex-none"
                  >
                    <Camera className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span>Cosmic Video Call</span>
                  </button>

                  <button
                    onClick={handleChat}
                    className="flex items-center justify-center gap-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-4 rounded-2xl font-bold hover:from-blue-600 hover:to-purple-700 transition-all shadow-2xl hover:shadow-3xl transform hover:scale-105 group flex-1 sm:flex-none"
                  >
                    <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span>Spiritual Chat</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-white/5 backdrop-blur-sm border-b border-white/10">
            {astrologer.profile?.experience && (
              <div className="text-center group">
                <div className="flex items-center justify-center gap-2 text-purple-300 mb-2">
                  <Clock className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="text-2xl font-bold">{astrologer.profile.experience}+</span>
                </div>
                <p className="text-sm text-purple-200 font-light">Years of Wisdom</p>
              </div>
            )}

            <div className="text-center group">
              <div className="flex items-center justify-center gap-2 text-pink-300 mb-2">
                <Users className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="text-2xl font-bold">98%</span>
              </div>
              <p className="text-sm text-purple-200 font-light">Souls Guided</p>
            </div>

            <div className="text-center group">
              <div className="flex items-center justify-center gap-2 text-blue-300 mb-2">
                <Zap className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="text-2xl font-bold">24/7</span>
              </div>
              <p className="text-sm text-purple-200 font-light">Cosmic Access</p>
            </div>

            <div className="text-center group">
              <div className="flex items-center justify-center gap-2 text-green-300 mb-2">
                <Shield className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="text-2xl font-bold">100%</span>
              </div>
              <p className="text-sm text-purple-200 font-light">Divine Authentic</p>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-6 md:p-8">
            {/* Specialties */}
            {astrologer.profile?.specialties && astrologer.profile.specialties.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg">
                    <CrystalBall className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Divine Specialties</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {astrologer.profile.specialties.map((specialty, idx) => (
                    <div
                      key={idx}
                      className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 text-center group hover:bg-white/15 transition-all duration-300 hover:transform hover:scale-105"
                    >
                      <div className="flex items-center justify-center gap-2">
                        {idx % 3 === 0 && <TarotCards className="w-4 h-4 text-purple-300" />}
                        {idx % 3 === 1 && <PalmReading className="w-4 h-4 text-pink-300" />}
                        {idx % 3 === 2 && <Horoscope className="w-4 h-4 text-blue-300" />}
                        <span className="text-white font-medium group-hover:text-purple-200">
                          {specialty}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6 md:gap-8">
              {/* Languages */}
              {astrologer.profile?.languages && astrologer.profile.languages.length > 0 && (
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl shadow-lg">
                      <Globe className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Cosmic Languages</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {astrologer.profile.languages.map((lang, idx) => (
                      <span
                        key={idx}
                        className="px-4 py-2 bg-white/20 border border-white/30 text-white rounded-xl text-sm font-medium backdrop-blur-sm hover:bg-white/30 transition-colors"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience */}
              {astrologer.profile?.experience && (
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl shadow-lg">
                      <Pyramid className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Ancient Wisdom</h3>
                  </div>
                  <p className="text-white text-lg font-semibold mb-3">
                    {astrologer.profile.experience} years of cosmic guidance
                  </p>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-amber-500 h-2 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${Math.min(astrologer.profile.experience * 10, 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Bio */}
            {astrologer.profile?.bio && (
              <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl shadow-lg">
                    <Lotus className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Cosmic Message</h3>
                </div>
                <p className="text-white leading-relaxed text-lg font-light">
                  {astrologer.profile.bio}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Waiting Modal */}
      {waiting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-purple-900 to-blue-900 rounded-3xl shadow-2xl p-8 max-w-sm mx-4 text-center transform animate-scale-in border border-white/20">
            <div className="w-20 h-20 mx-auto mb-6 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-ping opacity-20"></div>
              <div className="absolute inset-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-2xl">
                {waitingType === "call" ? (
                  <Video className="w-8 h-8 text-white animate-pulse" />
                ) : (
                  <MessageCircle className="w-8 h-8 text-white animate-pulse" />
                )}
              </div>
            </div>

            <h4 className="text-2xl font-bold text-white mb-2">
              Connecting to Cosmos...
            </h4>
            <p className="text-purple-200 mb-6 font-light">
              {waitingType === "call"
                ? "Establishing spiritual video connection..."
                : "Waiting for astrologer to accept your cosmic request..."}
            </p>

            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setWaiting(false)}
                className="px-6 py-3 border border-purple-400 text-purple-200 rounded-2xl font-semibold hover:bg-purple-500/20 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Balance */}
      <div className="fixed bottom-6 right-6 z-30">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-2xl shadow-2xl text-sm font-semibold backdrop-blur-sm border border-white/20 animate-float">
          <div className="flex items-center gap-2">
            <Crystal className="w-4 h-4" />
            <span>Cosmic Balance: ₹{balance}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AstrologerDetail;