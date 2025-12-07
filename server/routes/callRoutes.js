const express = require('express');
const router = express.Router();
const { requestCall, acceptCall, rejectCall, endCall, getCallHistory } = require('../controllers/callController');
const auth = require('../middleware/auth');

router.post('/request', auth, requestCall);
router.post('/accept', auth, acceptCall);
router.post('/reject', auth, rejectCall);
// router.post('/initiate', auth, initiateCall); // Deprecated
router.post('/end', auth, endCall);
router.get('/history', auth, getCallHistory);

module.exports = router;
