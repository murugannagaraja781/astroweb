const mongoose = require('mongoose');

const astrologerProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  languages: [{ type: String }],
  specialties: [{ type: String }],
  experience: { type: String, default: '' },
  education: { type: String, default: '' },
  ratePerMinute: { type: Number, default: 10 },
  isOnline: { type: Boolean, default: false },
  bio: { type: String, default: '' },
  profileImage: { type: String },
  rating: { type: Number, default: 0 },
  totalSessions: { type: Number, default: 0 },
  lastActive: { type: Date, default: Date.now },
  nickName: { type: String, default: '' },
  aboutMe: { type: String, default: '' },
  offers: { type: String, default: '' },
  chatStatus: { type: String, enum: ['online', 'offline', 'busy'], default: 'offline' },
  callStatus: { type: String, enum: ['online', 'offline', 'busy'], default: 'offline' },
  videoStatus: { type: String, enum: ['online', 'offline', 'busy'], default: 'offline' },
  schedule: [{
    day: { type: String },
    slots: [{ type: String }],
    isAvailable: { type: Boolean, default: false }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('AstrologerProfile', astrologerProfileSchema);

