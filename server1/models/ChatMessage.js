const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    roomId: {
        type: String,
        required: true,
        index: true
    },
    sessionId: {
        type: String,
        default: null,
        index: true
    },
    message: {
        type: String,
        default: ''
    },
    type: {
        type: String,
        enum: ['text', 'image', 'audio', 'emoji'],
        default: 'text'
    },
    mediaUrl: {
        type: String,
        default: null
    },
    duration: {
        type: Number, // For audio messages (in seconds)
        default: 0
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    },
    delivered: {
        type: Boolean,
        default: false
    },
    read: {
        type: Boolean,
        default: false
    },
    deliveredAt: {
        type: Date,
        default: null
    },
    readAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Index for efficient queries
chatMessageSchema.index({ roomId: 1, timestamp: -1 });
chatMessageSchema.index({ sender: 1, receiver: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
