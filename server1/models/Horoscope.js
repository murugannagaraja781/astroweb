const mongoose = require('mongoose');

const horoscopeSchema = new mongoose.Schema({
    rasi: { type: String, required: true }, // Zodiac sign
    type: { type: String, enum: ['daily', 'monthly', 'yearly'], required: true },
    content: { type: String, required: true },
    date: { type: Date, required: true },
    language: { type: String, default: 'tamil' },
    createdAt: { type: Date, default: Date.now }
});

// Compound index to ensure uniqueness for a specific rasi, type, and date
horoscopeSchema.index({ rasi: 1, type: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Horoscope', horoscopeSchema);
