const express = require('express');
const router = express.Router();
const chartController = require('../controllers/chartController');
const authenticateToken = require('../middleware/auth');

// Birth Chart (Public)
router.post('/birth-chart', chartController.generateBirthChart);

// All other chart routes require authentication
router.use(authenticateToken);

// Navamsa Chart
router.post('/navamsa', chartController.generateNavamsaChart);

// Porutham (Compatibility)
router.post('/porutham', chartController.calculatePorutham);

// Behavior Predictions
router.post('/behavior', chartController.generateBehaviorPredictions);

// Complete Report (all charts)
router.post('/complete-report', chartController.generateCompleteReport);

module.exports = router;
