// pages/HomePage.jsx - Premium Home Screen
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Filter,
  Star,
  Clock,
  Zap,
  Crown,
  Sparkles,
  Video,
  MessageCircle
} from 'lucide-react';
import axios from 'axios';

const HomePage = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const { data: astrologers, isLoading } = useQuery({
    queryKey: ['astrologers'],
    queryFn: async () => {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/public/astrologers`);
      return response.data;
    }
  });

  const categories = [
    { id: 'all', name: 'All', icon: Sparkles },
    { id: 'online', name: 'Online', icon: Zap },
    { id: 'vedic', name: 'Vedic', icon: Crown },
    { id: 'numerology', name: 'Numerology', icon: Star },
  ];

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const filteredAstrologers = astrologers?.filter(astro => {
    const matchesCategory = activeCategory === 'all' ||
      (activeCategory === 'online' && astro.isOnline) ||
      astro.specialties?.includes(activeCategory);

    const matchesSearch = astro.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      astro.specialties?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="p-4 pb-24">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gold-400 bg-clip-text text-transparent">
              AstroConnect
            </h1>
            <p className="text-gray-400 mt-1">Connect with celestial guidance</p>
          </div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 bg-purple-600 rounded-2xl flex items-center justify-center"
          >
            <Sparkles className="w-5 h-5" />
          </motion.div>
        </div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative mb-4"
        >
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search astrologers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-space-700/50 border border-purple-500/20 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-xl"
          />
          <Filter className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        </motion.div>
      </motion.header>

      {/* Categories */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex space-x-3 mb-6 overflow-x-auto scrollbar-hide"
      >
        {categories.map((category, index) => {
          const Icon = category.icon;
          const isActive = activeCategory === category.id;

          return (
            <motion.button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex items-center space-x-2 px-4 py-3 rounded-2xl whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg'
                  : 'bg-space-700/50 text-gray-400 border border-purple-500/10'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Icon size={18} />
              <span className="font-medium">{category.name}</span>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Online Now Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Online Now</h2>
          <div className="flex items-center space-x-1 text-green-400">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm">{filteredAstrologers?.filter(a => a.isOnline)?.length || 0} available</span>
          </div>
        </div>

        <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-2">
          {filteredAstrologers
            ?.filter(astro => astro.isOnline)
            .slice(0, 10)
            .map((astro, index) => (
              <AstrologerCard key={astro._id} astro={astro} index={index} />
            ))}
        </div>
      </motion.section>

      {/* All Astrologers */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="text-xl font-bold text-white mb-4">Top Astrologers</h2>

        <AnimatePresence>
          {isLoading ? (
            <div className="grid gap-4">
              {[...Array(4)].map((_, i) => (
                <AstrologerSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredAstrologers?.map((astro, index) => (
                <AstrologerCard key={astro._id} astro={astro} index={index} detailed />
              ))}
            </div>
          )}
        </AnimatePresence>
      </motion.section>
    </div>
  );
};

const AstrologerCard = ({ astro, index, detailed = false }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`bg-space-700/50 backdrop-blur-xl border border-purple-500/20 rounded-3xl overflow-hidden ${
        detailed ? 'p-4' : 'w-24 flex-shrink-0'
      }`}
    >
      {detailed ? (
        <DetailedAstrologerCard astro={astro} />
      ) : (
        <CompactAstrologerCard astro={astro} />
      )}
    </motion.div>
  );
};

const CompactAstrologerCard = ({ astro }) => (
  <div className="text-center p-3">
    <div className="relative mx-auto mb-2">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center">
        <span className="text-white font-bold text-lg">
          {astro.name.split(' ').map(n => n[0]).join('')}
        </span>
      </div>
      {astro.isOnline && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 border-2 border-space-800 rounded-full" />
      )}
    </div>
    <h3 className="font-semibold text-white text-sm truncate">{astro.name.split(' ')[0]}</h3>
    <p className="text-gold-400 text-xs font-bold">₹{astro.ratePerMinute}/min</p>
  </div>
);

const DetailedAstrologerCard = ({ astro }) => (
  <div className="flex space-x-4">
    <div className="relative">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center">
        <span className="text-white font-bold text-xl">
          {astro.name.split(' ').map(n => n[0]).join('')}
        </span>
      </div>
      {astro.isOnline && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 border-2 border-space-800 rounded-full animate-pulse" />
      )}
    </div>

    <div className="flex-1 min-w-0">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-bold text-white text-lg truncate">{astro.name}</h3>
          <div className="flex items-center space-x-2 mt-1">
            <Star className="w-4 h-4 text-gold-400 fill-current" />
            <span className="text-gold-400 font-bold">{astro.rating}</span>
            <span className="text-gray-400 text-sm">({astro.reviews} reviews)</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-gold-400 font-bold text-lg">₹{astro.ratePerMinute}/min</p>
          <p className="text-green-400 text-sm">{astro.isOnline ? 'Online' : 'Offline'}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {astro.specialties?.slice(0, 3).map(specialty => (
          <span
            key={specialty}
            className="px-2 py-1 bg-purple-600/20 text-purple-300 rounded-lg text-xs border border-purple-500/30"
          >
            {specialty}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 text-sm text-gray-400">
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{astro.experience} years</span>
          </div>
          <div className="flex items-center space-x-1">
            <MessageCircle className="w-4 h-4" />
            <span>{astro.consultations}+ consults</span>
          </div>
        </div>

        <div className="flex space-x-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 bg-purple-600 rounded-xl text-white"
          >
            <MessageCircle className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 bg-gold-500 rounded-xl text-white"
          >
            <Video className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </div>
  </div>
);

const AstrologerSkeleton = () => (
  <div className="bg-space-700/50 backdrop-blur-xl border border-purple-500/20 rounded-3xl p-4 animate-pulse">
    <div className="flex space-x-4">
      <div className="w-20 h-20 rounded-2xl bg-gray-600" />
      <div className="flex-1 space-y-3">
        <div className="h-4 bg-gray-600 rounded w-3/4" />
        <div className="h-3 bg-gray-600 rounded w-1/2" />
        <div className="flex space-x-2">
          <div className="h-6 bg-gray-600 rounded w-16" />
          <div className="h-6 bg-gray-600 rounded w-20" />
        </div>
      </div>
    </div>
  </div>
);

export default HomePage;
