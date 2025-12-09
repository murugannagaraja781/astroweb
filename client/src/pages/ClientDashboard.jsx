import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Wallet, Plus, TrendingUp, Clock, Star, ArrowUpRight, ArrowDownRight, Phone, MessageCircle, Video, CreditCard, User } from 'lucide-react';
import OnlineAstrologers from '../components/OnlineAstrologers';
import ChatHistoryList from '../components/ChatHistoryList';
import CallHistoryList from '../components/CallHistoryList';
import { useToast } from '../context/ToastContext';
import BirthDetailsForm from '../components/BirthDetailsForm';

const ClientDashboard = () => {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [callHistory, setCallHistory] = useState([]);
  const [chatSessions, setChatSessions] = useState([]);
  const [astrologers, setAstrologers] = useState([]);
  const [activeTab, setActiveTab] = useState('wallet');
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [amount, setAmount] = useState(''); // Custom amount input
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [selectedCategory, setSelectedCategory] = useState('all');

  // --- Categories for Filter ---
  const categories = [
    { id: 'all', label: 'All', icon: 'grid' },
    { id: 'love', label: 'Love', icon: 'heart' },
    { id: 'career', label: 'Career', icon: 'briefcase' },
    { id: 'finance', label: 'Finance', icon: 'dollar-sign' },
    { id: 'health', label: 'Health', icon: 'activity' }
  ];

  useEffect(() => {
    if (user) {
      if (!user.birthDetails && activeTab !== 'profile') {
         // Optionally prompt user to complete profile
      }
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [walletRes, callsRes, chatsRes, astroRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/wallet/balance`),
        axios.get(`${import.meta.env.VITE_API_URL}/api/call/history`),
        axios.get(`${import.meta.env.VITE_API_URL}/api/chat/sessions`),
        axios.get(`${import.meta.env.VITE_API_URL}/api/public/astrologers`)
      ]);

      setWallet(walletRes.data);
      setTransactions(walletRes.data.transactions || []);
      setCallHistory(callsRes.data);
      setChatSessions(chatsRes.data);
      setAstrologers(astroRes.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setLoading(false);
    }
  };

  const handleAddMoney = async () => {
    const paymentAmount = parseInt(amount);

    // Validate amount
    if (!paymentAmount || paymentAmount < 50) {
      addToast('Minimum amount is ₹50', 'error');
      return;
    }

    if (paymentAmount > 50000) {
      addToast('Maximum amount is ₹50,000', 'error');
      return;
    }

    try {
      setPaymentLoading(true);
      addToast('Redirecting to PhonePe payment gateway...', 'info');

      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/payment/phonepe/initiate`,
        {
          amount: paymentAmount,
          userId: user.id,
          userName: user.name,
          mobileNumber: user.mobile || '9999999999'
        },
        {
          headers: {
            'x-auth-token': token
          }
        }
      );

      if (res.data.success && res.data.paymentUrl) {
        // Redirect to PhonePe payment page
        window.location.href = res.data.paymentUrl;
      } else {
        addToast('Payment initiation failed', 'error');
        setPaymentLoading(false);
      }

    } catch (error) {
      console.error('Payment error:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Payment failed';
      addToast(`Payment failed: ${errorMsg}`, 'error');
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // --- Redesigned UI ---
  // If loading...
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  // --- Mobile Footer Navigation Items ---
  const navItems = [
    { id: 'wallet', icon: Wallet, label: 'Home' },
    { id: 'chats', icon: MessageCircle, label: 'Chat' },
    { id: 'live', icon: Video, label: 'Live' }, // Placeholder
    { id: 'calls', icon: Phone, label: 'Call' },
    { id: 'history', icon: Clock, label: 'History' }
  ];



  return (
    <div className="min-h-[100dvh] bg-gray-50 font-sans pb-24">
      {/* 1. Yellow Header (Sticky) */}
      <div className="sticky top-0 z-50 bg-[#FFD700] px-4 py-3 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1">
                <ArrowDownRight className="w-5 h-5 text-black rotate-90" /> {/* Back Icon Simulator */}
            </button>
            <h1 className="text-lg font-bold text-black tracking-wide">Rise Astro</h1>
        </div>
        <div className="flex items-center gap-3">
             <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold text-black border border-black/5">
                ₹{Number(wallet?.balance || 0).toFixed(0)}
             </div>
             <button className="p-2 bg-white rounded-full shadow-sm">
                <Plus className="w-4 h-4 text-black" onClick={handleAddMoney} />
             </button>
        </div>
      </div>

      {/* 2. Filter Pills (Horizontal Scroll) */}
      <div className="bg-white px-4 py-3 sticky top-[52px] z-40 shadow-sm border-b border-gray-100 flex gap-3 overflow-x-auto scrollbar-hide">
         {categories.map(cat => (
             <button
               key={cat.id}
               onClick={() => setSelectedCategory(cat.id)}
               className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                 selectedCategory === cat.id
                 ? 'bg-yellow-100 text-yellow-800 border border-yellow-300 shadow-sm'
                 : 'bg-white text-gray-500 border border-gray-200'
               }`}
             >
                {/* Simple icon emulation */}
                {cat.id === 'all' && <div className="grid grid-cols-2 gap-0.5 w-3 h-3"><div className="bg-current rounded-[1px]"></div><div className="bg-current rounded-[1px]"></div><div className="bg-current rounded-[1px]"></div><div className="bg-current rounded-[1px]"></div></div>}
                {cat.label}
             </button>
         ))}
      </div>

      {/* 3. Main Content Area */}
      <div className="px-4 py-4 space-y-4">

        {/* --- Content based on active Tab --- */}
        {activeTab === 'wallet' && (
           <>
              {/* Promo Banner / Featured Astrologers could go here */}

              {/* Astrologer List */}
              <div className="space-y-4">
                 <OnlineAstrologers
                    astrologers={astrologers}
                    filter={selectedCategory}
                    onChat={(id) => navigate(`/chat/${id}`)} // Or initiate logic
                 />
              </div>
           </>
        )}

        {activeTab === 'calls' && (
            <div className="bg-white rounded-2xl p-4 shadow-sm">
                <h3 className="text-lg font-bold mb-4">Call History</h3>
                <CallHistoryList calls={callHistory} userRole={user?.role} />
            </div>
        )}

        {activeTab === 'chats' && (
             <div className="bg-white rounded-2xl p-4 shadow-sm">
                <h3 className="text-lg font-bold mb-4">Chat History</h3>
                <ChatHistoryList sessions={chatSessions} />
             </div>
        )}

        {activeTab === 'history' && (
             <div className="space-y-4">
                 <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <h3 className="text-lg font-bold mb-4">Chat History</h3>
                    <ChatHistoryList sessions={chatSessions} compact />
                 </div>
                 <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <h3 className="text-lg font-bold mb-4">Call History</h3>
                    <CallHistoryList calls={callHistory} userRole={user?.role} />
                 </div>
             </div>
        )}

        {activeTab === 'profile' && (
             <div className="bg-white rounded-2xl p-4 shadow-sm">
                <BirthDetailsForm user={user} onUpdate={() => {
                   fetchData(); // Refresh user data if needed, though context handles user updates usually.
                   window.location.reload(); // Simple reload to refresh context
                }} />
             </div>
        )}

      </div>

      {/* 4. Bottom Navigation (Fixed) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-2 pb-safe z-50 flex justify-between items-center shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
         {navItems.map(item => {
             const isActive = activeTab === item.id || (item.id === 'history' && (activeTab === 'calls' || activeTab === 'chats'));
             return (
                 <button
                   key={item.id}
                   onClick={() => setActiveTab(item.id === 'history' ? 'history' : item.id)}
                   className="flex flex-col items-center gap-1 group"
                 >
                    <div className={`p-1.5 rounded-full transition-all ${isActive ? 'text-purple-600 -translate-y-1' : 'text-gray-400'}`}>
                        <item.icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                    </div>
                    <span className={`text-[10px] font-medium ${isActive ? 'text-purple-600' : 'text-gray-400'}`}>
                        {item.label}
                    </span>
                 </button>
             );
         })}
      </div>
    </div>
  );
};

export default ClientDashboard;