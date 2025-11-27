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
  const [activeTab, setActiveTab] = useState('wallet'); // wallet, calls, chats
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
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
    // Directly initiate payment with default amount
    const defaultAmount = 500; // Default ₹500

    try {
      setPaymentLoading(true);
      addToast('Redirecting to PhonePe payment gateway...', 'info');

      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/payment/phonepe/initiate`,
        {
          amount: defaultAmount,
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
      addToast(error.response?.data?.error || 'Payment failed', 'error');
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome back, {user?.name}!</h1>
          <p className="text-gray-600">Manage your wallet and view your consultation history</p>
        </div>



        {/* Tabs */}
        <div className="flex gap-4 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setActiveTab('wallet')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
              activeTab === 'wallet'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <Wallet className="w-5 h-5" />
            Wallet & Transactions
          </button>
          <button
            onClick={() => setActiveTab('calls')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
              activeTab === 'calls'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <Phone className="w-5 h-5" />
            Call History
          </button>
          <button
            onClick={() => setActiveTab('chats')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
              activeTab === 'chats'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <MessageCircle className="w-5 h-5" />
            Chat History
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 min-h-[400px]">

          {/* Wallet Tab */}
          {activeTab === 'wallet' && (
            <div className="p-6">
              {/* Balance Card */}
              <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 mb-8 text-white">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-indigo-100 text-sm mb-2">Available Balance</p>
                    <h2 className="text-5xl font-bold">₹{Number(wallet?.balance || 0).toFixed(2)}</h2>
                  </div>
                  <div className="bg-white/20 p-3 rounded-xl">
                    <Wallet className="w-8 h-8" />
                  </div>
                </div>
                <button
                  onClick={handleAddMoney}
                  disabled={paymentLoading}
                  className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-semibold hover:bg-indigo-50 transition-colors flex items-center gap-2 w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {paymentLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                      Redirecting...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      Add ₹500 via PhonePe
                    </>
                  )}
                </button>
              </div>

              <h3 className="text-xl font-semibold text-gray-800 mb-6">Transaction History</h3>
              {transactions.length > 0 ? (
                <div className="space-y-4">
                  {transactions.slice(0, 10).reverse().map((transaction, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${
                          transaction.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {transaction.type === 'credit' ? (
                            <ArrowDownRight className={`w-5 h-5 ${
                              transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                            }`} />
                          ) : (
                            <ArrowUpRight className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{transaction.description || 'Transaction'}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(transaction.date).toLocaleDateString('en-IN', {
                              year: 'numeric', month: 'short', day: 'numeric',
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className={`text-lg font-bold ${
                        transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'credit' ? '+' : '-'}₹{Number(transaction.amount).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">No transactions yet</div>
              )}
            </div>
          )}

          {/* Call History Tab */}
          {activeTab === 'calls' && (
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-6">Call History</h3>
              <CallHistoryList calls={callHistory} userRole={user?.role} />
            </div>
          )}

          {/* Chat History Tab */}
          {activeTab === 'chats' && (
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-6">Chat History</h3>
              <ChatHistoryList sessions={chatSessions} />
            </div>
          )}

        </div>
      </div>


    </div>
  );
};

export default ClientDashboard;