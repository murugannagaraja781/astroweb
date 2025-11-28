// controllers/chatController.js
const ChatMessage = require("../models/ChatMessage");
const ChatSession = require("../models/ChatSession");
const AstrologerProfile = require("../models/AstrologerProfile");
const crypto = require("crypto");
const User = require("../models/User");

/**
 * Get chat history between two users
 */
exports.getChatHistory = async (req, res) => {
  try {
    const { userId, peerId } = req.params;
    const { limit = 50, skip = 0 } = req.query;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ msg: "Unauthorized" });
    }

    // Verify user is authorized
    if (req.user.id !== userId) {
      return res.status(403).json({ msg: "Unauthorized" });
    }

    const roomId = [userId, peerId].sort().join("-");

    const messages = await ChatMessage.find({ roomId })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .populate("sender", "name")
      .populate("receiver", "name");

    const undeliveredMessages = messages.filter(
      (msg) => msg.receiver && msg.receiver._id && msg.receiver._id.toString() === userId && !msg.delivered
    );

    if (undeliveredMessages.length > 0) {
      await ChatMessage.updateMany(
        {
          _id: { $in: undeliveredMessages.map((m) => m._id) },
          receiver: userId,
        },
        {
          delivered: true,
          deliveredAt: new Date(),
        }
      );
    }

    res.json({
      messages: messages.reverse(),
      total: messages.length,
      hasMore: messages.length === parseInt(limit),
    });
  } catch (err) {
    console.error("Error fetching chat history:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

/**
 * Upload image for chat
 */
exports.uploadImage = async (req, res) => {
  try {
    const { base64Image, receiverId } = req.body;
    const senderId = req.user.id;

    if (!base64Image || !receiverId) {
      return res.status(400).json({ msg: "Missing required fields" });
    }

    // In production, upload to S3/Firebase Storage
    const imageUrl = base64Image;

    const roomId = [senderId, receiverId].sort().join("-");
    const message = new ChatMessage({
      sender: senderId,
      receiver: receiverId,
      roomId,
      message: "",
      type: "image",
      mediaUrl: imageUrl,
      timestamp: new Date(),
    });

    await message.save();

    // emit to receiver if connected
    try {
      const io = req.app.get("io");
      if (io) io.to(receiverId.toString()).emit("receiveMessage", { from: senderId, type: "image", mediaUrl: imageUrl, time: new Date() });
    } catch (e) {
      console.warn("Socket emit failed (uploadImage):", e);
    }

    res.json({
      success: true,
      messageId: message._id,
      imageUrl,
    });
  } catch (err) {
    console.error("Error uploading image:", err);
    res.status(500).json({ msg: "Upload failed" });
  }
};

/**
 * Get list of chat sessions (users chatted with)
 */
exports.getChatSessions = async (req, res) => {
  try {
    const userId = req.user.id;

    const messages = await ChatMessage.find({
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .sort({ timestamp: -1 })
      .populate("sender", "name role")
      .populate("receiver", "name role");

    const sessions = {};
    messages.forEach((msg) => {
      const peer =
        msg.sender._id.toString() === userId ? msg.receiver : msg.sender;
      const peerId = peer._id.toString();

      if (!sessions[peerId]) {
        sessions[peerId] = {
          peerId: peerId,
          name: peer.name,
          role: peer.role,
          lastMessage:
            msg.message ||
            (msg.type === "image" ? "📷 Image" : msg.type === "audio" ? "🎤 Voice Note" : ""),
          timestamp: msg.timestamp,
          unreadCount: 0,
        };
      }

      if (msg.receiver._id.toString() === userId && !msg.delivered) {
        sessions[peerId].unreadCount++;
      }
    });

    res.json(Object.values(sessions));
  } catch (err) {
    console.error("Error fetching chat sessions:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

/**
 * Upload voice note for chat
 */
exports.uploadVoiceNote = async (req, res) => {
  try {
    const { base64Audio, duration, receiverId } = req.body;
    const senderId = req.user.id;

    if (!base64Audio || !receiverId || !duration) {
      return res.status(400).json({ msg: "Missing required fields" });
    }

    const audioUrl = base64Audio;

    const roomId = [senderId, receiverId].sort().join("-");
    const message = new ChatMessage({
      sender: senderId,
      receiver: receiverId,
      roomId,
      message: "",
      type: "audio",
      mediaUrl: audioUrl,
      duration: parseInt(duration),
      timestamp: new Date(),
    });

    await message.save();

    try {
      const io = req.app.get("io");
      if (io) io.to(receiverId.toString()).emit("receiveMessage", { from: senderId, type: "audio", mediaUrl: audioUrl, duration: parseInt(duration), time: new Date() });
    } catch (e) {
      console.warn("Socket emit failed (uploadVoiceNote):", e);
    }

    res.json({
      success: true,
      messageId: message._id,
      audioUrl,
      duration,
    });
  } catch (err) {
    console.error("Error uploading voice note:", err);
    res.status(500).json({ msg: "Upload failed" });
  }
};

/**
 * Initiate a chat session
 */
exports.initiateChat = async (req, res) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user.id;

    if (!receiverId) {
      return res.status(400).json({ msg: "Receiver ID is required" });
    }

    const chatId = [senderId, receiverId].sort().join("-");

    res.json({ chatId });
  } catch (err) {
    console.error("Error initiating chat:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

/**
 * End a chat session
 */
exports.endChat = async (req, res) => {
  try {
    res.json({ success: true, msg: "Chat ended" });
  } catch (err) {
    console.error("Error ending chat:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

/**
 * Save a chat message
 */
exports.saveMessage = async (req, res) => {
  try {
    const { roomId, text, type, mediaUrl, duration, receiverId } = req.body;
    const senderId = req.user.id;

    let finalReceiverId = receiverId;

    if (!finalReceiverId && roomId) {
      const parts = roomId.split("-");
      if (parts.length === 2) {
        finalReceiverId = parts[0] === senderId ? parts[1] : parts[0];
      }
    }

    if (!finalReceiverId) {
      return res.status(400).json({ msg: "Receiver ID could not be determined" });
    }

    const message = new ChatMessage({
      sender: senderId,
      receiver: finalReceiverId,
      roomId,
      message: text || "",
      type: type || "text",
      mediaUrl,
      duration,
      timestamp: new Date(),
    });

    await message.save();

    // emit to receiver
    try {
      const io = req.app.get("io");
      if (io) io.to(finalReceiverId.toString()).emit("receiveMessage", { from: senderId, message: message.message, type: message.type, mediaUrl: message.mediaUrl, time: new Date() });
    } catch (e) {
      console.warn("Socket emit failed (saveMessage):", e);
    }

    res.json(message);
  } catch (err) {
    console.error("Error saving message:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

exports.requestSession = async (req, res) => {
  try {
    if (!req.user || !req.user.id) return res.status(401).json({ msg: "Unauthorized" });

    const clientId = req.user.id;
    const { astrologerId } = req.body;
    if (!astrologerId) {
      return res.status(400).json({ msg: "Astrologer ID is required" });
    }
    const sid = crypto.randomUUID();
    let rate = 1;
    const profile = await AstrologerProfile.findOne({ userId: astrologerId });
    if (profile && profile.ratePerMinute) rate = profile.ratePerMinute;

    await ChatSession.create({
      sessionId: sid,
      clientId,
      astrologerId,
      status: "requested",
      ratePerMinute: rate,
    });

    const io = req.app.get("io");
    if (io) {
      // emit to astrologer room (assumes astrologer joined their userId room)
      io.to(astrologerId.toString()).emit("chat:request", {
        sessionId: sid,
        clientId,
        astrologerId,
      });
    } else {
      console.warn("No io available to emit chat:request");
    }

    res.json({ sessionId: sid, ratePerMinute: rate });
  } catch (err) {
    console.error("Error requesting session:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

exports.acceptSession = async (req, res) => {
  try {
    if (!req.user || !req.user.id) return res.status(401).json({ msg: "Unauthorized" });

    const { sessionId } = req.body;
    const astrologerId = req.user.id;

    const session = await ChatSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ msg: "Session not found" });
    }

    if (session.astrologerId.toString() !== astrologerId) {
      return res.status(403).json({ msg: "Unauthorized" });
    }

    if (session.status !== "requested") {
      return res.status(400).json({ msg: "Session is not in requested state" });
    }

    session.status = "active";
    session.startTime = new Date();
    await session.save();

    const io = req.app.get("io");

    // Notify both participants
    if (io) {
      // ensure clients can join by sessionId room on client side (client should emit join_room)
      io.to(sessionId.toString()).emit("chat:joined", { sessionId });
      io.to(session.clientId.toString()).emit("chat:joined", { sessionId });
      io.to(astrologerId.toString()).emit("chat:joined", { sessionId });
    } else {
      console.warn("No io to emit chat:joined");
    }

    res.json({ success: true, sessionId });
  } catch (err) {
    console.error("Error accepting session:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

exports.getSessionHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const s = await ChatSession.findOne({ sessionId });
    if (!s) {
      return res.status(404).json({ msg: "Session not found" });
    }
    if (
      req.user.id !== s.clientId.toString() &&
      req.user.id !== s.astrologerId.toString()
    ) {
      return res.status(403).json({ msg: "Unauthorized" });
    }
    const messages = await ChatMessage.find({ sessionId }).sort({
      timestamp: 1,
    });
    res.json({ sessionId, messages });
  } catch (err) {
    console.error("getSessionHistory error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

exports.getPendingSessions = async (req, res) => {
  try {
    const sessions = await ChatSession.find({
      status: { $in: ["requested", "active"] },
      astrologerId: req.user.id,
    })
      .sort({ createdAt: -1 })
      .lean();

    const userIds = Array.from(
      new Set(
        sessions.flatMap((s) => [
          s.clientId.toString(),
          s.astrologerId.toString(),
        ])
      )
    );

    const users = await User.find({ _id: { $in: userIds } }).select("name").lean();
    const nameMap = new Map(users.map((u) => [u._id.toString(), u.name]));

    const result = sessions.map((s) => ({
      sessionId: s.sessionId,
      status: s.status,
      ratePerMinute: s.ratePerMinute,
      createdAt: s.createdAt,
      client: {
        id: s.clientId.toString(),
        name: nameMap.get(s.clientId.toString()) || "",
      },
      astrologer: {
        id: s.astrologerId.toString(),
        name: nameMap.get(s.astrologerId.toString()) || "",
      },
    }));

    console.log("[DEBUG] getPendingSessions result:", result);
    res.json(result);
  } catch (err) {
    console.error("[DEBUG] getPendingSessions error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};
