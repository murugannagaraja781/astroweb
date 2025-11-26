const mongoose = require('mongoose');

const activeCallSchema = new mongoose.Schema({
    callId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CallLog',
        required: true,
        unique: true
    },
    callerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    startTime: {
        type: Date,
        required: true
    },
    acceptedTime: {
        type: Date,
        default: null
    },
    lastBillingUpdate: {
        type: Date,
        default: null
    },
    currentDuration: {
        type: Number, // in seconds
        default: 0
    },
    currentCost: {
        type: Number,
        default: 0
    },
    prepaid: {
        type: Number,
        default: 0
    },
    rate: {
        type: Number,
        default: 1 // ₹1 per minute
    },
    status: {
        type: String,
        enum: ['initiated', 'active', 'ended'],
        default: 'initiated'
    }
}, {
    timestamps: true
});

// TTL index - auto-delete after 24 hours
activeCallSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model('ActiveCall', activeCallSchema);
