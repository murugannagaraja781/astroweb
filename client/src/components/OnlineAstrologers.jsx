import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Phone, MessageCircle, Video, Star, X } from 'lucide-react';
import { useContext, useState } from 'react';
import AuthContext from '../context/AuthContext';
import BirthDetailsForm from './BirthDetailsForm';

// Simple Modal Component
const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto relative animate-fadeIn">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 z-10">
          <X size={20} className="text-gray-600" />
        </button>
        {children}
      </div>
    </div>
  );
};

const OnlineAstrologers = ({ astrologers, filter }) => {
  const navigate = useNavigate();
  const { user, setUser } = useContext(AuthContext);
  const [showBirthModal, setShowBirthModal] = useState(false);
  const [pendingChatAstrologer, setPendingChatAstrologer] = useState(null);

  // Filter logic based on the 'filter' prop (e.g. 'love', 'career')
  // For now, we just mock filter since we don't have tags on astrologers yet
  const filteredAstrologers = astrologers.filter(a => {
      // Basic online check first
      // if (!a.isOnline) return false;

      // Mock category filter - in real app, check a.specialties or similar
      if (filter === 'all') return true;
      // return a.specialties?.includes(filter);
      return true;
  });

  const handleChatClick = (astro) => {
    // Check if user has birth details
    if (!user?.birthDetails || !user.birthDetails.year) {
       setPendingChatAstrologer(astro);
       setShowBirthModal(true);
       return;
    }
    navigate(`/chat/${astro.id || astro._id}`);
  };

  const handleProfileUpdate = (updatedUser) => {
      setUser(updatedUser);
      setShowBirthModal(false);
      if (pendingChatAstrologer) {
          navigate(`/chat/${pendingChatAstrologer.id || pendingChatAstrologer._id}`);
          setPendingChatAstrologer(null);
      }
  };


  if (filteredAstrologers.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border border-dashed border-gray-200">
        <p>No astrologers available currently.</p>
      </div>
    );
  }

  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase();
  };

  return (
    <>
      <div className="flex flex-col gap-3 pb-20">
        {filteredAstrologers.map((astro, index) => (
          <motion.div
            key={astro._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between"
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Avatar */}
              <div className="relative">
                  <div className="w-16 h-16 rounded-full border-2 border-yellow-400 p-0.5">
                      {/* Placeholder for real image user.avatar || ... */}
                      <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                        <span className="text-gray-400 font-bold text-xl">{getInitials(astro.name)}</span>
                      </div>
                  </div>
                  {astro.isOnline && (
                      <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-0.5">
                      <h3 className="font-bold text-gray-900 truncate">{astro.name}</h3>
                      <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-[8px] text-white">✓</div>
                  </div>
                  <p className="text-xs text-gray-500 truncate">Vedic, Prasna, Tamil</p>
                  <p className="text-xs text-gray-400 mt-0.5">Exp: 15 Years</p>
                  <div className="flex items-center gap-1 mt-1">
                      <span className="text-black font-semibold text-xs">₹{astro.profile?.ratePerMinute}/min</span>
                      {/* <span className="text-gray-400 text-[10px] line-through">₹50</span> */}
                  </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 ml-2">
                <button
                  onClick={() => handleChatClick(astro)}
                  className="w-10 h-10 rounded-lg border border-green-500 flex items-center justify-center text-green-600 hover:bg-green-50 transition-colors"
                >
                    <MessageCircle size={18} />
                </button>
                <button
                  className="w-10 h-10 rounded-lg border border-red-500 flex items-center justify-center text-red-600 hover:bg-red-50 transition-colors"
                >
                    <Phone size={18} />
                </button>
            </div>
          </motion.div>
        ))}
      </div>

      <Modal isOpen={showBirthModal} onClose={() => setShowBirthModal(false)}>
        <BirthDetailsForm user={user} onUpdate={handleProfileUpdate} />
      </Modal>
    </>
  );
};

export default OnlineAstrologers;
