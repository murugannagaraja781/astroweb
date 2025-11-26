const CallLog = require('../models/CallLog');
const Wallet = require('../models/Wallet');
const User = require('../models/User');
const AstrologerProfile = require('../models/AstrologerProfile');

exports.initiateCall = async (req, res) => {
  const { receiverId, type = 'video' } = req.body;
  const callerId = req.user.id;
  const callerRole = req.user.role;

  console.log('Initiating Call:', { callerId, receiverId, type, role: callerRole });

  try {
    // Validate receiverId
    if (!receiverId || !receiverId.match(/^[0-9a-fA-F]{24}$/)) {
      console.error('Invalid receiver ID:', receiverId);
      return res.status(400).json({ msg: 'Invalid receiver ID' });
    }

    // Admin and Astrologer can call without balance checks
    if (callerRole === 'admin') {
      console.log('✅ Admin user - skipping balance check');
      const newCall = new CallLog({
        callerId: callerId,
        receiverId: receiverId,
        startTime: Date.now(),
        type: type
      });
      await newCall.save();
      return res.json({ callId: newCall._id, msg: 'Call initiated (Admin)' });
    }

    if (callerRole === 'astrologer') {
      console.log('✅ Astrologer user - skipping balance check');
      const newCall = new CallLog({
        callerId: callerId,
        receiverId: receiverId,
        startTime: Date.now(),
        type: type
      });
      await newCall.save();
      return res.json({ callId: newCall._id, msg: 'Call initiated (Astrologer)' });
    }

    // For clients, check balance and astrologer profile
    const wallet = await Wallet.findOne({ userId: callerId });
    const astrologerProfile = await AstrologerProfile.findOne({ userId: receiverId });

    if (!wallet) {
      console.error(`Wallet not found for user ${callerId}`);
      return res.status(404).json({ msg: 'Wallet not found. Please contact support.' });
    }

    console.log(`User ${callerId} balance: ₹${wallet.balance}`);

    if (!astrologerProfile) {
      console.error(`Astrologer not found for receiverId ${receiverId}`);
      return res.status(404).json({ msg: 'Astrologer not found' });
    }

    // Check if user has at least ₹1 balance (₹1 per minute rate)
    if (wallet.balance < 1) {
      console.warn(`Insufficient balance for user ${callerId}: ₹${wallet.balance}`);
      return res.status(400).json({
        msg: 'Insufficient balance. Minimum ₹1 required to start call/chat.',
        balance: wallet.balance
      });
    }

    const newCall = new CallLog({
      callerId: callerId,
      receiverId: receiverId,
      startTime: Date.now(),
      type: type
    });

    await newCall.save();
    console.log(`✅ Call initiated successfully: ${newCall._id}`);

    res.json({ callId: newCall._id, msg: 'Call initiated', balance: wallet.balance });
  } catch (err) {
    console.error('❌ Error in initiateCall:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

exports.getCallHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const calls = await CallLog.find({
      $or: [{ callerId: userId }, { receiverId: userId }]
    })
      .sort({ startTime: -1 })
      .populate('callerId', 'name')
      .populate('receiverId', 'name');

    res.json(calls);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.endCall = async (req, res) => {
  try {
    const { callId } = req.body;
    const callLog = await CallLog.findById(callId);

    if (!callLog) return res.status(404).json({ msg: 'Call log not found' });

    const receiverProfile = await AstrologerProfile.findOne({ userId: callLog.receiverId });

    let duration = 0;
    let cost = 0;

    if (callLog.acceptedTime) {
      // Calculate duration from accepted time
      const endTime = new Date();
      duration = (endTime - new Date(callLog.acceptedTime)) / 1000; // in seconds

      // Fixed rate: ₹1 per minute for all calls/chats
      cost = (duration / 60) * 1;

      callLog.endTime = endTime;
      callLog.duration = duration;
      callLog.cost = cost;
      callLog.status = 'completed';
    } else {
      // Call was never accepted
      callLog.status = 'missed';
      callLog.endTime = new Date();
      callLog.duration = 0;
      callLog.cost = 0;
    }

    await callLog.save();

    // Deduct from caller
    const callerWallet = await Wallet.findOne({ userId: callLog.callerId });
    callerWallet.balance -= cost;
    await callerWallet.save();

    // Add to receiver (optional, or just track earnings)
    const receiverWallet = await Wallet.findOne({ userId: callLog.receiverId });
    receiverWallet.balance += cost;
    await receiverWallet.save();

    res.json({ msg: 'Call ended', cost, remainingBalance: callerWallet.balance });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
