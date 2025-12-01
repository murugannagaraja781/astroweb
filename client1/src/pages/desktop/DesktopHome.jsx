import { useNavigate } from 'react-router-dom';
import { Sparkles, Star, Clock, Award } from 'lucide-react';

const DesktopHome = ({ astrologers, loading }) => {
  const navigate = useNavigate();

  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase();
  };

  const onlineAstrologers = astrologers.filter(a => a.isOnline);
  const offlineAstrologers = astrologers.filter(a => !a.isOnline);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-purple-600 text-white py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-12 h-12 animate-pulse" />
            <h1 className="text-5xl md:text-6xl font-bold">AstroConnect</h1>
          </div>
          <p className="text-xl md:text-2xl text-orange-100 mb-8">
            Connect with Expert Astrologers Instantly 3
          </p>
          <p className="text-lg text-orange-50 max-w-2xl mx-auto">
            Get personalized guidance from certified astrologers through video calls and chat.
            Your journey to clarity starts here.
          </p>
        </div>
      </div>

      {/* Daily Horoscope Section */}
      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-3">இன்றைய ராசி பலன்</h2>
            <p className="text-purple-100 text-lg">Daily Horoscope - Choose Your Zodiac Sign</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {[
              { id: 'mesham', name: 'மேஷம்', icon: '♈', color: 'from-red-400 to-red-600' },
              { id: 'rishabam', name: 'ரிஷபம்', icon: '♉', color: 'from-green-400 to-green-600' },
              { id: 'mithunam', name: 'மிதுனம்', icon: '♊', color: 'from-yellow-400 to-yellow-600' },
              { id: 'kadagam', name: 'கடகம்', icon: '♋', color: 'from-blue-400 to-blue-600' },
              { id: 'simmam', name: 'சிம்மம்', icon: '♌', color: 'from-orange-400 to-orange-600' },
              { id: 'kanni', name: 'கன்னி', icon: '♍', color: 'from-pink-400 to-pink-600' },
              { id: 'thulam', name: 'துலாம்', icon: '♎', color: 'from-purple-400 to-purple-600' },
              { id: 'viruchigam', name: 'விருச்சிகம்', icon: '♏', color: 'from-red-500 to-red-700' },
              { id: 'dhanusu', name: 'தனுசு', icon: '♐', color: 'from-indigo-400 to-indigo-600' },
              { id: 'magaram', name: 'மகரம்', icon: '♑', color: 'from-gray-400 to-gray-600' },
              { id: 'kumbam', name: 'கும்பம்', icon: '♒', color: 'from-cyan-400 to-cyan-600' },
              { id: 'meenam', name: 'மீனம்', icon: '♓', color: 'from-teal-400 to-teal-600' },
            ].map((sign) => (
              <button
                key={sign.id}
                onClick={() => navigate(`/horoscope/${sign.id}`)}
                className="group relative bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-2xl p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl border border-white/20"
              >
                <div className={`w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br ${sign.color} flex items-center justify-center text-3xl shadow-lg group-hover:shadow-xl transition-shadow`}>
                  {sign.icon}
                </div>
                <h3 className="text-white font-bold text-center text-lg mb-1">{sign.name}</h3>
                <p className="text-purple-100 text-xs text-center opacity-75 group-hover:opacity-100 transition-opacity">
                  View Today's Prediction
                </p>
              </button>
            ))}
          </div>
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

export default DesktopHome;
