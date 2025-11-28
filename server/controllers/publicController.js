const User = require('../models/User');
const AstrologerProfile = require('../models/AstrologerProfile');
const Banner = require('../models/Banner');
const Offer = require('../models/Offer');

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

exports.getPublicAstrologerById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).select('name email role');

        if (!user || user.role !== 'astrologer') {
            return res.status(404).json({ msg: 'Astrologer not found' });
        }

        const profile = await AstrologerProfile.findOne({ userId: id }).select('profileImage languages specialties ratePerMinute isOnline bio experience education rating totalSessions reviews');

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            ...profile?._doc
        });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Astrologer not found' });
        }
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
