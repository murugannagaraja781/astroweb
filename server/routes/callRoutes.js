const express = require('express');
const router = express.Router();
const { initiateCall, endCall, getCallHistory } = require('../controllers/callController');
const auth = require('../middleware/auth');

router.post('/initiate', auth, initiateCall);
router.post('/end', auth, endCall);
router.get('/history', auth, getCallHistory);

module.exports = router;
