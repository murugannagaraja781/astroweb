const express = require('express');
const router = express.Router();
const {
    createChatCallRequest,
    getChatCallRequests,
    updateChatCallRequest
} = require('../controllers/chatCallRequestController');
const auth = require('../middleware/auth');

// POST - Create new chat call request
router.post('/', auth, createChatCallRequest);

// GET - Get chat call requests (filtered by user role)
router.get('/', auth, getChatCallRequests);

// PUT - Update chat call request status
router.put('/:sessionId', auth, updateChatCallRequest);

module.exports = router;
