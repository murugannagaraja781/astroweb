import { useNavigate } from 'react-router-dom';
import { Sparkles, Star, Clock, Zap, Crown } from 'lucide-react';
import { motion } from 'framer-motion';

const MobileHome = ({ astrologers, loading }) => {
  const navigate = useNavigate();

  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase();
  };

  const onlineAstrologers = astrologers.filter(a => a.profile?.isOnline);

  return (
    <div
      className="pb-24 min-h-screen"
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #6366f1 100%)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif'
      }}
    >
      {/* Mobile Hero - Cosmic Theme */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 text-white py-8 px-4 rounded-b-3xl shadow-2xl relative overflow-hidden"
      >
        {/* Cosmic stars background */}
        <div className="absolute inset-0">
          <div className="absolute w-1 h-1 bg-gold-400 rounded-full animate-pulse" style={{ top: '20%', left: '10%' }}></div>
          <div className="absolute w-1 h-1 bg-purple-300 rounded-full animate-pulse" style={{ top: '60%', right: '15%' }}></div>
          <div className="absolute w-0.5 h-0.5 bg-white rounded-full animate-pulse" style={{ top: '40%', left: '80%' }}></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-6 h-6 text-gold-400 animate-pulse" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gold-400 bg-clip-text text-transparent">
              AstroConnect
            </h1>
          </div>
          <p className="text-indigo-200 text-sm mb-4">
            Connect with celestial guidance ✨
          </p>

          {/* Search bar */}
          <motion.div
            whileTap={{ scale: 0.98 }}
            className="glass-effect rounded-2xl p-4 flex items-center border border-purple-500/20"
          >
            <span className="text-gray-300 text-sm ml-2">Search astrologers...</span>
          </motion.div>
        </div>
      </motion.div>

      <div className="px-4 py-6">
        {/* Online Astrologers - Horizontal Scroll */}
        {onlineAstrologers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Online Now
              </h2>
              <span className="text-gold-400 text-xs font-semibold">View All</span>
            </div>

            <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide -mx-4 px-4">
              {onlineAstrologers.map((astro, index) => (
                <motion.div
                  key={astro._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileTap={{ scale: 0.92 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => navigate(`/astrologer/${astro._id}`)}
                  className="flex-shrink-0 w-28 flex flex-col items-center cursor-pointer p-3 rounded-2xl hover:bg-purple-500/10 transition-colors"
                >
                  <div className="relative mb-3">
                    <motion.div
                      className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center shadow-lg border-2 border-purple-400/30"
                      whileTap={{ scale: 0.9 }}
                    >
                      <span className="text-white text-lg font-bold">
                        {getInitials(astro.name)}
                      </span>
                    </motion.div>
                    <motion.span
                      className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-400 border-2 border-space-900 rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    ></motion.span>
                  </div>
                  <span className="text-xs font-medium text-white text-center truncate w-full px-1">
                    {astro.name.split(' ')[0]}
                  </span>
                  <span className="text-[11px] text-gold-400 font-bold mt-1">
                    ₹{astro.profile?.ratePerMinute}/min
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Daily Horoscope - Horizontal Scroll */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-gold-400" />
              இன்றைய ராசி பலன்
            </h2>
            <span className="text-gold-400 text-xs font-semibold">Today</span>
          </div>

          <div className="flex overflow-x-auto gap-3 pb-4 scrollbar-hide -mx-4 px-4">
            {[
              { id: 'mesham', name: 'மேஷம்', icon: '♈', color: 'from-red-500 to-red-700' },
              { id: 'rishabam', name: 'ரிஷபம்', icon: '♉', color: 'from-green-500 to-green-700' },
              { id: 'mithunam', name: 'மிதுனம்', icon: '♊', color: 'from-yellow-500 to-yellow-700' },
              { id: 'kadagam', name: 'கடகம்', icon: '♋', color: 'from-blue-500 to-blue-700' },
              { id: 'simmam', name: 'சிம்மம்', icon: '♌', color: 'from-orange-500 to-orange-700' },
              { id: 'kanni', name: 'கன்னி', icon: '♍', color: 'from-pink-500 to-pink-700' },
              { id: 'thulam', name: 'துலாம்', icon: '♎', color: 'from-purple-500 to-purple-700' },
              { id: 'viruchigam', name: 'விருச்சிகம்', icon: '♏', color: 'from-red-600 to-red-800' },
              { id: 'dhanusu', name: 'தனுசு', icon: '♐', color: 'from-indigo-500 to-indigo-700' },
              { id: 'magaram', name: 'மகரம்', icon: '♑', color: 'from-gray-500 to-gray-700' },
              { id: 'kumbam', name: 'கும்பம்', icon: '♒', color: 'from-cyan-500 to-cyan-700' },
              { id: 'meenam', name: 'மீனம்', icon: '♓', color: 'from-teal-500 to-teal-700' },
            ].map((sign, index) => (
              <motion.div
                key={sign.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileTap={{ scale: 0.92 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => navigate(`/horoscope/${sign.id}`)}
                className="flex-shrink-0 w-24 cursor-pointer"
              >
                <div className="glass-card p-4 flex flex-col items-center">
                  <motion.div
                    className={`w-14 h-14 rounded-full bg-gradient-to-br ${sign.color} flex items-center justify-center text-2xl shadow-lg mb-2`}
                    whileTap={{ scale: 0.9, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    {sign.icon}
                  </motion.div>
                  <span className="text-xs font-bold text-white text-center truncate w-full">
                    {sign.name}
                  </span>
                  <span className="text-[10px] text-purple-300 mt-1">
                    View
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* All Astrologers - Vertical List */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Crown className="w-5 h-5 text-gold-400" />
            Top Astrologers
          </h2>

          {loading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="glass-card animate-pulse p-4">
                  <div className="flex gap-4">
                    <div className="w-14 h-14 rounded-full bg-gray-700/50" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-700/50 rounded w-3/4" />
                      <div className="h-3 bg-gray-700/50 rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {astrologers.map((astro, index) => (
                <motion.div
                  key={astro._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileTap={{ scale: 0.97 }}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => navigate(`/astrologer/${astro._id}`)}
                  className="glass-card p-5 flex items-center gap-4 cursor-pointer relative overflow-hidden"
                >
                  {/* Haptic pulse effect on tap */}
                  <motion.div
                    className="absolute inset-0 bg-purple-500/20 opacity-0"
                    whileTap={{
                      opacity: [0, 1, 0],
                      scale: [1, 1.05, 1]
                    }}
                    transition={{ duration: 0.3 }}
                  />

                  {/* Ripple effect container */}
                  <motion.div
                    className="absolute inset-0 bg-gold-500/10 opacity-0 rounded-2xl"
                    whileTap={{ opacity: 1 }}
                    transition={{ duration: 0.15 }}
                  />

                  <div className="relative z-10 flex items-center gap-4 w-full">
                    <div className="relative">
                      <motion.div
                        className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-white font-bold shadow-lg"
                        whileTap={{ scale: 0.9, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      >
                        {getInitials(astro.name)}
                      </motion.div>
                      {astro.profile?.isOnline && (
                        <motion.span
                          className="absolute bottom-0 right-0 w-4 h-4 bg-green-400 border-2 border-space-900 rounded-full"
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        ></motion.span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-white truncate text-base">{astro.name}</h3>
                        <div className="flex items-center gap-1 text-gold-400 text-xs font-bold bg-gold-500/10 px-2.5 py-1.5 rounded-full border border-gold-500/30">
                          <Star className="w-3 h-3 fill-gold-400" />
                          4.5
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-1 mb-3">
                        {astro.profile?.specialties?.join(', ') || 'Vedic Astrology, Numerology'}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-bold text-gold-400">
                          ₹{astro.profile?.ratePerMinute}/min
                        </span>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{
                            scale: 0.92,
                            boxShadow: "0 0 20px rgba(139, 92, 246, 0.5)"
                          }}
                          className="min-w-[100px] min-h-[44px] px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-bold rounded-full shadow-lg hover:shadow-purple-500/50 transition-shadow"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/astrologer/${astro._id}`);
                          }}
                        >
                          Connect
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileHome;
