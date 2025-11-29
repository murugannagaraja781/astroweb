const AstrologerProfile = require('../models/AstrologerProfile');
const CallLog = require('../models/CallLog');
const Review = require('../models/Review');
const User = require('../models/User');

exports.toggleStatus = async (req, res) => {
  try {
    const profile = await AstrologerProfile.findOne({ userId: req.user.id });
    if (!profile) return res.status(404).json({ msg: 'Profile not found' });

    profile.isOnline = !profile.isOnline;
    profile.lastActive = new Date();
    await profile.save();

    // Emit socket event for real-time update
    const io = req.app.get('io');
    io.emit('astrologerStatusUpdate', {
      astrologerId: req.user.id,
      isOnline: profile.isOnline
    });

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Admin/ID based status toggle
exports.toggleStatusById = async (req, res) => {
  try {
    const { id } = req.params; // astrologer user ID
    const profile = await AstrologerProfile.findOne({ userId: id });
    if (!profile) return res.status(404).json({ msg: 'Profile not found' });

    const { isOnline } = req.body;
    if (typeof isOnline === 'boolean') {
      profile.isOnline = isOnline;
    } else {
      profile.isOnline = !profile.isOnline;
    }
    profile.lastActive = new Date();
    await profile.save();

    const io = req.app.get('io');
    io.emit('astrologerStatusUpdate', {
      astrologerId: id,
      isOnline: profile.isOnline,
    });

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getProfile = async (req, res) => {
  try {
    const profile = await AstrologerProfile.findOne({ userId: req.user.id }).populate('userId', 'name email');
    if (!profile) return res.status(404).json({ msg: 'Profile not found' });
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getProfileById = async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await AstrologerProfile.findOne({ userId: id }).populate('userId', 'name email');
    if (!profile) return res.status(404).json({ msg: 'Profile not found' });
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};


// Get call history
exports.getCallHistory = async (req, res) => {
  try {
    const calls = await CallLog.find({ receiverId: req.user.id })
      .populate('callerId', 'name')
      .sort({ startTime: -1 })
      .limit(50);

    const callHistory = calls.map(call => ({
      callId: call._id,
      userId: call.callerId?._id,
      userName: call.callerId?.name || 'Unknown',
      type: call.type || 'video',
      date: call.startTime,
      duration: call.duration || 0,
      earnings: call.cost || 0,
      status: call.status,
      rating: call.rating || 0
    }));

    res.json(callHistory);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get earnings
exports.getEarnings = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Today's earnings
    const todayEarnings = await CallLog.aggregate([
      {
        $match: {
          receiverId: req.user.id,
          startTime: { $gte: today, $lt: tomorrow },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$cost' }
        }
      }
    ]);

    // Weekly earnings
    const weeklyEarnings = await CallLog.aggregate([
      {
        $match: {
          receiverId: req.user.id,
          startTime: { $gte: startOfWeek },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$cost' }
        }
      }
    ]);

    // Monthly earnings
    const monthlyEarnings = await CallLog.aggregate([
      {
        $match: {
          receiverId: req.user.id,
          startTime: { $gte: startOfMonth },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$cost' }
        }
      }
    ]);

    // Total earnings
    const totalEarnings = await CallLog.aggregate([
      {
        $match: {
          receiverId: req.user.id,
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$cost' }
        }
      }
    ]);

    res.json({
      today: todayEarnings[0]?.total || 0,
      weekly: weeklyEarnings[0]?.total || 0,
      monthly: monthlyEarnings[0]?.total || 0,
      totalEarnings: totalEarnings[0]?.total || 0,
      currency: 'INR'
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get reviews
exports.getReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ astrologerId: req.user.id })
      .populate('userId', 'name')
      .sort({ createdAt: -1 });

    const reviewData = reviews.map(review => ({
      reviewId: review._id,
      userId: review.userId?._id,
      userName: review.userId?.name || 'Anonymous',
      rating: review.rating,
      comment: review.comment,
      date: review.createdAt,
      callId: review.callId
    }));

    res.json(reviewData);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get analytics
exports.getAnalytics = async (req, res) => {
  try {
    const totalCalls = await CallLog.countDocuments({
      receiverId: req.user.id,
      status: 'completed'
    });

    const totalEarnings = await CallLog.aggregate([
      {
        $match: {
          receiverId: req.user.id,
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$cost' }
        }
      }
    ]);

    const avgRating = await Review.aggregate([
      {
        $match: { astrologerId: req.user.id }
      },
      {
        $group: {
          _id: null,
          average: { $avg: '$rating' }
        }
      }
    ]);

    const avgDuration = await CallLog.aggregate([
      {
        $match: {
          receiverId: req.user.id,
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          average: { $avg: '$duration' }
        }
      }
    ]);

    const completedCalls = await CallLog.countDocuments({
      receiverId: req.user.id,
      status: 'completed'
    });

    const totalCallAttempts = await CallLog.countDocuments({
      receiverId: req.user.id
    });

    const successRate = totalCallAttempts > 0 ? (completedCalls / totalCallAttempts) * 100 : 0;

    res.json({
      totalCalls: completedCalls,
      totalEarnings: totalEarnings[0]?.total || 0,
      avgRating: Math.round((avgRating[0]?.average || 0) * 10) / 10,
      avgCallDuration: Math.round((avgDuration[0]?.average || 0) * 10) / 10,
      successRate: Math.round(successRate * 10) / 10
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get schedule
exports.getSchedule = async (req, res) => {
  try {
    const profile = await AstrologerProfile.findOne({ userId: req.user.id });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Default schedule if not set
    const defaultSchedule = [
      { day: "monday", slots: [], isAvailable: false },
      { day: "tuesday", slots: [], isAvailable: false },
      { day: "wednesday", slots: [], isAvailable: false },
      { day: "thursday", slots: [], isAvailable: false },
      { day: "friday", slots: [], isAvailable: false },
      { day: "saturday", slots: [], isAvailable: false },
      { day: "sunday", slots: [], isAvailable: false }
    ];

    const schedule = profile.schedule && profile.schedule.length > 0 ? profile.schedule : defaultSchedule;
    res.json(schedule);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update schedule
exports.updateSchedule = async (req, res) => {
  try {
    const { day, timeSlots } = req.body;

    const profile = await AstrologerProfile.findOne({ userId: req.user.id });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Initialize schedule if not exists
    if (!profile.schedule || profile.schedule.length === 0) {
      profile.schedule = [
        { day: "monday", slots: [], isAvailable: false },
        { day: "tuesday", slots: [], isAvailable: false },
        { day: "wednesday", slots: [], isAvailable: false },
        { day: "thursday", slots: [], isAvailable: false },
        { day: "friday", slots: [], isAvailable: false },
        { day: "saturday", slots: [], isAvailable: false },
        { day: "sunday", slots: [], isAvailable: false }
      ];
    }

    // Update the specific day
    const dayIndex = profile.schedule.findIndex(s => s.day === day);
    if (dayIndex !== -1) {
      profile.schedule[dayIndex].slots = timeSlots;
      profile.schedule[dayIndex].isAvailable = timeSlots.length > 0;
    } else {
      profile.schedule.push({
        day,
        slots: timeSlots,
        isAvailable: timeSlots.length > 0
      });
    }

    await profile.save();
    res.json({ message: 'Schedule updated successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
};
