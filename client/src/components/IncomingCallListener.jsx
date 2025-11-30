import React, { useEffect, useState, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import AuthContext from '../context/AuthContext';
import { Phone, PhoneOff } from 'lucide-react';

const SOCKET_URL = import.meta.env.VITE_API_URL || "https://astroweb-production.up.railway.app";

const IncomingCallListener = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [incomingCall, setIncomingCall] = useState(null);
  const socketRef = useRef();

  useEffect(() => {
    if (!user) return;

    socketRef.current = io(SOCKET_URL);
    socketRef.current.emit("join-room", user.id);

    socketRef.current.on("callUser", ({ from, name: callerName, signal }) => {
      console.log("Incoming call from:", callerName);
      setIncomingCall({ from, name: callerName, signal });
    });

    socketRef.current.on("callEnded", () => {
      setIncomingCall(null);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [user]);

  const acceptCall = () => {
    if (!incomingCall) return;
    const callData = { ...incomingCall, isReceivingCall: true };
    setIncomingCall(null);
    // Navigate to video call page with call data in state
    navigate(`/call/${incomingCall.from}`, { state: { incomingCall: callData } });
  };

  const rejectCall = () => {
    if (incomingCall && socketRef.current) {
      socketRef.current.emit("endCall", { to: incomingCall.from });
    }
    setIncomingCall(null);
  };

  if (!incomingCall) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-gray-900 to-black border border-yellow-500/30 p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent animate-pulse"></div>
        </div>

        <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/50 animate-bounce">
          <Phone size={40} className="text-white" />
        </div>

        <h3 className="text-2xl font-bold text-white mb-2">Incoming Call</h3>
        <p className="text-yellow-200 mb-8 text-lg">{incomingCall.name} is calling...</p>

        <div className="flex justify-center gap-6">
          <button
            onClick={rejectCall}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center shadow-lg group-hover:bg-red-700 transition-colors">
              <PhoneOff size={24} className="text-white" />
            </div>
            <span className="text-sm text-gray-300">Decline</span>
          </button>

          <button
            onClick={acceptCall}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-14 h-14 bg-green-600 rounded-full flex items-center justify-center shadow-lg group-hover:bg-green-700 transition-colors animate-pulse">
              <Phone size={24} className="text-white" />
            </div>
            <span className="text-sm text-gray-300">Accept</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallListener;
