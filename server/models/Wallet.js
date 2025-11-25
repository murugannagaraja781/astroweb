const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  balance: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },
  transactions: [{
    amount: { type: Number, required: true },
    type: { type: String, enum: ['credit', 'debit'], required: true },
    description: { type: String, default: '' },
    date: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Wallet', walletSchema);
