const ChatMessage = require('../../models/ChatMessage');
const ChatSession = require('../../models/ChatSession');
const ChatCallDetails = require('../../models/ChatCallDetails');
const User = require('../../models/User');
const Wallet = require('../../models/Wallet');
const presence = require('./presence');
const onlineUsers = presence.onlineUsers;
const sessionTimers = new Map();

/**
 * Chat Socket Handlers
 * Handles all chat-related socket events
 */

// Helper to start chat session (shared by auto-accept and manual accept)
const startChatSession = async (io, sessionId) => {
    try {
        const s = await ChatSession.findOne({ sessionId });
        if (!s) return;

        // If already active, just join sockets (idempotent)
        if (s.status === 'active') {
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
            return;
        }

        s.status = 'active';
        s.startedAt = new Date();
        await s.save();

        // ALSO update ChatCallDetails
        await ChatCallDetails.findOneAndUpdate(
            { sessionId },
            {
                status: 'active',
                acceptedAt: new Date()
            }
        );

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

        // Emit session info to both participants for header display
        const User = require('../../models/User');
        const clientUser = await User.findById(s.clientId).select('name');
        const astrologerUser = await User.findById(s.astrologerId).select('name');

        io.to(sessionId).emit('chat:session_info', {
            sessionId,
            client: {
                id: s.clientId.toString(),
                name: clientUser?.name || 'Client'
            },
            astrologer: {
                id: s.astrologerId.toString(),
                name: astrologerUser?.name || 'Astrologer'
            },
            ratePerMinute: s.ratePerMinute,
            startedAt: s.startedAt,
            status: 'active'
        });

        // Emit chat accepted and started events
        io.to(sessionId).emit('chat:accepted', { sessionId });
        io.to(sessionId).emit('chat:started', { sessionId, startedAt: s.startedAt });
        io.to(sessionId).emit('chat:joined', { sessionId });

        const ratePerSecond = (s.ratePerMinute || 1) / 60;
        let elapsed = 0;

        // Clear any existing timer for this session just in case
        if (sessionTimers.has(sessionId)) {
            clearInterval(sessionTimers.get(sessionId));
        }

        const t = setInterval(async () => {
            elapsed += 1;
            const wallet = await Wallet.findOne({ userId: s.clientId });
            const cost = ratePerSecond;

            if (!wallet) {
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

            // Allow chat when balance is zero (no deduction) - logic preserved from original
            if (wallet.balance < cost && wallet.balance > 0) {
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

            if (wallet.balance > 0) {
                wallet.balance = parseFloat((wallet.balance - cost).toFixed(2));
                await wallet.save();
                io.to(sessionId).emit('wallet:update', { sessionId, balance: wallet.balance, elapsed });
            }
        }, 1000);

        sessionTimers.set(sessionId, t);

    } catch (err) {
        console.error('Error starting chat session:', err);
    }
};

module.exports = (io, socket) => {

    socket.on('chat:request', async (data) => {
        try {
            const { clientId, astrologerId, ratePerMinute, sessionId } = data;
            console.log(`[DEBUG] chat:request received for astrologerId: ${astrologerId}, sessionId: ${sessionId}`);

            const crypto = require('crypto');
            const sid = sessionId || crypto.randomUUID();
            const profileRate = ratePerMinute || 1;

            // Create or Update in ChatSession (upsert)
            await ChatSession.findOneAndUpdate(
                { sessionId: sid },
                {
                    clientId,
                    astrologerId,
                    status: 'requested',
                    ratePerMinute: profileRate
                },
                { upsert: true, new: true }
            );

            // ALSO create/update in ChatCallDetails
            await ChatCallDetails.findOneAndUpdate(
                { sessionId: sid },
                {
                    userId: clientId,
                    astrologerId,
                    initiatedAt: new Date(),
                    status: 'requested',
                    ratePerMinute: profileRate
                },
                { upsert: true, new: true }
            );

            // Notify astrologer (optional, but good for UI updates if they are on dashboard)
            // Notify astrologer (optional, but good for UI updates if they are on dashboard)
            const targetAstroIdString = String(astrologerId);
            const astroSock = onlineUsers.get(targetAstroIdString);

            console.log(`[DEBUG] Looking up socket for Astrologer ID: ${targetAstroIdString}`);
            console.log(`[DEBUG] Current Online Users Map Keys:`, Array.from(onlineUsers.keys()));
            console.log(`[DEBUG] Found Socket ID: ${astroSock}`);

            if (astroSock) {
                // Fetch user details to send to astrologer
                const user = await User.findById(clientId).select('name _id avatar');

                console.log(`[DEBUG] 🚀 Emitting 'chat:request' UNICAST to socket: ${astroSock} for session ${sid}`);

                io.to(astroSock).emit('chat:request', {
                    sessionId: sid,
                    userId: user, // Send full user object as userId to match client expectation
                    clientId,
                    astrologerId,
                    socketId: socket.id
                });
            } else {
                console.warn(`[WARN] Astrologer ${targetAstroIdString} not found in onlineUsers map! Request created but live notification skipped.`);
            }

            socket.emit('chat:requested', { sessionId: sid });

            // DO NOT auto-accept - wait for astrologer to manually accept
            console.log(`[DEBUG] Chat request created for session ${sid}, waiting for astrologer acceptance`);

        } catch (err) {
            console.error('Error in chat:request:', err);
            socket.emit('chat:error', { error: 'request_failed' });
        }
    });

    socket.on('chat:accept', async (payload) => {
        try {
            const { sessionId } = payload;
            console.log(`[DEBUG] Astrologer accepting chat session: ${sessionId}`);

            // Get session to find client
            const session = await ChatSession.findOne({ sessionId });
            if (session && session.clientId) {
                // Notify the client that their request was accepted
                const clientSocketId = onlineUsers.get(session.clientId.toString());
                if (clientSocketId) {
                    io.to(clientSocketId).emit('chat:accepted_by_astrologer', {
                        sessionId,
                        message: 'Your chat request has been accepted!'
                    });
                    console.log(`[DEBUG] Notified client ${session.clientId} that chat was accepted`);
                }
            }

            await startChatSession(io, sessionId);
        } catch (err) {
            console.error('[ERROR] chat:accept failed:', err);
            socket.emit('chat:error', { error: 'accept_failed' });
        }
    });

    socket.on('chat:message', async (data) => {
        try {
            const { sessionId, senderId, text = '', type = 'text', tempId } = data;
            const s = await ChatSession.findOne({ sessionId });
            if (!s || s.status !== 'active') return;
            const roomId = sessionId;
            const receiverId = senderId === s.clientId.toString() ? s.astrologerId : s.clientId;
            const message = new ChatMessage({ sender: senderId, receiver: receiverId, roomId, sessionId, message: text, type, timestamp: new Date() });
            await message.save();
            io.to(roomId).emit('chat:message', {
                _id: message._id,
                sessionId,
                roomId,
                senderId,
                receiverId: receiverId.toString(),
                text,
                type,
                timestamp: message.timestamp,
                tempId // Echo back the tempId for client-side deduplication
            });
        } catch (err) {
            socket.emit('chat:error', { error: 'message_failed' });
        }
    });

    socket.on('chat:typing', (data) => {
        const { sessionId, userId } = data;
        // Broadcast to everyone in the room (they can filter their own typing on client side)
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

            // ALSO update ChatCallDetails
            await ChatCallDetails.findOneAndUpdate(
                { sessionId },
                {
                    status: 'completed',
                    completedAt: now,
                    duration: Math.floor(durationSec / 60), // Convert to minutes
                    totalCost
                }
            );

            io.to(sessionId).emit('chat:end', { sessionId, reason: 'ended' });
        } catch (err) {
            socket.emit('chat:error', { error: 'end_failed' });
        }
    });

    // Send message (Legacy/General handler)
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

    // Explicit join chat room
    socket.on('join_chat', ({ sessionId }) => {
        if (!sessionId) return;
        socket.join(sessionId);
        console.log(`[DEBUG] Socket ${socket.id} joined chat session ${sessionId}`);
    });
};
