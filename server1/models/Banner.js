const mongoose = require('mongoose');

const BannerSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    subtitle: {
        type: String
    },
    image: {
        type: String,
        required: true
    },
    targetUrl: {
        type: String
    },
    isActive: {
        type: Boolean,
        default: true
    },
    deviceType: {
        type: String,
        enum: ['mobile', 'desktop', 'tablet', 'all'],
        default: 'all'
    },
    position: {
        type: String,
        enum: ['home_top', 'home_middle', 'home_bottom', 'dashboard', 'profile'],
        default: 'home_top'
    },
    priority: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('Banner', BannerSchema);

