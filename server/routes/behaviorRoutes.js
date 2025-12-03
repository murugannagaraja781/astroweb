const express = require('express');
const router = express.Router();
const { generateBehaviorAnalysis } = require('../controllers/behaviorController');

// POST /api/behavior/analyze - Generate behavior analysis
router.post('/analyze', generateBehaviorAnalysis);

module.exports = router;
