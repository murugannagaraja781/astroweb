const express = require('express');
const router = express.Router();
const { getChatHistory, uploadImage, uploadVoiceNote } = require('../controllers/chatController');
const auth = require('../middleware/auth');

// Get chat history between two users
router.get('/history/:userId/:peerId', auth, getChatHistory);

// Upload image for chat
router.post('/upload/image', auth, uploadImage);

// Upload voice note for chat
router.post('/upload/voice', auth, uploadVoiceNote);

module.exports = router;
