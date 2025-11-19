const CallLog = require('../models/CallLog');
const Wallet = require('../models/Wallet');
const User = require('../models/User');
const AstrologerProfile = require('../models/AstrologerProfile');

exports.initiateCall = async (req, res) => {
  const { receiverId, type = 'video' } = req.body;
  const callerId = req.user.id;
  console.log('Initiating Call:', { callerId, receiverId, type, user: req.user });

  try {
    // Validate receiverId
    if (!receiverId || !receiverId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ msg: 'Invalid receiver ID' });
    }

    // Check balance
    const wallet = await Wallet.findOne({ userId: callerId });
    const astrologerProfile = await AstrologerProfile.findOne({ userId: receiverId });

    if (!wallet) {
      return res.status(404).json({ msg: 'Wallet not found' });
    }
    if (!astrologerProfile) {
      return res.status(404).json({ msg: 'Astrologer not found' });
    }

    if (wallet.balance < astrologerProfile.ratePerMinute) {
      return res.status(400).json({ msg: `Insufficient balance. Required: ${astrologerProfile.ratePerMinute}` });
    }

    const newCall = new CallLog({
      callerId: callerId,
      receiverId: receiverId,
      startTime: Date.now(),
      type: type
    });

    await newCall.save();

    res.json({ callId: newCall._id, msg: 'Call initiated' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

exports.endCall = async (req, res) => {
  try {
    const { callId, duration } = req.body; // duration in seconds
    const callLog = await CallLog.findById(callId);

    if (!callLog) return res.status(404).json({ msg: 'Call log not found' });

    const receiverProfile = await AstrologerProfile.findOne({ userId: callLog.receiverId });
    const cost = (duration / 60) * receiverProfile.ratePerMinute;

    callLog.endTime = new Date();
    callLog.duration = duration;
    callLog.cost = cost;
    callLog.status = 'completed';
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
