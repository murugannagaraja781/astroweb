const User = require('../models/User');
const AstrologerProfile = require('../models/AstrologerProfile');
const Wallet = require('../models/Wallet');
const Horoscope = require('../models/Horoscope');
const Settings = require('../models/Settings');
const Offer = require('../models/Offer');
const Banner = require('../models/Banner');
const bcrypt = require('bcryptjs');

exports.addAstrologer = async (req, res) => {
  try {
    const { name, email, password, languages, specialties, ratePerMinute, bio } = req.body;

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      name,
      email,
      password: hashedPassword,
      role: 'astrologer'
    });

    await user.save();

    const wallet = new Wallet({ userId: user._id });
    await wallet.save();

    const profile = new AstrologerProfile({
      userId: user._id,
      languages,
      specialties,
      ratePerMinute,
      bio
    });

    await profile.save();

    res.json({ msg: 'Astrologer added successfully', user });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.removeAstrologer = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    if (user.role !== 'astrologer') {
      return res.status(400).json({ msg: 'User is not an astrologer' });
    }

    await AstrologerProfile.findOneAndDelete({ userId: user._id });
    await Wallet.findOneAndDelete({ userId: user._id });
    await User.findByIdAndDelete(req.params.id);

    res.json({ msg: 'Astrologer removed' });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getAllAstrologers = async (req, res) => {
  try {
    const astrologers = await User.find({ role: 'astrologer' }).select('-password');
    // Fetch profiles for each
    const result = await Promise.all(astrologers.map(async (astro) => {
      const profile = await AstrologerProfile.findOne({ userId: astro._id });
      return { ...astro._doc, profile };
    }));
    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.addHoroscope = async (req, res) => {
  try {
    const { rasi, type, content, date, language } = req.body;

    // Check if horoscope already exists for this date/type/rasi
    let horoscope = await Horoscope.findOne({ rasi, type, date: new Date(date) });

    if (horoscope) {
      // Update existing
      horoscope.content = content;
      horoscope.language = language || 'tamil';
      await horoscope.save();
      return res.json({ msg: 'Horoscope updated successfully', horoscope });
    }

    // Create new
    horoscope = new Horoscope({
      rasi,
      type,
      content,
      date: new Date(date),
      language: language || 'tamil'
    });

    await horoscope.save();
    res.json({ msg: 'Horoscope added successfully', horoscope });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getHoroscopes = async (req, res) => {
  try {
    const horoscopes = await Horoscope.find().sort({ date: -1, createdAt: -1 });
    res.json(horoscopes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.deleteHoroscope = async (req, res) => {
  try {
    await Horoscope.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Horoscope deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalAstrologers = await User.countDocuments({ role: 'astrologer' });

    // Calculate total earnings from all wallets
    const wallets = await Wallet.find();
    const totalEarnings = wallets.reduce((acc, wallet) => acc + (wallet.balance || 0), 0);

    // Calculate today's earnings (placeholder logic - in real app would query transactions)
    // For now, we'll estimate it as a fraction of total or 0 if no transactions exist
    const todayEarnings = 0;

    // Pending requests (placeholder - e.g., astrologers waiting for approval)
    const pendingRequests = 0;

    // Active calls (placeholder)
    const activeCalls = 0;

    res.json({
      totalUsers,
      totalAstrologers,
      totalEarnings,
      activeCalls,
      todayEarnings,
      pendingRequests
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
      await settings.save();
    }
    res.json(settings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const { platformTitle, platformLogo, primaryColor, currency, language, timezone } = req.body;

    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    if (platformTitle) settings.platformTitle = platformTitle;
    if (platformLogo) settings.platformLogo = platformLogo;
    if (primaryColor) settings.primaryColor = primaryColor;
    if (currency) settings.currency = currency;
    if (language) settings.language = language;
    if (timezone) settings.timezone = timezone;

    await settings.save();
    res.json(settings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Offers
exports.getOffers = async (req, res) => {
  try {
    const offers = await Offer.find().sort({ createdAt: -1 });
    res.json(offers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.addOffer = async (req, res) => {
  try {
    const { title, code, discount, type, validUntil, description } = req.body;
    const offer = new Offer({ title, code, discount, type, validUntil, description });
    await offer.save();
    res.json(offer);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.deleteOffer = async (req, res) => {
  try {
    await Offer.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Offer deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Banners
exports.getBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ createdAt: -1 });
    res.json(banners);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.addBanner = async (req, res) => {
  try {
    const { title, subtitle, image, targetUrl, isActive } = req.body;
    const banner = new Banner({ title, subtitle, image, targetUrl, isActive });
    await banner.save();
    res.json(banner);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.deleteBanner = async (req, res) => {
  try {
    await Banner.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Banner deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Recent Logins
exports.getRecentLogins = async (req, res) => {
  try {
    const users = await User.find({ lastLogin: { $exists: true } })
      .sort({ lastLogin: -1 })
      .limit(10)
      .select('name email lastLogin role');

    // Map to match requested format
    const formattedUsers = users.map(user => ({
      name: user.name,
      email: user.email,
      timestamp: user.lastLogin
    }));

    res.json(formattedUsers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// User Management
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).select('-password').sort({ createdAt: -1 });
    // Fetch wallet balance for each user
    const result = await Promise.all(users.map(async (user) => {
      const wallet = await Wallet.findOne({ userId: user._id });
      return { ...user._doc, walletBalance: wallet ? wallet.balance : 0 };
    }));
    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.addMoneyToUser = async (req, res) => {
  try {
    const { userId, amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ msg: 'Please enter a valid amount' });
    }

    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      wallet = new Wallet({ userId });
    }

    wallet.balance += parseInt(amount);

    // Add transaction record
    wallet.transactions.push({
      amount: parseInt(amount),
      type: 'credit',
      description: 'Added by Admin',
      date: new Date()
    });

    await wallet.save();

    res.json({ msg: 'Money added successfully', balance: wallet.balance });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
