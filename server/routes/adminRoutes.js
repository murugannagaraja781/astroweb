const express = require('express');
const router = express.Router();
const { addAstrologer, removeAstrologer, getAllAstrologers, addHoroscope, getHoroscopes, deleteHoroscope, getStats, getSettings, updateSettings, getOffers, addOffer, deleteOffer, getBanners, addBanner, deleteBanner, getRecentLogins } = require('../controllers/adminController');
const auth = require('../middleware/auth');

// Middleware to check if user is admin
const adminCheck = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Access denied. Admin only.' });
  }
  next();
};

router.post('/astrologer', auth, adminCheck, addAstrologer);
router.delete('/astrologer/:id', auth, adminCheck, removeAstrologer);
router.get('/astrologers', auth, getAllAstrologers);
router.post('/horoscope', auth, adminCheck, addHoroscope);
router.get('/horoscopes', auth, getHoroscopes);
router.delete('/horoscope/:id', auth, adminCheck, deleteHoroscope);
router.get('/stats', auth, adminCheck, getStats);
router.get('/settings', auth, adminCheck, getSettings);
router.post('/settings', auth, adminCheck, updateSettings);

router.get('/offers', auth, adminCheck, getOffers);
router.post('/offers', auth, adminCheck, addOffer);
router.delete('/offers/:id', auth, adminCheck, deleteOffer);

router.get('/banners', auth, adminCheck, getBanners);
router.post('/banners', auth, adminCheck, addBanner);
router.delete('/banners/:id', auth, adminCheck, deleteBanner);

router.get('/recent-logins', auth, adminCheck, getRecentLogins);

module.exports = router;
