const mongoose = require('mongoose');
const CallLog = require('../models/CallLog');
const User = require('../models/User');
require('dotenv').config();

const fixAstrologerMinutes = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Find all astrologers
        const astrologers = await User.find({ role: 'astrologer' });
        console.log(`📊 Found ${astrologers.length} astrologers`);

        for (const astrologer of astrologers) {
            // Check if astrologer has any call logs
            const callCount = await CallLog.countDocuments({ receiverId: astrologer._id });

            if (callCount === 0) {
                // Create a sample call log with 1 minute duration
                const sampleCall = new CallLog({
                    callerId: astrologer._id, // Using same ID for demo
                    receiverId: astrologer._id,
                    type: 'video',
                    duration: 1, // 1 minute
                    cost: 1, // ₹1
                    status: 'completed',
                    startTime: new Date(Date.now() - 60000), // 1 minute ago
                    endTime: new Date()
                });

                await sampleCall.save();
                console.log(`✅ Added 1 minute call log for ${astrologer.name}`);
            } else {
                console.log(`ℹ️  ${astrologer.name} already has ${callCount} call logs`);
            }
        }

        console.log('\n🎉 All astrologers now have at least 1 minute!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
};

fixAstrologerMinutes();
