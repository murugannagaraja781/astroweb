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
    }
}, { timestamps: true });

module.exports = mongoose.model('Banner', BannerSchema);
