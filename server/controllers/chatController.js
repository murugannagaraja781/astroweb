const ChatMessage = require("../models/ChatMessage");
const ChatSession = require("../models/ChatSession");
const AstrologerProfile = require("../models/AstrologerProfile");
const crypto = require("crypto");
const User = require("../models/User");
const mongoose = require("mongoose");

/**
 * Get chat history between two users
 */
exports.getChatHistory = async (req, res) => {
  try {
    const { userId, peerId } = req.params;
    const { limit = 50, skip = 0 } = req.query;

    // Verify user is authorized
    if (req.user.id !== userId) {
      return res.status(403).json({ msg: "Unauthorized" });
    }

    // Create room ID (consistent sorting)
    const roomId = [userId, peerId].sort().join("-");

    // Fetch messages
    const messages = await ChatMessage.find({ roomId })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .populate("sender", "name")
      .populate("receiver", "name");

    // Mark messages as delivered if they're for this user
    const undeliveredMessages = messages.filter(
      (msg) => msg.receiver.toString() === userId && !msg.delivered
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
    // For now, we'll store base64 (not recommended for production)
    const imageUrl = base64Image; // Replace with actual cloud URL

    // Create message
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

    // Find all messages where user is sender or receiver
    const messages = await ChatMessage.find({
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .sort({ timestamp: -1 })
      .populate("sender", "name role")
      .populate("receiver", "name role");

    // Group by peer
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
            (msg.type === "image" ? "📷 Image" : "🎤 Voice Note"),
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

    // In production, upload to S3/Firebase Storage
    // For now, we'll store base64 (not recommended for production)
    const audioUrl = base64Audio; // Replace with actual cloud URL

    // Create message
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

    // Create a consistent room ID
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
    // In a more complex app, we might update a session status here
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

    // If receiverId is not provided, try to extract from roomId
    if (!finalReceiverId && roomId) {
      const parts = roomId.split("-");
      if (parts.length === 2) {
        finalReceiverId = parts[0] === senderId ? parts[1] : parts[0];
      }
    }

    if (!finalReceiverId) {
      return res
        .status(400)
        .json({ msg: "Receiver ID could not be determined" });
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
    res.json(message);
  } catch (err) {
    console.error("Error saving message:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

exports.requestSession = async (req, res) => {
  try {
    const clientId = req.user.id;
    const { astrologerId } = req.body;
    console.log(`[DEBUG] requestSession: clientId=${clientId}, astrologerId=${astrologerId}`);

    if (!astrologerId) {
      return res.status(400).json({ msg: "Astrologer ID is required" });
    }
    const sid = crypto.randomUUID();
    let rate = 1;
    const profile = await AstrologerProfile.findOne({ userId: astrologerId });
    if (profile && profile.ratePerMinute) rate = profile.ratePerMinute;

    const newSession = await ChatSession.create({
      sessionId: sid,
      clientId,
      astrologerId,
      status: "requested",
      ratePerMinute: rate,
    });
    console.log(`[DEBUG] Session created: ${JSON.stringify(newSession)}`);

    res.json({ sessionId: sid, ratePerMinute: rate });
  } catch (err) {
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
    const clientId = s.clientId ? s.clientId.toString() : null;
    const astrologerId = s.astrologerId ? s.astrologerId.toString() : null;

    // TEMPORARY: Allow all authenticated users to access chat history for development
    // TODO: Re-enable proper authorization in production
    /*
    const isAuthorized =
      req.user.role === 'admin' ||
      req.user.id === clientId ||
      req.user.id === astrologerId ||
      (req.user.role === 'astrologer' && !astrologerId) ||
      (req.user.role === 'client' && req.user.id === clientId);

    if (!isAuthorized) {
      console.log(`[DEBUG] Unauthorized access to session history. User: ${req.user.id}, Role: ${req.user.role}, Client: ${clientId}, Astrologer: ${astrologerId}`);
      return res.status(403).json({
        msg: "Unauthorized",
        debug: {
          currentUserId: req.user.id,
          currentUserRole: req.user.role,
          sessionClientId: clientId,
          sessionAstrologerId: astrologerId
        }
      });
    }
    */
    const messages = await ChatMessage.find({ sessionId }).sort({
      timestamp: 1,
    });
    res.json({ sessionId, messages });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

exports.getPendingSessions = async (req, res) => {
  try {
    const astrologerId = new mongoose.Types.ObjectId(req.user.id);
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const sessions = await ChatSession.find({
      status: { $in: ["requested", "active"] },
      createdAt: { $gte: twentyFourHoursAgo }
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

    const users = await User.find({ _id: { $in: userIds } })
      .select("name")
      .lean();
    const nameMap = new Map(users.map((u) => [u._id.toString(), u.name]));

    // Patch: Also check AstrologerProfile for IDs (in case Profile ID was stored instead of User ID)
    const profiles = await AstrologerProfile.find({ _id: { $in: userIds } }).populate('userId', 'name').lean();
    profiles.forEach(p => {
      if (p.userId && p.userId.name) {
        nameMap.set(p._id.toString(), p.userId.name);
      }
    });

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

    res.json(result);
  } catch (err) {
    console.error("Error fetching pending sessions:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

exports.storeChatCall = async (req, res) => {
  try {
    const { userId, astrologerId, sessionId, initiatedAt } = req.body;

    // Validate required fields
    if (!sessionId || !userId || !astrologerId) {
      return res.status(400).json({ msg: "Missing required fields" });
    }

    // Find existing session or create new one if not found (though it should exist from requestSession)
    let session = await ChatSession.findOne({ sessionId });

    if (session) {
      // Update existing session
      session.status = 'active';
      session.startedAt = initiatedAt || new Date();
      await session.save();
    } else {
      // Create new session (fallback)
      session = await ChatSession.create({
        sessionId,
        clientId: userId,
        astrologerId,
        status: 'active',
        startedAt: initiatedAt || new Date()
      });
    }

    res.json({ success: true, session });
  } catch (err) {
    console.error("Error storing chat call:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

exports.getChatCall = async (req, res) => {
  try {
    const { sessionId } = req.query;

    if (sessionId) {
      const session = await ChatSession.findOne({ sessionId })
        .populate('clientId', 'name email')
        .populate('astrologerId', 'name');

      if (!session) {
        return res.status(404).json({ msg: "Session not found" });
      }
      return res.json(session);
    }

    // If no sessionId, return all sessions for the user (astrologer or client)
    const sessions = await ChatSession.find({
      $or: [
        { astrologerId: req.user.id },
        { clientId: req.user.id }
      ]
    })
      .sort({ createdAt: -1 })
      .populate('clientId', 'name email')
      .populate('astrologerId', 'name');

    res.json(sessions);
  } catch (err) {
    console.error("Error retrieving chat call:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

/**
 * Accept chat session and deduct wallet balance
 */
exports.acceptChatSession = async (req, res) => {
  try {
    const { sessionId, clientId, ratePerMinute } = req.body;

    if (!sessionId || !clientId || !ratePerMinute) {
      return res.status(400).json({ msg: "Missing required fields" });
    }

    // Find the session
    const session = await ChatSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ msg: "Session not found" });
    }

    if (session.status !== 'requested') {
      return res.status(400).json({ msg: "Session already accepted or completed" });
    }

    // Find the client user
    const client = await User.findById(clientId);
    if (!client) {
      return res.status(404).json({ msg: "Client not found" });
    }

    // Check if client has sufficient balance (minimum 1 rupee)
    if (client.walletBalance < 1) {
      return res.status(400).json({ msg: "Insufficient wallet balance. Minimum ₹1 required." });
    }

    // Deduct initial amount (1 minute worth)
    const initialDeduction = ratePerMinute;

    if (client.walletBalance < initialDeduction) {
      return res.status(400).json({ msg: `Insufficient balance. Need at least ₹${initialDeduction}` });
    }

    // Update client wallet
    client.walletBalance -= initialDeduction;
    await client.save();

    // Update session status
    session.status = 'active';
    session.startedAt = new Date();
    session.initialDeduction = initialDeduction;
    await session.save();

    res.json({
      success: true,
      msg: `Session accepted. ₹${initialDeduction} deducted from client wallet.`,
      session,
      remainingBalance: client.walletBalance
    });
  } catch (err) {
    console.error("Error accepting chat session:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

/**
 * Reject and delete a chat session
 */
exports.rejectChatSession = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const userId = req.user.id;

    if (!sessionId) {
      return res.status(400).json({ msg: "Session ID is required" });
    }

    // Find the session
    const session = await ChatSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ msg: "Session not found" });
    }

    // Verify authorization (only astrologer or client involved can reject/cancel)
    console.log(`[DEBUG] Rejecting Session: ${sessionId}`);
    console.log(`[DEBUG] User ID: ${userId}`);
    console.log(`[DEBUG] Session Astrologer ID: ${session.astrologerId}`);
    console.log(`[DEBUG] Session Client ID: ${session.clientId}`);

    if (
      session.astrologerId.toString() !== userId &&
      session.clientId.toString() !== userId
    ) {
      console.log("[DEBUG] Unauthorized rejection attempt");
      return res.status(403).json({ msg: "Unauthorized" });
    }

    // Delete the session
    await ChatSession.deleteOne({ sessionId });

    res.json({ success: true, msg: "Chat session rejected and removed" });
  } catch (err) {
    console.error("Error rejecting chat session:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

/**
 * Get session information with participant details
 */
exports.getSessionInfo = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await ChatSession.findOne({ sessionId })
      .populate('clientId', 'name')
      .populate('astrologerId', 'name');

    if (!session) {
      return res.status(404).json({ msg: 'Session not found' });
    }

    // Verify user is authorized to view this session
    const clientId = session.clientId ? session.clientId._id.toString() : null;
    const astrologerId = session.astrologerId ? session.astrologerId._id.toString() : null;

    // TEMPORARY: Allow all authenticated users to access session info for development
    // TODO: Re-enable proper authorization in production
    /*
    const isAuthorized =
      req.user.role === 'admin' ||
      req.user.id === clientId ||
      req.user.id === astrologerId ||
      (req.user.role === 'astrologer' && !astrologerId) ||
      (req.user.role === 'client' && req.user.id === clientId);

    if (!isAuthorized) {
      console.log(`[DEBUG] Unauthorized access to session info. User: ${req.user.id}, Role: ${req.user.role}, Client: ${clientId}, Astrologer: ${astrologerId}`);
      return res.status(403).json({
        msg: 'Unauthorized',
        debug: {
          currentUserId: req.user.id,
          currentUserRole: req.user.role,
          sessionClientId: clientId,
          sessionAstrologerId: astrologerId
        }
      });
    }
    */

    res.json({
      sessionId: session.sessionId,
      client: {
        id: session.clientId ? session.clientId._id : null,
        name: session.clientId ? session.clientId.name : "Unknown User"
      },
      astrologer: {
        id: session.astrologerId ? session.astrologerId._id : null,
        name: session.astrologerId ? session.astrologerId.name : "Unknown Astrologer"
      },
      ratePerMinute: session.ratePerMinute,
      status: session.status,
      startedAt: session.startedAt,
      duration: session.duration,
      totalCost: session.totalCost
    });
  } catch (err) {
    console.error('Error fetching session info:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getAllSessionsDebug = async (req, res) => {
  try {
    const sessions = await ChatSession.find().sort({ createdAt: -1 });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

