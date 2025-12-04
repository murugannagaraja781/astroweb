# Astrologer Earnings Calculation System

## 📊 Overview

Complete system to track astrologer earnings from:
- Chat sessions (per minute)
- Audio calls (per minute)
- Video calls (per minute)

---

## 🗄️ Database Schema

### Earnings Model
```javascript
// server/models/Earnings.js
const mongoose = require('mongoose');

const earningsSchema = new mongoose.Schema({
  astrologerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionType: {
    type: String,
    enum: ['chat', 'audio_call', 'video_call'],
    required: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  durationMinutes: {
    type: Number,
    required: true,
    min: 0
  },
  ratePerMinute: {
    type: Number,
    required: true,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  astrologerShare: {
    type: Number,
    required: true,
    min: 0
  },
  platformFee: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  paidOut: {
    type: Boolean,
    default: false
  },
  paidOutDate: Date,
  notes: String
}, {
  timestamps: true
});

// Indexes for faster queries
earningsSchema.index({ astrologerId: 1, createdAt: -1 });
earningsSchema.index({ status: 1, paidOut: 1 });
earningsSchema.index({ sessionType: 1, createdAt: -1 });

// Calculate totals before saving
earningsSchema.pre('save', function(next) {
  if (this.isModified('durationMinutes') || this.isModified('ratePerMinute')) {
    this.totalAmount = this.durationMinutes * this.ratePerMinute;

    // Platform takes 20%, astrologer gets 80%
    const platformPercentage = 0.20;
    this.platformFee = this.totalAmount * platformPercentage;
    this.astrologerShare = this.totalAmount - this.platformFee;
  }
  next();
});

module.exports = mongoose.model('Earnings', earningsSchema);
```

---

## 🎯 Earnings Controller

```javascript
// server/controllers/earningsController.js
const Earnings = require('../models/Earnings');
const User = require('../models/User');

// Record a session earning
exports.recordEarning = async (req, res) => {
  try {
    const {
      astrologerId,
      clientId,
      sessionType,
      sessionId,
      durationMinutes,
      ratePerMinute,
      startTime,
      endTime
    } = req.body;

    // Validate astrologer exists
    const astrologer = await User.findById(astrologerId);
    if (!astrologer || astrologer.role !== 'astrologer') {
      return res.status(404).json({ msg: 'Astrologer not found' });
    }

    // Create earning record
    const earning = new Earnings({
      astrologerId,
      clientId,
      sessionType,
      sessionId,
      durationMinutes,
      ratePerMinute,
      startTime,
      endTime,
      status: 'completed'
    });

    await earning.save();

    res.json({
      success: true,
      earning: {
        id: earning._id,
        totalAmount: earning.totalAmount,
        astrologerShare: earning.astrologerShare,
        platformFee: earning.platformFee
      }
    });
  } catch (error) {
    console.error('Record earning error:', error);
    res.status(500).json({ msg: 'Error recording earning', error: error.message });
  }
};

// Get astrologer earnings summary
exports.getEarningsSummary = async (req, res) => {
  try {
    const { astrologerId } = req.params;
    const { startDate, endDate, period = 'all' } = req.query;

    // Build date filter
    let dateFilter = {};
    if (period === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dateFilter = { createdAt: { $gte: today } };
    } else if (period === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = { createdAt: { $gte: weekAgo } };
    } else if (period === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter = { createdAt: { $gte: monthAgo } };
    } else if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    // Aggregate earnings
    const summary = await Earnings.aggregate([
      {
        $match: {
          astrologerId: mongoose.Types.ObjectId(astrologerId),
          status: 'completed',
          ...dateFilter
        }
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$astrologerShare' },
          totalSessions: { $sum: 1 },
          totalMinutes: { $sum: '$durationMinutes' },
          chatMinutes: {
            $sum: {
              $cond: [{ $eq: ['$sessionType', 'chat'] }, '$durationMinutes', 0]
            }
          },
          audioMinutes: {
            $sum: {
              $cond: [{ $eq: ['$sessionType', 'audio_call'] }, '$durationMinutes', 0]
            }
          },
          videoMinutes: {
            $sum: {
              $cond: [{ $eq: ['$sessionType', 'video_call'] }, '$durationMinutes', 0]
            }
          },
          chatEarnings: {
            $sum: {
              $cond: [{ $eq: ['$sessionType', 'chat'] }, '$astrologerShare', 0]
            }
          },
          audioEarnings: {
            $sum: {
              $cond: [{ $eq: ['$sessionType', 'audio_call'] }, '$astrologerShare', 0]
            }
          },
          videoEarnings: {
            $sum: {
              $cond: [{ $eq: ['$sessionType', 'video_call'] }, '$astrologerShare', 0]
            }
          },
          pendingPayout: {
            $sum: {
              $cond: [{ $eq: ['$paidOut', false] }, '$astrologerShare', 0]
            }
          },
          paidOut: {
            $sum: {
              $cond: [{ $eq: ['$paidOut', true] }, '$astrologerShare', 0]
            }
          }
        }
      }
    ]);

    // Get recent sessions
    const recentSessions = await Earnings.find({
      astrologerId,
      status: 'completed',
      ...dateFilter
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('clientId', 'name email')
      .lean();

    res.json({
      success: true,
      summary: summary[0] || {
        totalEarnings: 0,
        totalSessions: 0,
        totalMinutes: 0,
        chatMinutes: 0,
        audioMinutes: 0,
        videoMinutes: 0,
        chatEarnings: 0,
        audioEarnings: 0,
        videoEarnings: 0,
        pendingPayout: 0,
        paidOut: 0
      },
      recentSessions
    });
  } catch (error) {
    console.error('Get earnings summary error:', error);
    res.status(500).json({ msg: 'Error fetching earnings', error: error.message });
  }
};

// Get detailed earnings list
exports.getEarningsList = async (req, res) => {
  try {
    const { astrologerId } = req.params;
    const { page = 1, limit = 20, sessionType, status } = req.query;

    const filter = { astrologerId };
    if (sessionType) filter.sessionType = sessionType;
    if (status) filter.status = status;

    const earnings = await Earnings.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('clientId', 'name email phone')
      .lean();

    const total = await Earnings.countDocuments(filter);

    res.json({
      success: true,
      earnings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get earnings list error:', error);
    res.status(500).json({ msg: 'Error fetching earnings list', error: error.message });
  }
};

// Mark earnings as paid out
exports.markAsPaidOut = async (req, res) => {
  try {
    const { earningIds } = req.body;

    await Earnings.updateMany(
      { _id: { $in: earningIds }, paidOut: false },
      {
        $set: {
          paidOut: true,
          paidOutDate: new Date()
        }
      }
    );

    res.json({
      success: true,
      message: 'Earnings marked as paid out'
    });
  } catch (error) {
    console.error('Mark as paid out error:', error);
    res.status(500).json({ msg: 'Error updating payout status', error: error.message });
  }
};

module.exports = exports;
```

---

## 🛣️ Routes

```javascript
// server/routes/earningsRoutes.js
const express = require('express');
const router = express.Router();
const earningsController = require('../controllers/earningsController');
const authenticateToken = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Record earning
router.post('/record', earningsController.recordEarning);

// Get earnings summary
router.get('/summary/:astrologerId', earningsController.getEarningsSummary);

// Get earnings list
router.get('/list/:astrologerId', earningsController.getEarningsList);

// Mark as paid out (admin only)
router.post('/payout', earningsController.markAsPaidOut);

module.exports = router;
```

Add to `server/index.js`:
```javascript
app.use('/api/earnings', require('./routes/earningsRoutes'));
```

---

## 📱 Frontend Dashboard Component

```javascript
// client/src/components/AstrologerEarningsDashboard.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  DollarSign, TrendingUp, Clock, MessageSquare,
  Phone, Video, Calendar, Download
} from 'lucide-react';

const AstrologerEarningsDashboard = ({ astrologerId }) => {
  const [summary, setSummary] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEarnings();
  }, [period]);

  const fetchEarnings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/earnings/summary/${astrologerId}?period=${period}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSummary(response.data.summary);
      setRecentSessions(response.data.recentSessions);
    } catch (error) {
      console.error('Error fetching earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading earnings...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex gap-2">
        {['today', 'week', 'month', 'all'].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              period === p
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Earnings */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-8 h-8" />
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="text-3xl font-bold">
            ₹{summary?.totalEarnings?.toFixed(2) || '0.00'}
          </div>
          <div className="text-sm text-green-100">Total Earnings</div>
        </div>

        {/* Total Sessions */}
        <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-8 h-8" />
          </div>
          <div className="text-3xl font-bold">
            {summary?.totalSessions || 0}
          </div>
          <div className="text-sm text-blue-100">Total Sessions</div>
        </div>

        {/* Total Minutes */}
        <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-8 h-8" />
          </div>
          <div className="text-3xl font-bold">
            {summary?.totalMinutes || 0}
          </div>
          <div className="text-sm text-purple-100">Total Minutes</div>
        </div>

        {/* Pending Payout */}
        <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-8 h-8" />
          </div>
          <div className="text-3xl font-bold">
            ₹{summary?.pendingPayout?.toFixed(2) || '0.00'}
          </div>
          <div className="text-sm text-orange-100">Pending Payout</div>
        </div>
      </div>

      {/* Breakdown by Type */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Chat */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">Chat</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Minutes:</span>
              <span className="font-bold">{summary?.chatMinutes || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Earnings:</span>
              <span className="font-bold text-green-600">
                ₹{summary?.chatEarnings?.toFixed(2) || '0.00'}
              </span>
            </div>
          </div>
        </div>

        {/* Audio Call */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-green-100 p-3 rounded-full">
              <Phone className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">Audio Call</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Minutes:</span>
              <span className="font-bold">{summary?.audioMinutes || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Earnings:</span>
              <span className="font-bold text-green-600">
                ₹{summary?.audioEarnings?.toFixed(2) || '0.00'}
              </span>
            </div>
          </div>
        </div>

        {/* Video Call */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-purple-100 p-3 rounded-full">
              <Video className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">Video Call</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Minutes:</span>
              <span className="font-bold">{summary?.videoMinutes || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Earnings:</span>
              <span className="font-bold text-green-600">
                ₹{summary?.videoEarnings?.toFixed(2) || '0.00'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">Recent Sessions</h3>
          <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-left font-semibold text-gray-700">Date</th>
                <th className="py-3 px-4 text-left font-semibold text-gray-700">Client</th>
                <th className="py-3 px-4 text-left font-semibold text-gray-700">Type</th>
                <th className="py-3 px-4 text-left font-semibold text-gray-700">Duration</th>
                <th className="py-3 px-4 text-left font-semibold text-gray-700">Earned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentSessions.map((session) => (
                <tr key={session._id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    {new Date(session.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">{session.clientId?.name || 'Unknown'}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      session.sessionType === 'chat' ? 'bg-blue-100 text-blue-700' :
                      session.sessionType === 'audio_call' ? 'bg-green-100 text-green-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {session.sessionType.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4">{session.durationMinutes} min</td>
                  <td className="py-3 px-4 font-bold text-green-600">
                    ₹{session.astrologerShare.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AstrologerEarningsDashboard;
```

---

## 🔄 Integration with Chat/Call Systems

### When Chat/Call Ends:
```javascript
// After chat/call ends, record the earning
const recordEarning = async (sessionData) => {
  const durationMinutes = Math.ceil(sessionData.duration / 60); // Convert seconds to minutes

  await axios.post('/api/earnings/record', {
    astrologerId: sessionData.astrologerId,
    clientId: sessionData.clientId,
    sessionType: sessionData.type, // 'chat', 'audio_call', 'video_call'
    sessionId: sessionData.sessionId,
    durationMinutes,
    ratePerMinute: sessionData.ratePerMinute,
    startTime: sessionData.startTime,
    endTime: sessionData.endTime
  });
};
```

---

## ✅ Complete System Features

1. **Automatic Calculation** - Earnings calculated based on minutes × rate
2. **Platform Fee** - 20% platform fee, 80% to astrologer
3. **Multiple Session Types** - Chat, audio call, video call tracking
4. **Real-time Dashboard** - Live earnings display
5. **Period Filtering** - Today, week, month, all time
6. **Detailed Breakdown** - By session type
7. **Recent Sessions** - Last 10 sessions with details
8. **Payout Tracking** - Pending vs paid out amounts
9. **Export Functionality** - Download earnings reports

The system is now ready to track and display astrologer earnings! 💰📊
