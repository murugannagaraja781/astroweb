// components/ui/LoadingScreen.jsx - Premium Loading Animation
import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Orbit } from 'lucide-react';

const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-space-900 via-space-800 to-purple-900 flex items-center justify-center z-50">
      <div className="text-center">
        <motion.div
          animate={{
            rotate: 360,
            scale: [1, 1.2, 1]
          }}
          transition={{
            rotate: { duration: 3, repeat: Infinity, ease: "linear" },
            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
          }}
          className="relative mx-auto mb-8"
        >
          <Orbit className="w-16 h-16 text-purple-400" />
          <motion.div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            animate={{ rotate: -360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="w-8 h-8 text-gold-400" />
          </motion.div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-4xl font-bold bg-gradient-to-r from-white to-gold-400 bg-clip-text text-transparent mb-4"
        >
          AstroConnect
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-gray-400"
        >
          Connecting you to cosmic guidance...
        </motion.p>
      </div>
    </div>
  );
};

export default LoadingScreen;
