const express = require('express');
const router = express.Router();
const { getPublicAstrologers, getBanners } = require('../controllers/publicController');

router.get('/astrologers', getPublicAstrologers);
router.get('/banners', getBanners);

module.exports = router;
