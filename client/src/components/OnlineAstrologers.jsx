import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const OnlineAstrologers = ({ astrologers }) => {
  const navigate = useNavigate();
  const onlineAstrologers = astrologers.filter(a => a.isOnline);

  if (onlineAstrologers.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No astrologers are currently online.
      </div>
    );
  }

  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase();
  };

  return (
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
          className="flex-shrink-0 w-28 flex flex-col items-center cursor-pointer p-3 rounded-2xl hover:bg-purple-50 transition-colors"
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
              className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-400 border-2 border-white rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            ></motion.span>
          </div>
          <span className="text-xs font-medium text-gray-800 text-center truncate w-full px-1">
            {astro.name.split(' ')[0]}
          </span>
          <span className="text-[11px] text-purple-600 font-bold mt-1">
            ₹{astro.profile?.ratePerMinute}/min
          </span>
        </motion.div>
      ))}
    </div>
  );
};

export default OnlineAstrologers;
