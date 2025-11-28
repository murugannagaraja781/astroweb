const express = require('express');
const router = express.Router();
const { getPublicAstrologers, getPublicAstrologerById, getBanners, getOffers } = require('../controllers/publicController');

router.get('/astrologers', getPublicAstrologers);
router.get('/astrologers/:id', getPublicAstrologerById);
router.get('/banners', getBanners);
router.get('/offers', getOffers);

module.exports = router;
