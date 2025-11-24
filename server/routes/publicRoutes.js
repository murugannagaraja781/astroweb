const express = require('express');
const router = express.Router();
const { getPublicAstrologers } = require('../controllers/publicController');

router.get('/astrologers', getPublicAstrologers);

module.exports = router;
