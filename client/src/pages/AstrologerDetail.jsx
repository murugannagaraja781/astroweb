 import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { Video, MessageCircle, Star, Award, Languages, Sparkles, ArrowLeft } from 'lucide-react';
import { io } from 'socket.io-client';
import Popup from '../components/Popup';

const AstrologerDetail = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [astrologer, setAstrologer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [waiting, setWaiting] = useState(false);
  const [popup, setPopup] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  const socket = io(import.meta.env.VITE_API_URL);

  useEffect(() => {
    fetchAstrologer();
    if (user) fetchBalance();
  }, [id, user]);

  const fetchBalance = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/wallet/balance`);
      setBalance(res.data.balance);
    } catch (err) {
      console.error('Error fetching balance:', err);
    }
  };

  const fetchAstrologer = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/astrologers/${id}`);
      setAstrologer(res.data);
    } catch (err) {
      console.error('Error fetching astrologer:', err);
    } finally {
      setLoading(false);
    }
  };

  const showPopup = (title, message, onConfirm = null, confirmText = "OK") => {
    setPopup({ isOpen: true, title, message, onConfirm, confirmText });
  };

  const closePopup = () => {
    setPopup({ isOpen: false, title: '', message: '', onConfirm: null });
  };

  const handleAction = (action) => {
    // Check if user is logged in
    if (!user) {
      showPopup(
        'Login Required',
        'Please login to continue',
        () => {
          closePopup();
          navigate('/login');
        },
        'Go to Login'
      );
      return;
    }

    // Check balance for clients
    if (user.role === 'client' && balance < 1) {
      showPopup(
        'Insufficient Balance',
        'Please add money to your wallet. Minimum ₹1 required.',
        () => {
          closePopup();
          navigate('/dashboard');
        },
        'Add Money'
      );
      return;
    }

    // Check if astrologer is online
    if (!astrologer?.isOnline) {
      showPopup('Astrologer Offline', 'This astrologer is currently offline. Please try again later.');
      return;
    }

    if (action === 'call') {
      navigate(`/call/${id}`);
    } else if (action === 'chat') {
      startChat();
    }
  };

  const startChat = () => {
    setWaiting(true);

    socket.emit('chat:request', {
      clientId: user.id,
      astrologerId: id,
      ratePerMinute: astrologer.profile?.ratePerMinute || 1
    });

    socket.once('chat:joined', ({ sessionId }) => {
      setWaiting(false);
      // Store chat session
      axios.post(`${import.meta.env.VITE_API_URL}/api/chat/session`, {
        userId: user.id,
        astrologerId: id,
        sessionId,
        initiatedAt: new Date().toISOString()
      }).catch(console.error);

      navigate(`/chat/${sessionId}`);
    });

    socket.once('chat:error', () => {
      setWaiting(false);
      showPopup('Chat Error', 'Failed to start chat. Please try again.');
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      if (waiting) {
        setWaiting(false);
        showPopup('Timeout', 'Astrologer is not responding. Please try again later.');
      }
    }, 30000);
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
            onClick={() => navigate('/')}
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
            onClick={() => navigate('/')}
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
                  {astrologer.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                </span>
              </div>
              {astrologer.isOnline && (
                <span className="absolute bottom-2 right-2 w-8 h-8 bg-green-500 border-4 border-white rounded-full animate-pulse"></span>
              )}
            </div>

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl font-bold text-gray-800 mb-2">{astrologer.name}</h1>
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

              <div className="flex items-center justify-center md:justify-start gap-2 text-2xl font-bold text-orange-600 mb-6">
                <Star className="w-6 h-6 fill-orange-600" />
                ₹{astrologer.profile?.ratePerMinute || 0}/min
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <button
                  onClick={() => handleAction('call')}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Video size={20} />
                  Video Call
                </button>
                <button
                  onClick={() => handleAction('chat')}
                  className="flex items-center gap-2 bg-white text-orange-600 border-2 border-orange-500 px-6 py-3 rounded-xl font-semibold hover:bg-orange-50 transition-all transform hover:scale-105"
                >
                  <MessageCircle size={20} />
                  Chat
                </button>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {astrologer.profile?.experience && (
              <div className="bg-orange-50 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Award className="w-6 h-6 text-orange-600" />
                  <h3 className="text-lg font-bold text-gray-800">Experience</h3>
                </div>
                <p className="text-gray-700 text-lg">{astrologer.profile.experience} years</p>
              </div>
            )}

            {astrologer.profile?.languages && (
              <div className="bg-purple-50 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Languages className="w-6 h-6 text-purple-600" />
                  <h3 className="text-lg font-bold text-gray-800">Languages</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {astrologer.profile.languages.map((lang, idx) => (
                    <span key={idx} className="px-3 py-1 bg-purple-200 text-purple-800 rounded-full text-sm">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Specialties */}
          {astrologer.profile?.specialties && (
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-6 h-6 text-orange-600" />
                <h3 className="text-2xl font-bold text-gray-800">Specialties</h3>
              </div>
              <div className="flex flex-wrap gap-3">
                {astrologer.profile.specialties.map((specialty, idx) => (
                  <span key={idx} className="px-4 py-2 bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 rounded-xl text-sm font-semibold">
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

      {/* Popup */}
      <Popup
        isOpen={popup.isOpen}
        onClose={closePopup}
        title={popup.title}
        message={popup.message}
        onConfirm={popup.onConfirm}
        confirmText={popup.confirmText}
      />

      {/* Loading Overlay */}
      {waiting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange-200 border-t-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-700 font-medium">Waiting for astrologer to accept...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AstrologerDetail;