// Optimized Image Component with lazy loading and blur placeholder
import { useState } from 'react';
import { motion } from 'framer-motion';

const OptimizedImage = ({ src, alt, className = '', size = 'md' }) => {
  const [loaded, setLoaded] = useState(false);

  const sizes = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20'
  };

  return (
    <div className={`relative ${sizes[size]} ${className}`}>
      {/* Blur placeholder */}
      {!loaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-purple-700 animate-pulse rounded-full" />
      )}

      <motion.img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={`w-full h-full object-cover rounded-full transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
        initial={{ opacity: 0 }}
        animate={{ opacity: loaded ? 1 : 0 }}
      />
    </div>
  );
};

export default OptimizedImage;
