const ChatMessage = require('../../models/ChatMessage');
const ChatSession = require('../../models/ChatSession');
const Wallet = require('../../models/Wallet');
const presence = require('./presence');
const onlineUsers = presence.onlineUsers;
const sessionTimers = new Map();

/**
 * Chat Socket Handlers
 * Handles all chat-related socket events
 */

module.exports = (io, socket) => {

    socket.on('chat:request', async (data) => {
        try {
            const { clientId, astrologerId, ratePerMinute } = data;
            console.log(`[DEBUG] chat:request received for astrologerId: ${astrologerId} (type: ${typeof astrologerId})`);
            console.log(`[DEBUG] onlineUsers keys:`, Array.from(onlineUsers.keys()));

            const crypto = require('crypto');
            const sid = crypto.randomUUID();
            const profileRate = ratePerMinute || 1;
            await ChatSession.create({ sessionId: sid, clientId, astrologerId, status: 'requested', ratePerMinute: profileRate });

            const astroSock = onlineUsers.get(String(astrologerId));
            console.log(`[DEBUG] Found astroSock: ${astroSock}`);

            if (astroSock) {
                io.to(astroSock).emit('chat:request', { sessionId: sid, clientId, astrologerId });
            } else {
                console.log(`[DEBUG] Astrologer ${astrologerId} not found in onlineUsers`);
            }
            socket.emit('chat:requested', { sessionId: sid });
        } catch (err) {
            socket.emit('chat:error', { error: 'request_failed' });
        }
    });

    socket.on('chat:accept', async (payload) => {
        try {
            const { sessionId } = payload;
            const s = await ChatSession.findOne({ sessionId });
            if (!s) return;
            s.status = 'active';
            s.startedAt = new Date();
            await s.save();
            const clientSock = onlineUsers.get(s.clientId.toString());
            const astroSock = onlineUsers.get(s.astrologerId.toString());
            if (clientSock) {
                const cs = io.sockets.sockets.get(clientSock);
                if (cs) cs.join(sessionId);
            }
            if (astroSock) {
                const as = io.sockets.sockets.get(astroSock);
                if (as) as.join(sessionId);
            }
            io.to(sessionId).emit('chat:joined', { sessionId });
            const ratePerSecond = (s.ratePerMinute || 1) / 60;
            let elapsed = 0;
            const t = setInterval(async () => {
                elapsed += 1;
                const wallet = await Wallet.findOne({ userId: s.clientId });
                const cost = ratePerSecond;
                if (!wallet || wallet.balance < cost) {
                    clearInterval(t);
                    sessionTimers.delete(sessionId);
                    io.to(sessionId).emit('chat:end', { sessionId, reason: 'insufficient_balance' });
                    s.status = 'ended';
                    s.endedAt = new Date();
                    s.duration = elapsed;
                    s.totalCost = parseFloat((elapsed * ratePerSecond).toFixed(2));
                    await s.save();
                    return;
                }
                wallet.balance = parseFloat((wallet.balance - cost).toFixed(2));
                await wallet.save();
                io.to(sessionId).emit('wallet:update', { sessionId, balance: wallet.balance, elapsed });
            }, 1000);
            sessionTimers.set(sessionId, t);
        } catch (err) {
            socket.emit('chat:error', { error: 'accept_failed' });
        }
    });

    socket.on('chat:message', async (data) => {
        try {
            const { sessionId, senderId, text = '', type = 'text' } = data;
            const s = await ChatSession.findOne({ sessionId });
            if (!s || s.status !== 'active') return;
            const roomId = sessionId;
            const receiverId = senderId === s.clientId.toString() ? s.astrologerId : s.clientId;
            const message = new ChatMessage({ sender: senderId, receiver: receiverId, roomId, sessionId, message: text, type, timestamp: new Date() });
            await message.save();
            io.to(roomId).emit('chat:message', { _id: message._id, sessionId, roomId, senderId, receiverId: receiverId.toString(), text, type, timestamp: message.timestamp });
        } catch (err) {
            socket.emit('chat:error', { error: 'message_failed' });
        }
    });

    socket.on('chat:typing', (data) => {
        const { sessionId, userId } = data;
        socket.to(sessionId).emit('chat:typing', { sessionId, userId });
    });

    socket.on('chat:end', async (data) => {
        try {
            const { sessionId } = data;
            const s = await ChatSession.findOne({ sessionId });
            if (!s) return;
            const t = sessionTimers.get(sessionId);
            if (t) {
                clearInterval(t);
                sessionTimers.delete(sessionId);
            }
            const now = new Date();
            const started = s.startedAt ? new Date(s.startedAt) : now;
            const durationSec = Math.max(Math.floor((now - started) / 1000), s.duration || 0);
            const totalCost = parseFloat(((s.ratePerMinute / 60) * durationSec).toFixed(2));
            s.status = 'ended';
            s.endedAt = now;
            s.duration = durationSec;
            s.totalCost = totalCost;
            await s.save();
            io.to(sessionId).emit('chat:end', { sessionId, reason: 'ended' });
        } catch (err) {
            socket.emit('chat:error', { error: 'end_failed' });
        }
    });

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
