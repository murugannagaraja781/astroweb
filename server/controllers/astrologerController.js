const AstrologerProfile = require('../models/AstrologerProfile');

exports.toggleStatus = async (req, res) => {
  try {
    const profile = await AstrologerProfile.findOne({ userId: req.user.id });
    if (!profile) return res.status(404).json({ msg: 'Profile not found' });

    profile.isOnline = !profile.isOnline;
    await profile.save();

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { languages, specialties, ratePerMinute, bio } = req.body;
    const profile = await AstrologerProfile.findOne({ userId: req.user.id });

    if (!profile) return res.status(404).json({ msg: 'Profile not found' });

    if (languages) profile.languages = languages;
    if (specialties) profile.specialties = specialties;
    if (ratePerMinute) profile.ratePerMinute = ratePerMinute;
    if (bio) profile.bio = bio;

    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getProfile = async (req, res) => {
  try {
    const profile = await AstrologerProfile.findOne({ userId: req.user.id });
    if (!profile) return res.status(404).json({ msg: 'Profile not found' });
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
