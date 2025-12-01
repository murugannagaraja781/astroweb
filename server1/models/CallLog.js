const mongoose = require('mongoose');

const callLogSchema = new mongoose.Schema({
  callerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startTime: { type: Date },
  endTime: { type: Date },
  duration: { type: Number, default: 0 }, // in seconds
  cost: { type: Number, default: 0 },
  status: { type: String, enum: ['ongoing', 'completed', 'missed'], default: 'ongoing' },
  type: { type: String, enum: ['video', 'chat'], default: 'video' }
});

module.exports = mongoose.model('CallLog', callLogSchema);
