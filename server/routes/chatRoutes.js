const express = require("express");
const router = express.Router();
const {
    getChatHistory,
    getChatSessions,
    uploadImage,
    uploadVoiceNote,
    initiateChat,
    endChat,
    saveMessage,
    requestSession,
    getSessionHistory
} = require("../controllers/chatController");

const auth = require("../middleware/auth");

// CHAT
router.post("/initiate", auth, initiateChat);
router.post("/end", auth, endChat);
router.post("/request", auth, requestSession);

// HISTORY + SESSIONS
router.get("/history/:userId/:peerId", auth, getChatHistory);
router.get("/sessions", auth, getChatSessions);
router.get("/history/session/:sessionId", auth, getSessionHistory);

// MEDIA
router.post("/upload/image", auth, uploadImage);
router.post("/upload/voice", auth, uploadVoiceNote);

// FOR MESSAGE SAVE (FROM SOCKET)
router.post("/save", auth, saveMessage);

module.exports = router;
