const User = require('../models/User');
const AstrologerProfile = require('../models/AstrologerProfile');

exports.getPublicAstrologers = async (req, res) => {
    try {
        const astrologers = await User.find({ role: 'astrologer' }).select('name email'); // Select basic info

        const result = await Promise.all(astrologers.map(async (astro) => {
            const profile = await AstrologerProfile.findOne({ userId: astro._id }).select('profileImage languages specialties ratePerMinute isOnline bio');
            return {
                _id: astro._id,
                name: astro.name,
                ...profile?._doc
            };
        }));

        res.json(result);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
