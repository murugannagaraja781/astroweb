import { createContext, useContext, useState, useCallback } from 'react';
import { X, Sparkles, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed top-20 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

const Toast = ({ message, type, onClose }) => {
  const bgColors = {
    success: 'from-green-900 to-green-950',
    error: 'from-red-900 to-red-950',
    info: 'from-blue-900 to-blue-950',
    warning: 'from-yellow-900 to-yellow-950',
    astrology: 'from-purple-900 via-indigo-900 to-space-900' // Custom theme
  };

  const borderColors = {
    success: 'border-green-500',
    error: 'border-red-500',
    info: 'border-blue-500',
    warning: 'border-yellow-500',
    astrology: 'border-yellow-400'
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-400" />,
    error: <AlertCircle className="w-5 h-5 text-red-400" />,
    info: <Info className="w-5 h-5 text-blue-400" />,
    warning: <AlertCircle className="w-5 h-5 text-yellow-400" />,
    astrology: <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
  };

  // Default to astrology theme if type not found, or specific override
  const themeType = type === 'error' ? 'error' : 'astrology';

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.9 }}
      className={`pointer-events-auto min-w-[300px] max-w-md p-4 rounded-xl border ${borderColors[themeType]} shadow-2xl bg-gradient-to-r ${bgColors[themeType]} relative overflow-hidden`}
    >
      {/* Cosmic Background Effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
      </div>

      <div className="relative z-10 flex items-start gap-3">
        <div className="mt-0.5">{icons[themeType]}</div>
        <div className="flex-1">
          <p className="text-white font-medium text-sm leading-relaxed">{message}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Magical Glow Line */}
      <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-transparent via-yellow-400 to-transparent w-full opacity-50"></div>
    </motion.div>
  );
};

export default ToastProvider;
