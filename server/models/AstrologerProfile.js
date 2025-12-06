const mongoose = require('mongoose');

const astrologerProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  languages: [{ type: String }],
  specialties: [{ type: String }],
  experience: { type: String, default: '' },
  education: { type: String, default: '' },
  ratePerMinute: { type: Number, default: 10 },
  isOnline: { type: Boolean, default: false },
  isChatEnabled: { type: Boolean, default: true },
  isCallEnabled: { type: Boolean, default: true },
  isVideoEnabled: { type: Boolean, default: true },
  bio: { type: String, default: '' },
  profileImage: { type: String },
  rating: { type: Number, default: 0 },
  totalSessions: { type: Number, default: 0 },
  lastActive: { type: Date, default: Date.now },
  schedule: [{
    day: { type: String },
    slots: [{ type: String }],
    isAvailable: { type: Boolean, default: false }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('AstrologerProfile', astrologerProfileSchema);

