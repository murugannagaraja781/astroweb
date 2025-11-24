const mongoose = require('mongoose');

const OfferSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true,
        unique: true
    },
    discount: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ['percentage', 'fixed'],
        default: 'percentage'
    },
    validUntil: {
        type: Date,
        required: true
    },
    description: {
        type: String
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Offer', OfferSchema);
