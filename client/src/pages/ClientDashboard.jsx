import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Wallet, Plus, TrendingUp, Clock, Star, ArrowUpRight, ArrowDownRight, Phone, MessageCircle, Video, CreditCard } from 'lucide-react';
import OnlineAstrologers from '../components/OnlineAstrologers';
import ChatHistoryList from '../components/ChatHistoryList';
import CallHistoryList from '../components/CallHistoryList';
import { useToast } from '../context/ToastContext';

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

  useEffect(() => {
    if (user) {
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

  return (
    <div className="min-h-screen bg-space-900 text-white pb-24 pt-20">
      {/* 1. Wallet & Welcome Card (Glassmorphism) */}
      <div className="px-4 mb-6">
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-purple-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
          {/* Background Decorative Circles */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gold-500/10 rounded-full blur-xl -ml-10 -mb-5"></div>

          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-indigo-100 text-sm font-medium">Total Balance</p>
                <h2 className="text-4xl font-bold text-white mt-1">₹{Number(wallet?.balance || 0).toFixed(0)}</h2>
              </div>
              <button
                onClick={() => setActiveTab('wallet')}
                className="bg-white/20 hover:bg-white/30 p-2 rounded-xl backdrop-blur-md transition-all"
              >
                <Wallet className="w-6 h-6 text-white" />
              </button>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                 onClick={() => { setActiveTab('wallet'); document.getElementById('add-money-section')?.scrollIntoView({ behavior: 'smooth' }); }}
                 className="flex-1 bg-white text-indigo-700 py-3 px-4 rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <Plus size={18} strokeWidth={3} /> Add Money
              </button>
              <button
                 onClick={() => navigate('/transactions')}
                 className="flex-1 bg-indigo-800/50 text-white py-3 px-4 rounded-xl font-semibold text-sm backdrop-blur-md border border-white/10 flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                History
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Quick Links (Stories Style) */}
      <div className="px-4 mb-8">
        <h3 className="text-lg font-semibold text-gray-200 mb-4 px-1">Quick Actions</h3>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
          {[
            { label: 'Horoscope', icon: Star, color: 'from-orange-400 to-red-500', link: '/horoscope/aries' },
            { label: 'Matching', icon: TrendingUp, color: 'from-pink-500 to-rose-500', link: '/match' },
            { label: 'Free Chat', icon: MessageCircle, color: 'from-green-400 to-emerald-600', link: '/astrologers/chat' },
            { label: 'Live', icon: Video, color: 'from-blue-400 to-indigo-600', link: '/astrologers/calls' }
          ].map((item, idx) => (
             <div key={idx} className="snap-start shrink-0 flex flex-col items-center gap-2" onClick={() => navigate(item.link)}>
               <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${item.color} p-[2px] shadow-lg`}>
                 <div className="w-full h-full rounded-full bg-space-800 border-2 border-transparent flex items-center justify-center relative overflow-hidden group">
                    <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-20`}></div>
                    <item.icon className="w-6 h-6 text-white relative z-10" />
                 </div>
               </div>
               <span className="text-xs text-gray-400 font-medium">{item.label}</span>
             </div>
          ))}
        </div>
      </div>

      {/* 3. Featured Astrologers (Horizontal Scroll) */}
      <div className="mb-8">
        <div className="flex justify-between items-end px-4 mb-4">
          <h3 className="text-lg font-semibold text-gray-200">Top Astrologers</h3>
          <button onClick={() => navigate('/astrologers/chat')} className="text-purple-400 text-xs font-semibold">View All</button>
        </div>

        <div className="flex gap-4 overflow-x-auto px-4 pb-8 scrollbar-hide snap-x">
          {astrologers.slice(0, 5).map((astro) => (
            <div key={astro._id} className="snap-center shrink-0 w-64 bg-space-800 rounded-2xl p-4 border border-white/5 shadow-xl relative group">
               <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
                  <div className={`w-2 h-2 rounded-full ${astro.isOnline ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-gray-500'}`}></div>
               </div>
               <div className="flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full border-2 border-purple-500/30 p-1 mb-3">
                     <img src={astro.profileImage || `https://ui-avatars.com/api/?name=${astro.name}&background=random`} alt={astro.name} className="w-full h-full rounded-full object-cover" />
                  </div>
                  <h4 className="font-bold text-white text-lg truncate w-full text-center">{astro.name}</h4>
                  <p className="text-purple-400 text-xs text-center mb-1">{astro.specialties?.slice(0,2).join(', ') || 'Vedic'}</p>
                  <div className="flex items-center gap-1 mb-4">
                     <Star size={12} className="text-yellow-400 fill-yellow-400" />
                     <span className="text-xs text-gray-300 font-medium">4.9</span>
                     <span className="text-[10px] text-gray-500">(120+)</span>
                  </div>
                  <div className="flex gap-2 w-full">
                     <button className="flex-1 bg-white text-space-900 py-2 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors">Chat</button>
                     <button className="flex-1 bg-space-700 text-white py-2 rounded-lg text-xs font-semibold border border-white/10">Call</button>
                  </div>
               </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Recent Activity / Transactions List */}
      <div className="px-4">
        <div className="bg-space-800 rounded-3xl p-6 border border-white/5">
           <h3 className="text-lg font-semibold text-gray-200 mb-4">Recent Activity</h3>
           {transactions.length > 0 ? (
             <div className="space-y-4">
               {transactions.slice(0, 5).map((txn, i) => (
                 <div key={i} className="flex items-center justify-between pb-4 border-b border-white/5 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                       <div className={`p-2.5 rounded-full ${txn.type === 'credit' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                          {txn.type === 'credit' ? <ArrowDownRight size={16} className="text-green-500" /> : <ArrowUpRight size={16} className="text-red-500" />}
                       </div>
                       <div>
                          <p className="text-sm font-medium text-gray-200">{txn.description}</p>
                          <p className="text-xs text-gray-500">{new Date(txn.date).toLocaleDateString()}</p>
                       </div>
                    </div>
                    <span className={`font-bold text-sm ${txn.type === 'credit' ? 'text-green-400' : 'text-gray-300'}`}>
                       {txn.type === 'credit' ? '+' : '-'}₹{txn.amount}
                    </span>
                 </div>
               ))}
             </div>
           ) : (
             <div className="text-center text-gray-500 py-4 text-sm">No recent transactions</div>
           )}
        </div>
      </div>

      {/* Wallet Add Money Form (Hidden/Shown based on tab, but let's keep it accessible via scroll for now or conditionally render) */}
      {/* For simplicity in this mobile dashboard, I'll rely on the modal or separate page for adding money,
          but since logic was inline, I'll add a section id for scrolling */}
      <div id="add-money-section" className="px-4 mt-8 pb-8">
         <h3 className="text-lg font-semibold text-gray-200 mb-4">Add Funds</h3>
         <div className="bg-space-800 rounded-3xl p-6 border border-white/5">
            <div className="grid grid-cols-3 gap-3 mb-4">
                {[100, 200, 500, 1000, 2000, 5000].map(amt => (
                   <button key={amt} onClick={() => setAmount(amt.toString())} className="bg-space-700 hover:bg-purple-900/50 border border-white/5 py-3 rounded-xl text-white font-semibold text-sm transition-colors">
                      ₹{amt}
                   </button>
                ))}
            </div>
            <div className="flex gap-2">
               <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Custom Amount"
                  className="bg-space-900 border border-white/10 rounded-xl px-4 py-3 text-white w-full focus:border-purple-500 outline-none"
               />
               <button
                  onClick={handleAddMoney}
                  disabled={paymentLoading || !amount}
                  className="bg-green-600 px-6 rounded-xl font-bold disabled:opacity-50"
               >
                  {paymentLoading ? '...' : 'Add'}
               </button>
            </div>
         </div>
      </div>

    </div>
  );
};

export default ClientDashboard;