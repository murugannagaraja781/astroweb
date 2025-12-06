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
      {/* Royal Orange-Gold Header */}
      <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 px-4 py-4 shadow-md sticky top-0 z-50">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="p-1 hover:bg-white/10 rounded-full transition-colors">
              <ArrowLeft size={24} className="text-white" />
            </button>
            <h1 className="text-xl font-serif font-bold tracking-wide">Royal Astrologers</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-bold border border-white/20 flex items-center gap-1">
              <span className="text-yellow-200 text-lg">₹</span>
              <span className="text-white">300.0</span>
            </div>
            <Search size={20} className="text-white opacity-90" />
            <Filter size={20} className="text-white opacity-90" />
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {filters.map(filter => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
                activeFilter === filter.id
                  ? 'bg-white text-orange-600 shadow-md border-white transform scale-105'
                  : 'bg-black/20 text-white/90 border-white/10 hover:bg-black/30'
              }`}
            >
              {filter.id === 'All' && <span className="text-lg">❖</span>}
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
            className="bg-white rounded-2xl p-4 shadow-sm border border-orange-100 flex gap-4 cursor-pointer active:scale-[0.99] transition-transform hover:shadow-md"
          >
            {/* Image Section */}
            <div className="relative flex-shrink-0">
               <div className="w-20 h-20 rounded-full border-2 border-orange-400 p-0.5 shadow-sm">
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
