import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Wallet, Plus, TrendingUp, Clock, Star, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const ClientDashboard = () => {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({ totalSpent: 0, totalCalls: 0, totalChats: 0 });
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchWalletData();
      fetchStats();
    }
  }, [user]);

  const fetchWalletData = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/wallet/balance`);
      setWallet(res.data);
      setTransactions(res.data.transactions || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching wallet:', err);
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // TODO: Create API endpoint for user stats
      // For now, using mock data
      setStats({
        totalSpent: 0,
        totalCalls: 0,
        totalChats: 0
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleAddMoney = () => {
    alert('Payment gateway integration coming soon! For now, please contact admin to add balance.');
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

        {/* Wallet Balance Card */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 mb-8 text-white">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-indigo-100 text-sm mb-2">Available Balance</p>
              <h2 className="text-5xl font-bold">₹{wallet?.balance || 0}</h2>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <Wallet className="w-8 h-8" />
            </div>
          </div>

          <button
            onClick={handleAddMoney}
            className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-semibold hover:bg-indigo-50 transition-colors flex items-center gap-2 w-full justify-center"
          >
            <Plus className="w-5 h-5" />
            Add Money
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm text-gray-500">All Time</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800">₹{stats.totalSpent}</h3>
            <p className="text-gray-600 text-sm mt-1">Total Spent</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm text-gray-500">Sessions</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800">{stats.totalCalls}</h3>
            <p className="text-gray-600 text-sm mt-1">Video Calls</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Star className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-sm text-gray-500">Messages</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800">{stats.totalChats}</h3>
            <p className="text-gray-600 text-sm mt-1">Chat Sessions</p>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-6">Transaction History</h3>

          {transactions.length > 0 ? (
            <div className="space-y-4">
              {transactions.slice(0, 10).reverse().map((transaction, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${
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
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className={`text-lg font-semibold ${
                    transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 mb-2">No transactions yet</p>
              <p className="text-sm text-gray-500">Your transaction history will appear here</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-indigo-50 rounded-xl p-6 border border-indigo-100">
          <h3 className="font-semibold text-gray-800 mb-4">Need Help?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/')}
              className="bg-white text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <p className="font-medium">Find Astrologers</p>
              <p className="text-sm text-gray-500">Browse available experts</p>
            </button>
            <button
              onClick={handleAddMoney}
              className="bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 transition-colors text-left"
            >
              <p className="font-medium">Add Money</p>
              <p className="text-sm text-indigo-100">Top up your wallet</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;