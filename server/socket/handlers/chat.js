const ChatMessage = require('../../models/ChatMessage');
const ChatSession = require('../../models/ChatSession');
const Wallet = require('../../models/Wallet');
const presence = require('./presence');
const onlineUsers = presence.onlineUsers;

const sessionTimers = new Map();

/**
 * ----------------------------
 *  HELPER: START CHAT SESSION
 * ----------------------------
 */
const startChatSession = async (io, sessionId) => {
    try {
        const s = await ChatSession.findOne({ sessionId });
        if (!s) return;

        const room = `session:${sessionId}`;

        // Already active? Just ensure sockets are in the room
        if (s.status === 'active') {
            const clientSock = onlineUsers.get(String(s.clientId));
            const astroSock = onlineUsers.get(String(s.astrologerId));

            if (clientSock) io.sockets.sockets.get(clientSock)?.join(room);
            if (astroSock) io.sockets.sockets.get(astroSock)?.join(room);
            return;
        }

        // Activate
        s.status = 'active';
        s.startedAt = new Date();
        await s.save();

        const clientSock = onlineUsers.get(String(s.clientId));
        const astroSock = onlineUsers.get(String(s.astrologerId));

        if (clientSock) io.sockets.sockets.get(clientSock)?.join(room);
        if (astroSock) io.sockets.sockets.get(astroSock)?.join(room);

        io.to(room).emit('chat:joined', { sessionId });

        /**
         * BILLING TIMER
         */
        const ratePerSecond = (s.ratePerMinute || 1) / 60;
        let elapsed = 0;

        if (sessionTimers.has(sessionId)) {
            clearInterval(sessionTimers.get(sessionId));
        }

        const timer = setInterval(async () => {
            elapsed += 1;

            const wallet = await Wallet.findOne({ userId: s.clientId });

            if (!wallet) {
                clearInterval(timer);
                sessionTimers.delete(sessionId);

                s.status = 'ended';
                s.duration = elapsed;
                s.endedAt = new Date();
                s.totalCost = parseFloat((elapsed * ratePerSecond).toFixed(2));
                await s.save();

                io.to(room).emit('chat:end', { sessionId, reason: 'insufficient_balance' });
                return;
            }

            // Allow chat when balance = 0 (legacy logic)
            if (wallet.balance < ratePerSecond && wallet.balance > 0) {
                clearInterval(timer);
                sessionTimers.delete(sessionId);

                s.status = 'ended';
                s.duration = elapsed;
                s.endedAt = new Date();
                s.totalCost = parseFloat((elapsed * ratePerSecond).toFixed(2));
                await s.save();

                io.to(room).emit('chat:end', { sessionId, reason: 'insufficient_balance' });
                return;
            }

            if (wallet.balance > 0) {
                wallet.balance = parseFloat((wallet.balance - ratePerSecond).toFixed(2));
                await wallet.save();
                io.to(room).emit('wallet:update', {
                    sessionId,
                    balance: wallet.balance,
                    elapsed
                });
            }
        }, 1000);

        sessionTimers.set(sessionId, timer);

    } catch (err) {
        console.error('startChatSession error:', err);
    }
};


/**
 * ============================
 * MAIN HANDLER EXPORT
 * ============================
 */
module.exports = (io, socket) => {

    /**
     * -----------------------------------------
     * CLIENT REQUESTS CHAT WITH ASTROLOGER
     * -----------------------------------------
     */
    socket.on('chat:request', async (data) => {
        try {
            const { clientId, astrologerId, ratePerMinute } = data;

            const crypto = require('crypto');
            const sessionId = crypto.randomUUID();

            await ChatSession.create({
                sessionId,
                clientId,
                astrologerId,
                status: 'requested',
                ratePerMinute: ratePerMinute || 1
            });

            const astroSock = onlineUsers.get(String(astrologerId));
            if (astroSock) {
                io.to(astroSock).emit('chat:request', {
                    sessionId,
                    clientId,
                    astrologerId
                });
            }

            socket.emit('chat:requested', { sessionId });

        } catch (err) {
            console.error('chat:request error:', err);
            socket.emit('chat:error', { error: 'request_failed' });
        }
    });

    /**
     * -----------------------------------------
     * ASTROLOGER ACCEPTS CHAT
     * -----------------------------------------
     */
    socket.on('chat:accept', async ({ sessionId }) => {
        try {
            // Put astrologer in the room immediately
            socket.join(`session:${sessionId}`);
            await startChatSession(io, sessionId);
        } catch (err) {
            socket.emit('chat:error', { error: 'accept_failed' });
        }
    });

    /**
     * LEGACY "accept-chat" compatibility
     */
    socket.on("accept-chat", async ({ sessionId }) => {
        await startChatSession(io, sessionId);
    });

    /**
     * -----------------------------------------
     * ASTROLOGER DECLINES CHAT
     * -----------------------------------------
     */
    socket.on("decline-chat", async ({ sessionId }) => {
        try {
            await ChatSession.updateOne(
                { sessionId },
                { status: "declined" }
            );
            const s = await ChatSession.findOne({ sessionId });
            if (s) {
                io.to(`user:${s.userId}`).emit("chat-declined", { sessionId });
            }
        } catch (err) {
            console.error("decline-chat:", err);
        }
    });

    /**
     * -----------------------------------------
     * JOIN SESSION ROOM (client/astro)
     * -----------------------------------------
     */
    socket.on("join-session-room", async ({ sessionId }) => {
        try {
            const s = await ChatSession.findOne({ sessionId });
            if (!s || s.status !== "active")
                return socket.emit("error", { message: "Session not active" });

            socket.join(`session:${sessionId}`);
            socket.emit("joined-session", { sessionId });
        } catch (err) {
            console.error("join-session-room error:", err);
        }
    });

    /**
     * -----------------------------------------
     * MESSAGING INSIDE SESSION
     * -----------------------------------------
     */
    socket.on('chat:message', async (data) => {
        try {
            const { sessionId, senderId, text = '', type = 'text' } = data;

            const s = await ChatSession.findOne({ sessionId });
            if (!s || s.status !== 'active') return;

            const receiverId =
                senderId.toString() === s.clientId.toString()
                    ? s.astrologerId
                    : s.clientId;

            const room = `session:${sessionId}`;

            const msg = await ChatMessage.create({
                sender: senderId,
                receiver: receiverId,
                roomId: room,
                sessionId,
                message: text,
                type,
                timestamp: new Date()
            });

            io.to(room).emit('chat:message', {
                _id: msg._id,
                sessionId,
                senderId,
                receiverId,
                text,
                type,
                timestamp: msg.timestamp
            });

        } catch (err) {
            console.error('chat:message error:', err);
        }
    });

    /**
     * -----------------------------------------
     * TYPING
     * -----------------------------------------
     */
    socket.on('chat:typing', ({ sessionId, userId }) => {
        socket.to(`session:${sessionId}`).emit('chat:typing', { sessionId, userId });
    });

    /**
     * -----------------------------------------
     * END CHAT SESSION
     * -----------------------------------------
     */
    socket.on('chat:end', async ({ sessionId }) => {
        try {
            const s = await ChatSession.findOne({ sessionId });
            if (!s) return;

            if (sessionTimers.get(sessionId)) {
                clearInterval(sessionTimers.get(sessionId));
                sessionTimers.delete(sessionId);
            }

            const now = new Date();
            const started = s.startedAt ? new Date(s.startedAt) : now;

            const durationSec = Math.floor((now - started) / 1000);
            const totalCost = parseFloat(
                ((s.ratePerMinute / 60) * durationSec).toFixed(2)
