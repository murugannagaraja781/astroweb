const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { generateToken } = require("../controllers/agoraController");

// GET /api/agora/token?channel=<channel>&uid=<uid>
router.get("/token", auth, generateToken);

module.exports = router;
