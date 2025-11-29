const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
    platformTitle: {
        type: String,
        default: 'AstroSeva'
    },
    platformLogo: {
        type: String,
        default: '🌟'
    },
    primaryColor: {
        type: String,
        default: 'purple'
    },
    currency: {
        type: String,
        default: '₹'
    },
    language: {
        type: String,
        default: 'tamil'
    },
    timezone: {
        type: String,
        default: 'Asia/Kolkata'
    }
}, { timestamps: true });

module.exports = mongoose.model('Settings', SettingsSchema);
