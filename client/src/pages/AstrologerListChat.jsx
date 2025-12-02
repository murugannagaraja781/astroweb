import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MessageCircle, Crown, Star, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const AstrologerListChat = () => {
  const [astrologers, setAstrologers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAstrologers();
  }, []);

  const fetchAstrologers = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/public/astrologers`);
      setAstrologers(res.data.filter(a => a.isOnline));
      setLoading(false);
    } catch (err) {
      console.error('Error fetching astrologers:', err);
      setLoading(false);
    }
  };

  const handleChatRequest = (astrologerId) => {
    navigate(`/astrologer/${astrologerId}`);
  };

  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white p-6">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Chat with Astrologer</h1>
            <p className="text-purple-200 text-sm">Select an online astrologer to start chatting</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        {astrologers.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-10 h-10 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Astrologers Online</h3>
            <p className="text-gray-600">Please check back later</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {astrologers.map((astro, index) => (
              <motion.div
                key={astro._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="p-4">
                  {/* Avatar */}
                  <div className="relative mb-3">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-600 to-purple-700 rounded-full flex items-center justify-center shadow-lg border-2 border-purple-400/30">
                      <span className="text-white text-xl font-bold">
                        {getInitials(astro.name)}
                      </span>
                    </div>
                    {/* Online Indicator */}
                    <div className="absolute bottom-0 right-1/4 w-4 h-4 bg-green-400 border-2 border-white rounded-full animate-pulse"></div>
                  </div>

                  {/* Name */}
                  <h3 className="text-center font-semibold text-gray-800 text-sm truncate mb-1">
                    {astro.name}
                  </h3>

                  {/* Rating */}
                  <div className="flex items-center justify-center gap-1 mb-2">
                    <Star size={12} className="text-yellow-500 fill-yellow-500" />
                    <span className="text-xs text-gray-600">4.8</span>
                  </div>

                  {/* Rate */}
                  <div className="text-center mb-3">
                    <span className="text-sm font-bold text-purple-600">
                      ₹{astro.profile?.ratePerMinute || 0}/min
                    </span>
                  </div>

                  {/* Chat Button */}
                  <button
                    onClick={() => handleChatRequest(astro._id)}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-md"
                  >
                    <MessageCircle size={16} />
                    <span className="text-sm">Chat Now</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AstrologerListChat;
