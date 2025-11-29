const express = require("express");
const router = express.Router();
const ChatCallDetails = require("../models/ChatCallDetails");
const auth = require("../middleware/auth");

// GET all chat call details
router.get("/", auth, async (req, res) => {
  try {
    const records = await ChatCallDetails.find()
      .populate("userId", "name email")
      .populate("astrologerId", "name email")
      .sort({ createdAt: -1 });

    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single record by sessionId
router.get("/:sessionId", auth, async (req, res) => {
  try {
    const record = await ChatCallDetails.findOne({
      sessionId: req.params.sessionId,
    });

    if (!record) return res.status(404).json({ message: "Not found" });

    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
