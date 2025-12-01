const express = require('express');
const router = express.Router();
const { initiatePhonePePayment, phonePeCallback, testPhonePeConfig } = require('../controllers/phonePeController');
const auth = require('../middleware/auth');

// Test PhonePe configuration
router.get('/test', testPhonePeConfig);

// Initiate payment
router.post('/initiate', auth, initiatePhonePePayment);

// Payment callback from PhonePe
router.post('/callback', phonePeCallback);

module.exports = router;
