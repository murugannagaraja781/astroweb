const express = require('express');
const router = express.Router();
const chartController = require('../controllers/chartController');
const authenticateToken = require('../middleware/auth');

// All chart routes require authentication
router.use(authenticateToken);

// Birth Chart
router.post('/birth-chart', chartController.generateBirthChart);

// Navamsa Chart
router.post('/navamsa', chartController.generateNavamsaChart);

// Porutham (Compatibility)
router.post('/porutham', chartController.calculatePorutham);

// Behavior Predictions
router.post('/behavior', chartController.generateBehaviorPredictions);

// Complete Report (all charts)
router.post('/complete-report', chartController.generateCompleteReport);

module.exports = router;
