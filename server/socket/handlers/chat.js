const ChatMessage = require('../../models/ChatMessage');

/**
 * Chat Socket Handlers
 * Handles all chat-related socket events
 */

module.exports = (io, socket) => {

    // Send message
    socket.on('sendMessage', async (data) => {
        try {
            const { roomId, senderId, receiverId, text, type = 'text', mediaUrl = null, duration = 0 } = data;

            // Save message to database
            const message = new ChatMessage({
                sender: senderId,
                receiver: receiverId,
                roomId,
                message: text || '',
                type,
                mediaUrl,
                duration,
                timestamp: new Date(),
                delivered: false,
                read: false
            });

            await message.save();

            // Emit to room
            const messageData = {
                _id: message._id,
                roomId,
                senderId,
                receiverId,
                text,
                type,
                mediaUrl,
                duration,
                timestamp: message.timestamp,
                delivered: false,
                read: false
            };

            io.to(roomId).emit('receiveMessage', messageData);

            // Mark as delivered if receiver is online
            setTimeout(async () => {
                await ChatMessage.findByIdAndUpdate(message._id, {
                    delivered: true,
                    deliveredAt: new Date()
                });
                io.to(roomId).emit('messageDelivered', { messageId: message._id });
            }, 100);

        } catch (err) {
            console.error('Error in sendMessage:', err);
            socket.emit('messageError', { error: 'Failed to send message' });
        }
    });

    // Mark message as read
    socket.on('markAsRead', async (data) => {
        try {
            const { messageId, userId } = data;

            const message = await ChatMessage.findById(messageId);
            if (message && message.receiver.toString() === userId) {
                message.read = true;
                message.readAt = new Date();
                await message.save();

                io.to(message.roomId).emit('messageRead', { messageId });
            }
        } catch (err) {
            console.error('Error in markAsRead:', err);
        }
    });

    // Typing indicator
    socket.on('typing', (data) => {
        const { roomId, name } = data;
        socket.to(roomId).emit('displayTyping', { name });
    });

    socket.on('stopTyping', (data) => {
        const { roomId } = data;
        socket.to(roomId).emit('hideTyping');
    });

    // Get chat history
    socket.on('getChatHistory', async (data) => {
        try {
            const { roomId, limit = 50, skip = 0 } = data;

            const messages = await ChatMessage.find({ roomId })
                .sort({ timestamp: -1 })
                .limit(limit)
                .skip(skip)
                .populate('sender', 'name')
                .populate('receiver', 'name');

            socket.emit('chatHistory', { messages: messages.reverse() });
        } catch (err) {
            console.error('Error fetching chat history:', err);
            socket.emit('chatHistoryError', { error: 'Failed to load messages' });
        }
    });
};
