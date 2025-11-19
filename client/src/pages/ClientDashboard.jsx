import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Plus, Wallet, Video, MessageCircle, Sparkles } from 'lucide-react';
import { io } from 'socket.io-client';

const socket = io('https://astroweb-y0i6.onrender.com');

const ClientDashboard = () => {
  const [astrologers, setAstrologers] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [amount, setAmount] = useState('');
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [waitingForAcceptance, setWaitingForAcceptance] = useState(false);

  useEffect(() => {
    fetchAstrologers();
    fetchWallet();

    if (user) {
      socket.emit('join', user.id);
    }

    return () => {
      // Clean up
    };
  }, [user]);

  const [currentChatTarget, setCurrentChatTarget] = useState(null);
  const [connectionTimeout, setConnectionTimeout] = useState(null);

  useEffect(() => {
    if (currentChatTarget) {
       console.log('Setting up chat acceptance listeners for:', currentChatTarget);

       const handleAccept = () => {
           console.log('Chat accepted! Navigating to chat...');
           if (connectionTimeout) clearTimeout(connectionTimeout);
           setWaitingForAcceptance(false);
           navigate(`/chat/${currentChatTarget}`);
           setCurrentChatTarget(null);
       };

       const handleReject = () => {
           console.log('Chat rejected');
           if (connectionTimeout) clearTimeout(connectionTimeout);
           setWaitingForAcceptance(false);
           alert("Astrologer is busy or rejected your request.");
           setCurrentChatTarget(null);
       };

       socket.on('callAccepted', handleAccept);
       socket.on('callRejected', handleReject);

       // Set timeout for 60 seconds (increased from 30)
       const timeout = setTimeout(() => {
           console.log('Connection timeout - no response from astrologer');
           setWaitingForAcceptance(false);
           setCurrentChatTarget(null);
           alert("Connection timeout. The astrologer didn't respond. Please try again.");
       }, 60000);

       setConnectionTimeout(timeout);

       return () => {
           socket.off('callAccepted', handleAccept);
           socket.off('callRejected', handleReject);
           if (timeout) clearTimeout(timeout);
       };
    }
  }, [currentChatTarget, navigate]);

  const fetchAstrologers = async () => {
    try {
      const res = await axios.get('https://astroweb-y0i6.onrender.com/api/admin/astrologers');
      setAstrologers(res.data);
    } catch (err) {
      console.error('Error fetching astrologers:', err);
    }
  };

  const fetchWallet = async () => {
    try {
      const res = await axios.get('https://astroweb-y0i6.onrender.com/api/wallet/balance');
      setWallet(res.data);
    } catch (err) {
      console.error('Error fetching wallet:', err);
    }
  };

  const addMoney = async () => {
    if (!amount || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    try {
      await axios.post('https://astroweb-y0i6.onrender.com/api/wallet/add', {
        amount: parseInt(amount)
      });
      fetchWallet();
      setAmount('');
      alert('Money added successfully');
    } catch (err) {
      console.error('Error adding money:', err);
      alert('Failed to add money');
    }
  };

  const startCall = (astrologerId, rate) => {
    const numericRate = Number(rate) || 0;
    const numericBalance = Number(wallet?.balance) || 0;

    if (!wallet || numericBalance < numericRate) {
      alert(`Insufficient balance (₹${numericBalance}). Required: ₹${numericRate}/min. Please add money.`);
      return;
    }
    navigate(`/call/${astrologerId}`);
  };

  const startChat = (astrologerId, rate) => {
    const numericRate = Number(rate) || 0;
    const numericBalance = Number(wallet?.balance) || 0;

    if (!wallet || numericBalance < numericRate) {
      alert(`Insufficient balance (₹${numericBalance}). Required: ₹${numericRate}/min. Please add money.`);
      return;
    }

    if (!user || !user.id) {
      alert('User session error. Please refresh and login again.');
      return;
    }

    console.log('Starting chat with:', astrologerId);
    console.log('User ID:', user.id);
    console.log('User name:', user.name);
    console.log('Socket connected:', socket.connected);

    if (!socket.connected) {
      alert('Connection error. Please refresh the page and try again.');
      return;
    }

    const callData = {
        userToCall: astrologerId,
        from: user.id,
        name: user.name || 'Client',
        type: 'chat'
    };

    console.log('Emitting callUser with data:', callData);
    socket.emit('callUser', callData);

    setCurrentChatTarget(astrologerId);
    setWaitingForAcceptance(true);
  };

  const getInitials = (name) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const onlineAstrologers = astrologers.filter(a => a.profile?.isOnline);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      {/* Waiting Modal */}
      {waitingForAcceptance && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-sm mx-4 transform animate-scaleIn">
            <div className="mb-4">
              <Sparkles className="w-16 h-16 text-orange-500 mx-auto animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-gray-800">Connecting...</h2>
            <p className="text-gray-600 mb-6">Waiting for astrologer to accept</p>
            <div className="flex justify-center mb-6">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-200 border-t-orange-600"></div>
            </div>
            <button
              onClick={() => setWaitingForAcceptance(false)}
              className="text-red-500 font-semibold hover:text-red-700 transition-colors"
            >
              Cancel Request
            </button>
          </div>
        </div>
      )}

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white pt-12 pb-16 px-4 shadow-lg">
        <div className="container mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8" />
            <h1 className="text-4xl font-bold">AstroConnect</h1>
          </div>
          <p className="text-orange-100 text-lg">Connect with expert astrologers instantly</p>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-8">
        {/* Wallet Card - Elevated */}
        <div className="mb-8 bg-white rounded-2xl shadow-xl p-6 border border-orange-100 transform hover:scale-[1.02] transition-transform">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
                <Wallet className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Wallet Balance</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                  ₹{wallet?.balance || 0}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="p-3 border-2 border-orange-200 rounded-xl w-28 focus:outline-none focus:border-orange-500 text-sm transition-colors"
                placeholder="Amount"
                min="1"
              />
              <button
                onClick={addMoney}
                className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-3 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Plus size={22} />
              </button>
            </div>
          </div>
        </div>

        {/* Online Astrologers Section */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1 h-6 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full"></div>
            <h2 className="text-2xl font-bold text-gray-800">Available Now</h2>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>

          <div className="flex overflow-x-auto gap-5 pb-4 scrollbar-hide">
            {onlineAstrologers.length > 0 ? onlineAstrologers.map(astro => (
              <div
                key={astro._id}
                className="flex flex-col items-center min-w-[100px] cursor-pointer group"
                onClick={() => startChat(astro._id, astro.profile?.ratePerMinute)}
              >
                <div className="relative mb-3">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-all transform group-hover:scale-110 border-4 border-white">
                    <span className="text-white text-2xl font-bold">
                      {getInitials(astro.name)}
                    </span>
                  </div>
                  <span className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 border-4 border-white rounded-full animate-pulse"></span>
                </div>
                <span className="text-sm font-semibold text-gray-800 text-center truncate w-full mb-1">
                  {astro.name?.split(' ')[0] || 'Astrologer'}
                </span>
                <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  Online
                </span>
              </div>
            )) : (
              <div className="text-gray-500 text-sm py-8 text-center w-full">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No astrologers online at the moment</p>
              </div>
            )}
          </div>
        </div>

        {/* All Astrologers Section */}
        <div className="pb-8">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
            <h2 className="text-2xl font-bold text-gray-800">All Astrologers</h2>
          </div>

          <div className="space-y-4">
            {astrologers.length > 0 ? astrologers.map(astro => (
              <div
                key={astro._id}
                className="bg-white rounded-2xl p-5 flex items-center gap-4 shadow-md hover:shadow-xl transition-all border border-gray-100 transform hover:scale-[1.01]"
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg">
                    <span className="text-white text-xl font-bold">
                      {getInitials(astro.name)}
                    </span>
                  </div>
                  {astro.profile?.isOnline && (
                    <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-3 border-white rounded-full"></span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 truncate">
                        {astro.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        ₹{astro.profile?.ratePerMinute || 0}/min
                      </p>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                      astro.profile?.isOnline
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {astro.profile?.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>

                  <div className="flex gap-3">
                    <button
                      className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 transform hover:scale-105"
                      onClick={() => startCall(astro._id, astro.profile?.ratePerMinute)}
                    >
                      <Video size={16} />
                      Video Call
                    </button>
                    <button
                      className="flex-1 bg-white text-orange-600 border-2 border-orange-500 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-50 transition-all flex items-center justify-center gap-2 transform hover:scale-105"
                      onClick={() => startChat(astro._id, astro.profile?.ratePerMinute)}
                    >
                      <MessageCircle size={16} />
                      Chat
                    </button>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-16 text-gray-500">
                <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg">No astrologers available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;