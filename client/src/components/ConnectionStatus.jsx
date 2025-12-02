import { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import socketManager from '../utils/socketManager';

const ConnectionStatus = () => {
  const [status, setStatus] = useState('connected');
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleStatusChange = ({ status: newStatus }) => {
      setStatus(newStatus);

      // Show indicator when not connected
      setShow(newStatus !== 'connected');

      // Auto-hide after 5 seconds if reconnected
      if (newStatus === 'reconnected') {
        setTimeout(() => setShow(false), 5000);
      }
    };

    socketManager.on('connection_status', handleStatusChange);

    return () => {
      socketManager.off('connection_status', handleStatusChange);
    };
  }, []);

  if (!show) return null;

  const getStatusConfig = () => {
    switch (status) {
      case 'reconnecting':
        return {
          icon: RefreshCw,
          text: 'Reconnecting...',
          bgColor: 'bg-yellow-500',
          animate: 'animate-spin',
        };
      case 'disconnected':
      case 'failed':
        return {
          icon: WifiOff,
          text: 'Connection lost',
          bgColor: 'bg-red-500',
          animate: '',
        };
      case 'reconnected':
        return {
          icon: Wifi,
          text: 'Reconnected',
          bgColor: 'bg-green-500',
          animate: '',
        };
      default:
        return {
          icon: Wifi,
          text: 'Connected',
          bgColor: 'bg-green-500',
          animate: '',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className={`${config.bgColor} text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2`}>
        <Icon className={`w-4 h-4 ${config.animate}`} />
        <span className="text-sm font-medium">{config.text}</span>
      </div>
    </div>
  );
};

export default ConnectionStatus;
