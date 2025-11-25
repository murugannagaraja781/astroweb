const ChatMessage = require('../models/ChatMessage');

/**
 * Get chat history between two users
 */
exports.getChatHistory = async (req, res) => {
    try {
        const { userId, peerId } = req.params;
        const { limit = 50, skip = 0 } = req.query;

        // Verify user is authorized
        if (req.user.id !== userId) {
            return res.status(403).json({ msg: 'Unauthorized' });
        }

        // Create room ID (consistent sorting)
        const roomId = [userId, peerId].sort().join('-');

        // Fetch messages
        const messages = await ChatMessage.find({ roomId })
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip))
            .populate('sender', 'name')
            .populate('receiver', 'name');

        // Mark messages as delivered if they're for this user
        const undeliveredMessages = messages.filter(
            msg => msg.receiver.toString() === userId && !msg.delivered
        );

        if (undeliveredMessages.length > 0) {
            await ChatMessage.updateMany(
                {
                    _id: { $in: undeliveredMessages.map(m => m._id) },
                    receiver: userId
                },
                {
                    delivered: true,
                    deliveredAt: new Date()
                }
            );
        }

        res.json({
            messages: messages.reverse(),
            total: messages.length,
            hasMore: messages.length === parseInt(limit)
        });

    } catch (err) {
        console.error('Error fetching chat history:', err);
        res.status(500).json({ msg: 'Server error' });
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
            return res.status(400).json({ msg: 'Missing required fields' });
        }

        // In production, upload to S3/Firebase Storage
        // For now, we'll store base64 (not recommended for production)
        const imageUrl = base64Image; // Replace with actual cloud URL

        // Create message
        const roomId = [senderId, receiverId].sort().join('-');
        const message = new ChatMessage({
            sender: senderId,
            receiver: receiverId,
            roomId,
            message: '',
            type: 'image',
            mediaUrl: imageUrl,
            timestamp: new Date()
        });

        await message.save();

        res.json({
            success: true,
            messageId: message._id,
            imageUrl
        });

    } catch (err) {
        console.error('Error uploading image:', err);
        res.status(500).json({ msg: 'Upload failed' });
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
            return res.status(400).json({ msg: 'Missing required fields' });
        }

        // In production, upload to S3/Firebase Storage
        // For now, we'll store base64 (not recommended for production)
        const audioUrl = base64Audio; // Replace with actual cloud URL

        // Create message
        const roomId = [senderId, receiverId].sort().join('-');
        const message = new ChatMessage({
            sender: senderId,
            receiver: receiverId,
            roomId,
            message: '',
            type: 'audio',
            mediaUrl: audioUrl,
            duration: parseInt(duration),
            timestamp: new Date()
        });

        await message.save();

        res.json({
            success: true,
            messageId: message._id,
            audioUrl,
            duration
        });

    } catch (err) {
        console.error('Error uploading voice note:', err);
        res.status(500).json({ msg: 'Upload failed' });
    }
};
