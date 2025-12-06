import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Search, Filter, Share2, ArrowLeft,
  MessageCircle, Phone, Video, Star, CheckCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

const AstrologerList = () => {
  const [astrologers, setAstrologers] = useState([]);
  const [filteredAstrologers, setFilteredAstrologers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const navigate = useNavigate();

  // Filters from screenshot
  const filters = [
    { id: 'All', icon: 'grid' },
    { id: 'Love', icon: 'heart' },
    { id: 'Career', icon: 'briefcase' },
    { id: 'Finance', icon: 'dollar-sign' }
  ];

  useEffect(() => {
    fetchAstrologers();
  }, []);

  useEffect(() => {
    if (activeFilter === 'All') {
      setFilteredAstrologers(astrologers);
    } else {
      // Mock filtering logic - since we might not have real tags in backend yet
      // In a real app, check astro.specialties.includes(filter)
      setFilteredAstrologers(astrologers);
    }
  }, [activeFilter, astrologers]);

  const fetchAstrologers = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/public/astrologers`);
      const onlineAstros = res.data.filter(a => a.isOnline);
      setAstrologers(onlineAstros);
      setFilteredAstrologers(onlineAstros);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching astrologers:', err);
      setLoading(false);
    }
  };

  const CardButton = ({ icon: Icon, onClick, type, disabled }) => {
    const getColors = () => {
      if (disabled) return 'text-gray-300 border-gray-200 cursor-not-allowed bg-gray-50';
      switch(type) {
        case 'chat': return 'text-green-600 border-green-600';
        case 'call': return 'text-blue-600 border-blue-600';
        case 'video': return 'text-red-500 border-red-500';
        default: return 'text-gray-600 border-gray-600';
      }
    };

    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) onClick();
        }}
        disabled={disabled}
        className={`w-8 h-8 flex items-center justify-center rounded-full border ${getColors()} hover:bg-gray-50 transition-colors`}
      >
        <Icon size={14} />
      </button>
    );
  };

  if (loading) {
     return (
       <div className="min-h-screen flex items-center justify-center bg-yellow-50">
         <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-400 border-t-yellow-600"></div>
       </div>
     );
  }

  return (
    <div className="min-h-screen bg-[#0a0a1a] pb-20 font-sans text-gray-100">
      {/* Midnight Gold Header */}
      <div className="bg-gradient-to-r from-[#0f0c29] via-[#302b63] to-[#24243e] px-4 py-5 shadow-xl sticky top-0 z-50 border-b border-white/5">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-white/10 rounded-full transition-all active:scale-95">
              <ArrowLeft size={22} className="text-[#D4AF37]" />
            </button>
            <div>
              <h1 className="text-xl font-serif font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#F8F8FF] to-[#D4AF37]">
                Royal Astrology
              </h1>
              <p className="text-[10px] text-gray-400 tracking-widest uppercase">Premium Consultations</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold border border-[#D4AF37]/30 flex items-center gap-1 shadow-[0_0_10px_rgba(212,175,55,0.1)]">
              <span className="text-[#D4AF37] text-lg">₹</span>
              <span className="text-gray-100 font-mono">300.0</span>
            </div>
            <button className="p-2 hover:bg-white/5 rounded-full transition-colors">
               <Search size={20} className="text-[#D4AF37] opacity-80" />
            </button>
            <button className="p-2 hover:bg-white/5 rounded-full transition-colors">
               <Filter size={20} className="text-[#D4AF37] opacity-80" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {filters.map(filter => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all border ${
                activeFilter === filter.id
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#C5A028] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)] border-transparent transform scale-105'
                  : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:border-[#D4AF37]/30'
              }`}
            >
              {filter.id === 'All' && <span className="text-sm">✦</span>}
              {filter.id}
            </button>
          ))}
        </div>
      </div>

      {/* List Content */}
      <div className="max-w-md mx-auto px-4 py-6 space-y-5">
        {filteredAstrologers.map((astro, index) => (
          <motion.div
            key={astro._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => navigate(`/astrologer/${astro._id}`)}
            className="group relative bg-[#13132b] rounded-2xl p-4 shadow-lg border border-[#D4AF37]/10 hover:border-[#D4AF37]/30 transition-all active:scale-[0.99]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/5 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity"></div>

            <div className="relative flex gap-4">
              {/* Image Section */}
              <div className="relative flex-shrink-0">
                 <div className="w-20 h-20 rounded-full p-0.5" style={{ background: 'linear-gradient(135deg, #D4AF37, transparent)' }}>
                   <div className="w-full h-full rounded-full p-[2px] bg-[#13132b]">
                     <img
                       src={astro.profile?.profileImage || `https://ui-avatars.com/api/?name=${astro.name}&background=random`}
                       alt={astro.name}
                       className="w-full h-full rounded-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all"
                     />
                   </div>
                 </div>
                 {/* Verified Badge */}
                 <div className="absolute -bottom-1 -right-1 bg-[#13132b] rounded-full p-0.5">
                   <CheckCircle size={18} className="text-[#D4AF37] fill-[#13132b]" />
                 </div>
              </div>

              {/* Info Section */}
              <div className="flex-1 min-w-0 pt-1">
                 <div className="flex items-center justify-between mb-1">
                    <h3 className="font-serif font-bold text-gray-100 text-lg truncate flex items-center gap-1">
                      {astro.name}
                    </h3>
                    <div className="flex items-center gap-1 text-[#D4AF37] text-xs font-bold bg-[#D4AF37]/10 px-2 py-0.5 rounded">
                      <Star size={10} className="fill-[#D4AF37]" />
                      4.9
                    </div>
                 </div>

                 <p className="text-xs text-gray-400 truncate mb-1">
                   {astro.specialties?.join(' • ') || 'Vedic • Prashana'}
                 </p>
                 <p className="text-xs text-gray-500 truncate mb-3">
                   {astro.languages?.join(', ') || 'English, Hindi'}
                 </p>

                 <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-bold text-white">
                       <span className="text-[#D4AF37]">₹{astro.profile?.ratePerMinute || 20}</span>
                       <span className="text-xs text-gray-500 font-normal">/min</span>
                    </span>

                    <div className="flex gap-2">
                      <CardButton
                        icon={Phone}
                        type="call"
                        onClick={() => navigate(`/astrologer/${astro._id}?action=audio`)}
                        disabled={astro.profile?.isCallEnabled === false}
                      />
                      <CardButton
                        icon={Video}
                        type="video"
                        onClick={() => navigate(`/astrologer/${astro._id}?action=video`)}
                        disabled={astro.profile?.isVideoEnabled === false}
                      />
                      <CardButton
                        icon={MessageCircle}
                        type="chat"
                        onClick={() => navigate(`/astrologer/${astro._id}`)}
                        disabled={astro.profile?.isChatEnabled === false}
                      />
                    </div>
                 </div>
              </div>
            </div>
          </motion.div>
        ))}

        {filteredAstrologers.length === 0 && (
          <div className="text-center py-20 text-gray-500">
             <div className="w-16 h-16 rounded-full bg-white/5 mx-auto flex items-center justify-center mb-4">
               <Search size={24} className="opacity-50" />
             </div>
             <p className="font-serif">No astrologers found in this realm.</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default AstrologerList;
