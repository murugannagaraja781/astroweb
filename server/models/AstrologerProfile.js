const mongoose = require('mongoose');

const astrologerProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  languages: [{ type: String }],
  specialties: [{ type: String }],
  experience: { type: Number, default: 0 },
  ratePerMinute: { type: Number, default: 10 },
  isOnline: { type: Boolean, default: false },
  bio: { type: String },
  profileImage: { type: String }
});

module.exports = mongoose.model('AstrologerProfile', astrologerProfileSchema);
