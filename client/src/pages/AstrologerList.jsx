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
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      {/* Gold Header */}
      <div className="bg-[#FFD700] px-4 py-3 shadow-sm sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="p-1">
              <ArrowLeft size={24} className="text-black" />
            </button>
            <h1 className="text-lg font-bold text-black">Chat with Astrologer</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white/20 px-2 py-1 rounded text-xs font-bold border border-black/10">
              ₹300.0
            </div>
            <Search size={20} className="text-black" />
            <Filter size={20} className="text-black" />
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {filters.map(filter => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeFilter === filter.id
                  ? 'bg-white text-black shadow-sm'
                  : 'bg-white/40 text-black/70 hover:bg-white/60'
              }`}
            >
              {filter.id === 'All' && <span className="text-lg">::</span>}
              {filter.id}
            </button>
          ))}
        </div>
      </div>

      {/* List Content */}
      <div className="max-w-md mx-auto px-4 py-4 space-y-4">
        {filteredAstrologers.map((astro, index) => (
          <motion.div
            key={astro._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => navigate(`/astrologer/${astro._id}`)}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex gap-4 cursor-pointer active:scale-[0.99] transition-transform"
          >
            {/* Image Section */}
            <div className="relative flex-shrink-0">
               <div className="w-16 h-16 rounded-full border-2 border-[#FFD700] p-0.5">
                 <img
                   src={astro.profile?.profileImage || `https://ui-avatars.com/api/?name=${astro.name}&background=random`}
                   alt={astro.name}
                   className="w-full h-full rounded-full object-cover"
                 />
               </div>
               {/* Verified Badge */}
               <div className="absolute bottom-0 right-0 bg-white rounded-full">
                 <CheckCircle size={16} className="text-blue-500 fill-white" />
               </div>
            </div>

            {/* Info Section */}
            <div className="flex-1 min-w-0">
               <div className="flex items-center justify-between mb-0.5">
                  <h3 className="font-bold text-gray-900 truncate flex items-center gap-1">
                    {astro.name}
                    <CheckCircle size={12} className="text-blue-500" />
                  </h3>
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
                      onClick={() => navigate(`/astrologer/${astro._id}`)} // Chat usually opens profile first
                      disabled={astro.profile?.isChatEnabled === false}
                    />
                  </div>
               </div>

               <p className="text-xs text-gray-500 truncate mb-0.5">
                 {astro.specialties?.join(', ') || 'Prashana, Vedic'}
               </p>
               <p className="text-xs text-gray-500 truncate mb-1">
                 {astro.languages?.join(', ') || 'English, Tamil'}
               </p>

               <p className="text-xs text-gray-400 mb-2">
                 Experience: {astro.experience || 0} Years
               </p>

               <div className="flex items-center gap-1">
                 <span className="text-sm font-bold text-gray-900">
                   Price : ₹ {astro.profile?.ratePerMinute || 20}/min
                 </span>
               </div>
            </div>
          </motion.div>
        ))}

        {filteredAstrologers.length === 0 && (
          <div className="text-center py-10 text-gray-400">
             <p>No astrologers found in this category.</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default AstrologerList;
