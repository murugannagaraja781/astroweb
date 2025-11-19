import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Sparkles, Star, Clock, Globe, Award } from 'lucide-react';

const Home = () => {
  const [astrologers, setAstrologers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAstrologers();
  }, []);

  const fetchAstrologers = async () => {
    try {
      const res = await axios.get('https://astroweb-y0i6.onrender.com/api/admin/astrologers');
      setAstrologers(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching astrologers:', err);
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const onlineAstrologers = astrologers.filter(a => a.profile?.isOnline);
  const offlineAstrologers = astrologers.filter(a => !a.profile?.isOnline);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-purple-600 text-white py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-12 h-12 animate-pulse" />
            <h1 className="text-5xl md:text-6xl font-bold">AstroConnect1.o</h1>
          </div>
          <p className="text-xl md:text-2xl text-orange-100 mb-8">
            Connect with Expert Astrologers Instantly
          </p>
          <p className="text-lg text-orange-50 max-w-2xl mx-auto">
            Get personalized guidance from certified astrologers through video calls and chat.
            Your journey to clarity starts here.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Online Astrologers */}
        {onlineAstrologers.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-2 h-8 bg-gradient-to-b from-green-500 to-green-600 rounded-full"></div>
              <h2 className="text-3xl font-bold text-gray-800">Available Now</h2>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {onlineAstrologers.map(astro => (
                <div
                  key={astro._id}
                  onClick={() => navigate(`/astrologer/${astro._id}`)}
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all cursor-pointer border border-green-100 transform hover:scale-105"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg">
                        <span className="text-white text-2xl font-bold">
                          {getInitials(astro.name)}
                        </span>
                      </div>
                      <span className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 border-4 border-white rounded-full animate-pulse"></span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800 mb-1">{astro.name}</h3>
                      <div className="flex items-center gap-1 text-green-600 text-sm font-semibold mb-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Online Now
                      </div>
                      <div className="flex items-center gap-1 text-orange-600 font-bold">
                        <Star className="w-4 h-4 fill-orange-600" />
                        ₹{astro.profile?.ratePerMinute || 0}/min
                      </div>
                    </div>
                  </div>

                  {astro.profile?.specialties && astro.profile.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {astro.profile.specialties.slice(0, 3).map((specialty, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  )}

                  {astro.profile?.experience && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Award className="w-4 h-4" />
                      {astro.profile.experience} years experience
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Astrologers */}
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-2 h-8 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full"></div>
            <h2 className="text-3xl font-bold text-gray-800">All Astrologers</h2>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-200 border-t-orange-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading astrologers...</p>
            </div>
          ) : astrologers.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg">No astrologers available at the moment</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {offlineAstrologers.map(astro => (
                <div
                  key={astro._id}
                  onClick={() => navigate(`/astrologer/${astro._id}`)}
                  className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all cursor-pointer border border-gray-100 transform hover:scale-105"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center shadow-lg">
                        <span className="text-white text-2xl font-bold">
                          {getInitials(astro.name)}
                        </span>
                      </div>
                      <span className="absolute bottom-0 right-0 w-6 h-6 bg-gray-400 border-4 border-white rounded-full"></span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800 mb-1">{astro.name}</h3>
                      <div className="flex items-center gap-1 text-gray-500 text-sm font-medium mb-2">
                        <Clock className="w-3 h-3" />
                        Offline
                      </div>
                      <div className="flex items-center gap-1 text-orange-600 font-bold">
                        <Star className="w-4 h-4 fill-orange-600" />
                        ₹{astro.profile?.ratePerMinute || 0}/min
                      </div>
                    </div>
                  </div>

                  {astro.profile?.specialties && astro.profile.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {astro.profile.specialties.slice(0, 3).map((specialty, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  )}

                  {astro.profile?.experience && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Award className="w-4 h-4" />
                      {astro.profile.experience} years experience
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
