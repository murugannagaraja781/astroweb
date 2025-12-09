const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  phone: { type: String, unique: true, sparse: true },
  role: { type: String, enum: ['admin', 'astrologer', 'client'], default: 'client' },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date },
  birthDetails: {
    year: { type: Number },
    month: { type: Number },
    day: { type: Number },
    hour: { type: Number },
    minute: { type: Number },
    latitude: { type: Number },
    longitude: { type: Number },
    timezone: { type: Number }
  }
});

module.exports = mongoose.model('User', userSchema);
