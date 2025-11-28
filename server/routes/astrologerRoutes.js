const express = require('express');
const router = express.Router();
const {
  toggleStatus,
  toggleStatusById,
  updateProfile,
  getProfile,
  getCallHistory,
  getEarnings,
  getReviews,
  getAnalytics,
  getSchedule,
  updateSchedule
} = require('../controllers/astrologerController');
const auth = require('../middleware/auth');

const astrologerCheck = (req, res, next) => {
  if (req.user.role !== 'astrologer') {
    return res.status(403).json({ msg: 'Access denied. Astrologers only.' });
  }
  next();
};

// Profile routes
router.get('/profile', auth, astrologerCheck, getProfile);
router.put('/profile', auth, astrologerCheck, updateProfile);
router.put('/status', auth, astrologerCheck, toggleStatus);
router.put('/profile/:id/status', auth, astrologerCheck, toggleStatusById);

// Dashboard data routes
router.get('/call-history', auth, astrologerCheck, getCallHistory);
router.get('/earnings', auth, astrologerCheck, getEarnings);
router.get('/reviews', auth, astrologerCheck, getReviews);
router.get('/analytics', auth, astrologerCheck, getAnalytics);

// Schedule routes
router.get('/schedule', auth, astrologerCheck, getSchedule);
router.put('/schedule', auth, astrologerCheck, updateSchedule);

module.exports = router;

