const express = require('express');
const router = express.Router();
const { sendOtp } = require('../controllers/otpController');
const { verifyOtp } = require('../controllers/verifyOtp')
router.post('/send', sendOtp);
router.post('/verify', verifyOtp);

module.exports = router;
