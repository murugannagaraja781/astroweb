const express = require('express');
const router = express.Router();
const { toggleStatus, updateProfile, getProfile } = require('../controllers/astrologerController');
const auth = require('../middleware/auth');

const astrologerCheck = (req, res, next) => {
  if (req.user.role !== 'astrologer') {
    return res.status(403).json({ msg: 'Access denied. Astrologers only.' });
  }
  next();
};

router.put('/status', auth, astrologerCheck, toggleStatus);
router.put('/profile', auth, astrologerCheck, updateProfile);
router.get('/profile', auth, astrologerCheck, getProfile);

module.exports = router;
