import { useNavigate } from 'react-router-dom';
import { Sparkles, Star, Clock, Award } from 'lucide-react';

const MobileHome = ({ astrologers, loading }) => {
  const navigate = useNavigate();

  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase();
  };

  const onlineAstrologers = astrologers.filter(a => a.profile?.isOnline);
  const offlineAstrologers = astrologers.filter(a => !a.profile?.isOnline);

  return (
    <div className="pb-20 bg-gray-50 min-h-screen">
      {/* Mobile Hero */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-8 px-4 rounded-b-3xl shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-6 h-6 animate-pulse" />
          <h1 className="text-2xl font-bold">AstroConnect</h1>
        </div>
        <p className="text-orange-100 text-sm mb-4">
          Chat with India's best astrologers
        </p>
        {/* Search bar placeholder could go here */}
        <div className="bg-white/20 backdrop-blur-sm rounded-full p-3 flex items-center">
          <span className="text-white/70 text-sm ml-2">Search astrologers...</span>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Online Astrologers - Horizontal Scroll */}
        {onlineAstrologers.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Online Now
              </h2>
              <span className="text-orange-600 text-xs font-semibold">View All</span>
            </div>

            <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide -mx-4 px-4">
              {onlineAstrologers.map(astro => (
                <div
                  key={astro._id}
                  onClick={() => navigate(`/astrologer/${astro._id}`)}
                  className="flex-shrink-0 w-24 flex flex-col items-center"
                >
                  <div className="relative mb-2">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-md border-2 border-white">
                      <span className="text-white text-lg font-bold">
                        {getInitials(astro.name)}
                      </span>
                    </div>
                    <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></span>
                  </div>
                  <span className="text-xs font-medium text-gray-800 text-center truncate w-full">
                    {astro.name.split(' ')[0]}
                  </span>
                  <span className="text-[10px] text-orange-600 font-bold">
                    ₹{astro.profile?.ratePerMinute}/min
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Astrologers - Vertical List */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4">Top Astrologers</h2>

          {loading ? (
             <div className="flex justify-center py-8">
               <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent"></div>
             </div>
          ) : (
            <div className="space-y-4">
              {astrologers.map(astro => (
                <div
                  key={astro._id}
                  onClick={() => navigate(`/astrologer/${astro._id}`)}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4"
                >
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
                      {getInitials(astro.name)}
                    </div>
                    {astro.profile?.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-gray-800">{astro.name}</h3>
                      <div className="flex items-center gap-1 text-orange-600 text-xs font-bold bg-orange-50 px-2 py-1 rounded-full">
                        <Star className="w-3 h-3 fill-orange-600" />
                        4.5
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-1 mb-1">
                      {astro.profile?.specialties?.join(', ') || 'Vedic Astrology'}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-bold text-gray-900">
                        ₹{astro.profile?.ratePerMinute}/min
                      </span>
                      <button className="px-3 py-1 bg-orange-100 text-orange-600 text-xs font-bold rounded-full">
                        Connect
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileHome;
