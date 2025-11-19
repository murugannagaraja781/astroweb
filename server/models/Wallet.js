const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  balance: { type: Number, default: 1000 },
  currency: { type: String, default: 'INR' }
});

module.exports = mongoose.model('Wallet', walletSchema);
