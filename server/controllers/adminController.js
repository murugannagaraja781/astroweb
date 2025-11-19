const User = require('../models/User');
const AstrologerProfile = require('../models/AstrologerProfile');
const Wallet = require('../models/Wallet');
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
