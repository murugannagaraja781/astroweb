const CallLog = require('../models/CallLog');
const Wallet = require('../models/Wallet');
const User = require('../models/User');
const AstrologerProfile = require('../models/AstrologerProfile');

exports.requestCall = async (req, res) => {
  const { receiverId, type = 'video' } = req.body;
  const callerId = req.user.id;
  const callerRole = req.user.role;

  console.log('Requesting Call:', { callerId, receiverId, type, role: callerRole });

  try {
    // Validate receiverId
    if (!receiverId || !receiverId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ msg: 'Invalid receiver ID' });
    }

    // Check balance (but don't deduct yet)
    if (callerRole === 'client') {
      const wallet = await Wallet.findOne({ userId: callerId });
      if (!wallet || wallet.balance < 1) {
        return res.status(400).json({ msg: 'Insufficient balance. Minimum ₹1 required.' });
      }
    }

    const newCall = new CallLog({
      callerId: callerId,
      receiverId: receiverId,
      startTime: Date.now(), // Request time
      status: 'requested',
      type: type
    });

    await newCall.save();
    console.log(`✅ Call requested: ${newCall._id}`);

    res.json({ callId: newCall._id, msg: 'Call requested', status: 'requested' });
  } catch (err) {
    console.error('❌ Error in requestCall:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

exports.acceptCall = async (req, res) => {
  const { callId } = req.body;

  try {
    const call = await CallLog.findById(callId);
    if (!call) return res.status(404).json({ msg: 'Call not found' });

    if (call.status !== 'requested') return res.status(400).json({ msg: 'Call already processed' });

    // Billing Logic
    const callerWallet = await Wallet.findOne({ userId: call.callerId });
    if (callerWallet && callerWallet.balance >= 1) {
      // Deduct initial 1 minute
      callerWallet.balance -= 1;
      await callerWallet.save();

      // Update Call
      call.status = 'active';
      call.acceptedTime = new Date();
      await call.save();

      // Create ActiveCall tracker for ongoing billing
      const ActiveCall = require('../models/ActiveCall');
      const activeCall = new ActiveCall({
        callId: call._id,
        callerId: call.callerId,
        receiverId: call.receiverId,
        startTime: call.startTime,
        acceptedTime: new Date(),
        status: 'active',
        rate: 1,
        prepaid: 1
      });
      await activeCall.save();

      res.json({ success: true, callId: call._id, status: 'active' });
    } else {
      return res.status(400).json({ msg: 'Caller has insufficient balance' });
    }
  } catch (err) {
    console.error('❌ Error in acceptCall:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.rejectCall = async (req, res) => {
  const { callId } = req.body;
  try {
    const call = await CallLog.findById(callId);
    if (call) {
      call.status = 'rejected';
      call.endTime = new Date();
      await call.save();
    }
    res.json({ success: true, msg: 'Call rejected' });
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
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

    // Deduct from caller (minus any prepaid amount from ActiveCall)
    const callerWallet = await Wallet.findOne({ userId: callLog.callerId });
    const activeCall = await require('../models/ActiveCall').findOne({ callId: callLog._id });
    const prepaid = activeCall?.prepaid || 0;
    const netCost = Math.max(cost - prepaid, 0);
    callerWallet.balance -= netCost;
    await callerWallet.save();

    // Add to receiver earnings (90%) and consider commission on net amount
    const receiverWallet = await Wallet.findOne({ userId: callLog.receiverId });
    const expertEarning = netCost * 0.9;
    receiverWallet.balance += expertEarning;
    await receiverWallet.save();

    res.json({ msg: 'Call ended', cost, charged: netCost, remainingBalance: callerWallet.balance });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
