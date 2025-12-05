const mongoose = require('mongoose');

const chatSessionSchema = new mongoose.Schema({
  sessionId: { type: String, unique: true, index: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  astrologerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['requested', 'active', 'ended'], default: 'requested' },
  ratePerMinute: { type: Number, default: 1 },
  startedAt: { type: Date },
  endedAt: { type: Date },
  duration: { type: Number, default: 0 },
  totalCost: { type: Number, default: 0 },
  intakeDetails: {
    name: { type: String },
    gender: { type: String },
    dateOfBirth: { type: String }, // YYYY-MM-DD
    timeOfBirth: { type: String }, // HH:MM
    placeOfBirth: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    timezone: { type: Number }
  }
}, { timestamps: true });

chatSessionSchema.index({ clientId: 1, astrologerId: 1, createdAt: -1 });

module.exports = mongoose.model('ChatSession', chatSessionSchema);

