import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Video, Phone, Crown, Star, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const AstrologerListCalls = () => {
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

  const handleVideoCall = (astrologerId) => {
    alert("Video Call feature is currently disabled.");
    // navigate(`/astrologer/${astrologerId}?action=video`);
  };

  const handleAudioCall = (astrologerId) => {
    alert("Audio Call feature is currently disabled.");
    // navigate(`/astrologer/${astrologerId}?action=audio`);
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
            <h1 className="text-2xl font-bold">Call an Astrologer</h1>
            <p className="text-purple-200 text-sm">Choose video or audio consultation</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        {astrologers.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Video className="w-10 h-10 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Astrologers Online</h3>
            <p className="text-gray-600">Please check back later</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {astrologers.map((astro, index) => (
              <motion.div
                key={astro._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="p-5">
                  <div className="flex items-center gap-4 mb-4">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-700 rounded-full flex items-center justify-center shadow-lg border-2 border-purple-400/30">
                        <span className="text-white text-lg font-bold">
                          {getInitials(astro.name)}
                        </span>
                      </div>
                      {/* Online Indicator */}
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full animate-pulse"></div>
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 mb-1">
                        {astro.name}
                      </h3>
                      <div className="flex items-center gap-1 mb-1">
                        <Star size={14} className="text-yellow-500 fill-yellow-500" />
                        <span className="text-xs text-gray-600">4.8 (125 reviews)</span>
                      </div>
                      <div className="text-sm font-bold text-purple-600">
                        ₹{astro.profile?.ratePerMinute || 0}/min
                      </div>
                    </div>
                  </div>

                  {/* Call Buttons */}
                  <div className="space-y-2">
                    <button
                      onClick={() => handleVideoCall(astro._id)}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-105 shadow-md"
                    >
                      <Video size={18} />
                      <span>Video Call</span>
                    </button>
                    <button
                      onClick={() => handleAudioCall(astro._id)}
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105 shadow-md"
                    >
                      <Phone size={18} />
                      <span>Audio Call</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AstrologerListCalls;
