const express = require("express");
const router = express.Router();
const ChatCallDetails = require("../models/ChatCallDetails");
const auth = require("../middleware/auth");

// GET chat details for the logged-in user (Astrologer or Client)
router.get("/", auth, async (req, res) => {
  try {
    // Filter by the logged-in user's ID (either as astrologer or client)
    const query = {
      $or: [
        { astrologerId: req.user.id },
        { userId: req.user.id }
      ]
    };

    const records = await ChatCallDetails.find(query)
      .populate("userId", "name email")
      .populate("astrologerId", "name email")
      .sort({ createdAt: -1 });

    res.json(records);
  } catch (err) {
    console.error("Error fetching chat call details:", err);
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
