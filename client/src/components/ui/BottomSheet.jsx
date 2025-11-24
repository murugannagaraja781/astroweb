// Bottom Sheet Component - React Native style
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';

const BottomSheet = ({ isOpen, onClose, children, title }) => {
  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-space-800 rounded-t-3xl z-50 max-h-[90vh] overflow-y-auto"
          >
            {/* Handle */}
            <div className="sticky top-0 bg-space-800 rounded-t-3xl pt-4 pb-2 px-6 border-b border-purple-500/10">
              <div className="w-12 h-1 bg-gray-600 rounded-full mx-auto mb-4" />
              {title && (
                <h3 className="text-lg font-bold text-white text-center">{title}</h3>
              )}
            </div>

            {/* Content */}
            <div className="p-6 pb-safe">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default BottomSheet;
