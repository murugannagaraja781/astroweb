const express = require('express');
const router = express.Router();
const { getPublicAstrologers, getBanners, getOffers, getSettings } = require('../controllers/publicController');

router.get('/astrologers', getPublicAstrologers);
router.get('/banners', getBanners);
router.get('/offers', getOffers);
router.get('/settings', getSettings);

module.exports = router;
