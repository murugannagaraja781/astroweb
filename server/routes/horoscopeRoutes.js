const express = require('express');
const router = express.Router();
const { getDailyHoroscope, getAllDailyHoroscopes, getZodiacSigns } = require('../controllers/horoscopeController');

// Get daily horoscope for specific sign
// GET /api/horoscope/daily?sign=mesham&lang=ta&date=2025-11-24
router.get('/daily', getDailyHoroscope);

// Get all horoscopes for today
// GET /api/horoscope/all?lang=ta&date=2025-11-24
router.get('/all', getAllDailyHoroscopes);

// Get list of zodiac signs
// GET /api/horoscope/signs
router.get('/signs', getZodiacSigns);

module.exports = router;
