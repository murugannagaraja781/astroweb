const mongoose = require('mongoose');

const systemConfigSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        enum: ['default_chat_rate', 'default_call_rate', 'test_mode_enabled']
    },
    value: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    description: {
        type: String
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Helper method to get config value
systemConfigSchema.statics.getValue = async function (key, defaultValue = null) {
    const config = await this.findOne({ key });
    return config ? config.value : defaultValue;
};

// Helper method to set config value
systemConfigSchema.statics.setValue = async function (key, value, userId = null) {
    return await this.findOneAndUpdate(
        { key },
        {
            value,
            updatedBy: userId,
            updatedAt: new Date()
        },
        { upsert: true, new: true }
    );
};

module.exports = mongoose.model('SystemConfig', systemConfigSchema);
