const User = require('../models/User');
const AstrologerProfile = require('../models/AstrologerProfile');
const Banner = require('../models/Banner');
const Offer = require('../models/Offer');

exports.getPublicAstrologers = async (req, res) => {
    try {
        const astrologers = await User.find({ role: 'astrologer' }).select('name email'); // Select basic info

        const result = await Promise.all(astrologers.map(async (astro) => {
            const profile = await AstrologerProfile.findOne({ userId: astro._id }).select('profileImage languages specialties ratePerMinute isOnline bio experience');
            return {
                _id: astro._id,
                name: astro.name,
                ...profile?._doc,
                userId: astro._id, // Put userId AFTER spread to prevent overwriting
            };
        }));

        res.json(result);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.getBanners = async (req, res) => {
    try {
        const { deviceType = 'all', position = 'home_top' } = req.query;

        const query = { isActive: true };

        // Filter by device type
        if (deviceType !== 'all') {
            query.$or = [
                { deviceType: deviceType },
                { deviceType: 'all' }
            ];
        }

        // Filter by position
        if (position) {
            query.position = position;
        }

        const banners = await Banner.find(query).sort({ priority: -1, createdAt: -1 }).limit(5);
        res.json(banners);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.getOffers = async (req, res) => {
    try {
        const currentDate = new Date();
        const offers = await Offer.find({
            validUntil: { $gte: currentDate }
        }).sort({ createdAt: -1 });
        res.json(offers);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
