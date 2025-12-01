 import { Link } from 'react-router-dom';
import { Sparkles, Moon, Star, Menu, Bell } from 'lucide-react';
import { useState, useContext } from 'react';
import ThemeContext from '../../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

const MobileHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme } = useContext(ThemeContext);

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-space-900 via-purple-900 to-space-900 border-b shadow-lg backdrop-blur-xl"
      style={{ borderColor: `${theme.hex}20` }}>
      {/* Mystical Glow Line */}
      <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: `linear-gradient(to right, transparent, ${theme.hex}, transparent)` }}></div>

      {/* Cosmic Stars Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-0.5 h-0.5 bg-white rounded-full top-2 left-1/4 animate-pulse"></div>
        <div className="absolute w-1 h-1 bg-yellow-400 rounded-full top-4 right-1/3 animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="flex items-center justify-between px-4 py-3 relative z-10">
        {/* Logo Section */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="relative">
            <div className="absolute inset-0 rounded-full blur-md group-hover:opacity-100 transition-opacity opacity-50" style={{ backgroundColor: `${theme.hex}40` }}></div>
            <div className="relative w-8 h-8 rounded-full flex items-center justify-center shadow-lg border border-white/10"
              style={{ background: `linear-gradient(135deg, #d4af37, ${theme.hex})` }}>
              <Moon className="text-white w-4 h-4 fill-current" />
              <Star className="absolute -top-0.5 -right-0.5 text-white w-2.5 h-2.5 animate-pulse fill-current" />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-bold bg-clip-text text-transparent"
              style={{ backgroundImage: `linear-gradient(to right, #fff, #d4af37, ${theme.hex})` }}>
              AstroConnect
            </h1>
          </div>
        </Link>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <button className="relative p-2 rounded-full hover:bg-white/5 transition-colors">
            <Bell className="w-5 h-5 text-gray-300" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-space-900"></span>
          </button>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-full hover:bg-white/5 transition-colors"
          >
            <Menu className="w-6 h-6" style={{ color: theme.hex }} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default MobileHeader;