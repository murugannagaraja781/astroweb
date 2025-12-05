const User = require('../models/User');
const Wallet = require('../models/Wallet');
const AstrologerProfile = require('../models/AstrologerProfile');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/*
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        msg: 'Please provide all required fields',
        missing: {
          name: !name,
          email: !email,
          password: !password,
          role: !role
        }
      });
    }

    // Validate role
    if (!['client', 'astrologer', 'admin'].includes(role)) {
      return res.status(400).json({ msg: 'Invalid role. Must be client, astrologer, or admin' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ msg: 'Invalid email format' });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ msg: 'Password must be at least 6 characters long' });
    }

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      name,
      email,
      password: hashedPassword,
      role
    });

    await user.save();

    // Create Wallet for every user
    const wallet = new Wallet({ userId: user._id });

    // Add ₹101 welcome bonus for new clients
    if (role === 'client') {
      wallet.balance = 101;
      wallet.transactions.push({
        amount: 101,
        type: 'credit',
        description: 'Welcome Bonus',
        date: new Date()
      });
    }

    await wallet.save();

    // If Astrologer, create profile
    if (role === 'astrologer') {
      const profile = new AstrologerProfile({ userId: user._id });
      await profile.save();
    }

    const payload = { user: { id: user._id, role: user.role } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '60d' }, (err, token) => {
      if (err) throw err;
      res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    });

  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};
*/

/*
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    let user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

    user.lastLogin = Date.now();
    await user.save();

    const payload = { user: { id: user._id, role: user.role } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '60d' }, (err, token) => {
      if (err) throw err;
      res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
*/

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    const userObj = user.toObject();
    userObj.id = user._id;
    res.json(userObj);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.logout = async (req, res) => {
  try {
    // In a stateless JWT auth, the server doesn't need to do much.
    // The client handles logout by removing the token.
    res.json({ msg: 'Logged out successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
