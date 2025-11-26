const express = require('express');
const router = express.Router();
const { getDailyHoroscope, getAllDailyHoroscopes, getZodiacSigns } = require('../controllers/horoscopeController');
const { searchPlaces, generateHoroscope, matchCharts } = require('../controllers/astroEngineController');

// Get daily horoscope for specific sign
// GET /api/horoscope/daily?sign=mesham&lang=ta&date=2025-11-24
router.get('/daily', getDailyHoroscope);

// Get all horoscopes for today
// GET /api/horoscope/all?lang=ta&date=2025-11-24
router.get('/all', getAllDailyHoroscopes);

// Get list of zodiac signs
// GET /api/horoscope/signs
router.get('/signs', getZodiacSigns);

// --- Astrology Engine Routes ---

// Search places
// GET /api/horoscope/places?q=Chennai
router.get('/places', searchPlaces);

// Generate Horoscope
// POST /api/horoscope/generate
router.post('/generate', generateHoroscope);

// Match Horoscopes
// POST /api/horoscope/match
router.post('/match', matchCharts);

module.exports = router;
