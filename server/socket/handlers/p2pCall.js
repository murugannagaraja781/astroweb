const crypto = require('crypto');
const path = require('path');

// ===== In-memory data (Scoped to this module to match user's request) =====

// userId -> { name }
const users = new Map();
// userId -> socketId
const userSockets = new Map();
// socketId -> userId
const socketToUser = new Map();

// sessionId -> { type, users: [u1, u2], startedAt }
const activeSessions = new Map();
// userId -> sessionId
const userActiveSession = new Map();

// offline message queue: toUserId -> [ { fromUserId, content, sessionId, timestamp, messageId } ]
const pendingMessages = new Map();

function startSessionRecord(sessionId, type, u1, u2) {
    activeSessions.set(sessionId, {
        type,
        users: [u1, u2],
        startedAt: Date.now(),
    });
    userActiveSession.set(u1, sessionId);
    userActiveSession.set(u2, sessionId);
}

function endSessionRecord(sessionId) {
    if (!sessionId) return;
    const s = activeSessions.get(sessionId);
    if (!s) return;
    activeSessions.delete(sessionId);
    s.users.forEach((u) => {
        if (userActiveSession.get(u) === sessionId) {
            userActiveSession.delete(u);
        }
    });
}

function getOtherUserIdFromSession(sessionId, userId) {
    const s = activeSessions.get(sessionId);
    if (!s) return null;
    const [u1, u2] = s.users;
    return u1 === userId ? u2 : u2 === userId ? u1 : null;
}

module.exports = (io, socket) => {
    console.log('P2P Socket connected:', socket.id);

    // --- Register user ---
    socket.on('register', (data, cb) => {
        try {
            const { name, existingUserId } = data || {};
            if (!name || !name.trim()) {
                if (typeof cb === 'function') cb({ ok: false, error: 'Name required' });
                return;
            }

            let userId =
                existingUserId && users.has(existingUserId)
                    ? existingUserId
                    : crypto.randomUUID();

            users.set(userId, { name: name.trim() });
            userSockets.set(userId, socket.id);
            socketToUser.set(socket.id, userId);

            console.log(
                `User registered: ${name} (${userId}) via socket ${socket.id}`
            );

            // offline queue flush for this user
            const queued = pendingMessages.get(userId);
            if (queued && queued.length) {
                console.log(`Delivering ${queued.length} queued messages to ${userId}`);
                const targetSocketId = userSockets.get(userId);
                queued.forEach((m) => {
                    if (!targetSocketId) return;
                    io.to(targetSocketId).emit('chat-message', {
                        fromUserId: m.fromUserId,
                        content: m.content,
                        sessionId: m.sessionId || null,
                        timestamp: m.timestamp,
                        messageId: m.messageId,
                    });
                    const senderSocketId = userSockets.get(m.fromUserId);
                    if (senderSocketId) {
                        io.to(senderSocketId).emit('message-status', {
                            messageId: m.messageId,
                            status: 'seen',
                        });
                    }
                });
                pendingMessages.delete(userId);
            }

            if (typeof cb === 'function') cb({ ok: true, userId });
        } catch (err) {
            console.error('register error', err);
            if (typeof cb === 'function') cb({ ok: false, error: 'Internal error' });
        }
    });

    // --- Session request (chat / audio / video) ---
    socket.on('request-session', (data, cb) => {
        try {
            const { toUserId, type } = data || {};
            const fromUserId = socketToUser.get(socket.id);

            if (!fromUserId) {
                if (typeof cb === 'function')
                    cb({
                        ok: false,
                        error: 'Not registered',
                        code: 'not_registered',
                    });
                return;
            }
            if (!toUserId || !type) {
                if (typeof cb === 'function')
                    cb({
                        ok: false,
                        error: 'Missing fields',
                        code: 'bad_request',
                    });
                return;
            }

            const targetSocketId = userSockets.get(toUserId);
            if (!targetSocketId) {
                if (typeof cb === 'function') cb({ ok: false, error: 'User offline', code: 'offline' });
                return;
            }

            if (userActiveSession.has(toUserId)) {
                if (typeof cb === 'function') cb({ ok: false, error: 'User busy', code: 'busy' });
                return;
            }

            const sessionId = crypto.randomUUID();
            startSessionRecord(sessionId, type, fromUserId, toUserId);

            io.to(targetSocketId).emit('incoming-session', {
                sessionId,
                fromUserId,
                type,
            });

            console.log(
                `Session request: type=${type}, sessionId=${sessionId}, from=${fromUserId}, to=${toUserId}`
            );

            if (typeof cb === 'function') cb({ ok: true, sessionId });
        } catch (err) {
            console.error('request-session error', err);
            if (typeof cb === 'function') cb({ ok: false, error: 'Internal error', code: 'internal' });
        }
    });

    // --- Answer session ---
    socket.on('answer-session', (data) => {
        try {
            const { sessionId, toUserId, type, accept } = data || {};
            const fromUserId = socketToUser.get(socket.id);
            if (!fromUserId || !sessionId || !toUserId) return;

            const targetSocketId = userSockets.get(toUserId);
            if (!targetSocketId) return;

            if (!accept) {
                endSessionRecord(sessionId);
            }

            io.to(targetSocketId).emit('session-answered', {
                sessionId,
                fromUserId,
                type,
                accept: !!accept,
            });

            console.log(
                `Session answer: sessionId=${sessionId}, type=${type}, from=${fromUserId}, to=${toUserId}, accept=${!!accept}`
            );
        } catch (err) {
            console.error('answer-session error', err);
        }
    });

    // --- WebRTC signaling relay ---
    socket.on('signal', (data) => {
        try {
            const { sessionId, toUserId, signal } = data || {};
            const fromUserId = socketToUser.get(socket.id);
            if (!fromUserId || !sessionId || !toUserId || !signal) return;

            const targetSocketId = userSockets.get(toUserId);
            if (!targetSocketId) return;

            io.to(targetSocketId).emit('signal', {
                sessionId,
                fromUserId,
                signal,
            });
        } catch (err) {
            console.error('signal error', err);
        }
    });

    // --- Chat message (text / audio / file) ---
    socket.on('chat-message', (data) => {
        try {
            const { toUserId, sessionId, content, timestamp, messageId } = data || {};
            const fromUserId = socketToUser.get(socket.id);
            if (!fromUserId || !toUserId || !content || !messageId) return;

            const targetSocketId = userSockets.get(toUserId);

            if (!targetSocketId) {
                const list = pendingMessages.get(toUserId) || [];
                list.push({
                    fromUserId,
                    content,
                    sessionId,
                    timestamp: timestamp || Date.now(),
                    messageId,
                });
                pendingMessages.set(toUserId, list);

                socket.emit('message-status', {
                    messageId,
                    status: 'queued',
                });
                console.log(
                    `Queued message ${messageId} from ${fromUserId} to offline user ${toUserId}`
                );
                return;
            }

            socket.emit('message-status', {
                messageId,
                status: 'sent',
            });

            io.to(targetSocketId).emit('chat-message', {
                fromUserId,
                content,
                sessionId: sessionId || null,
                timestamp: timestamp || Date.now(),
                messageId,
            });
        } catch (err) {
            console.error('chat-message error', err);
        }
    });

    // --- Receiver: delivered/seen ack ---
    socket.on('message-delivered', (data) => {
        try {
            const { toUserId, messageId } = data || {};
            const fromUserId = socketToUser.get(socket.id);
            if (!fromUserId || !toUserId || !messageId) return;

            const targetSocketId = userSockets.get(toUserId);
            if (!targetSocketId) return;

            io.to(targetSocketId).emit('message-status', {
                messageId,
                status: 'seen',
            });
        } catch (err) {
            console.error('message-delivered error', err);
        }
    });

    // --- Typing indicator ---
    socket.on('typing', (data) => {
        try {
            const { toUserId, isTyping } = data || {};
            const fromUserId = socketToUser.get(socket.id);
            if (!fromUserId || !toUserId) return;

            const targetSocketId = userSockets.get(toUserId);
            if (!targetSocketId) return;

            io.to(targetSocketId).emit('typing', {
                fromUserId,
                isTyping: !!isTyping,
            });
        } catch (err) {
            console.error('typing error', err);
        }
    });

    // --- Session end (manual) ---
    socket.on('session-ended', (data) => {
        try {
            const { sessionId, toUserId, type, durationMs } = data || {};
            const fromUserId = socketToUser.get(socket.id);
            if (!fromUserId || !sessionId || !toUserId) return;

            endSessionRecord(sessionId);

            const targetSocketId = userSockets.get(toUserId);
            if (targetSocketId) {
                io.to(targetSocketId).emit('session-ended', {
                    sessionId,
                    fromUserId,
                    type,
                    durationMs,
                });
            }

            console.log(
                `Session ended (manual): sessionId=${sessionId}, type=${type}, from=${fromUserId}, to=${toUserId}, duration=${durationMs} ms`
            );
        } catch (err) {
            console.error('session-ended error', err);
        }
    });

    // --- Disconnect: auto end session on other side too ---
    socket.on('disconnect', () => {
        const userId = socketToUser.get(socket.id);
        if (userId) {
            console.log(`Socket disconnected: ${socket.id}, userId=${userId}`);
            socketToUser.delete(socket.id);
            userSockets.delete(userId); // Ensure we clean up userSockets
            const sid = userActiveSession.get(userId);
            if (sid) {
                const s = activeSessions.get(sid);
                const otherUserId = getOtherUserIdFromSession(sid, userId);
                const sessionType = s ? s.type : 'unknown';
                const durationMs = s ? Date.now() - s.startedAt : 0;

                endSessionRecord(sid);

                if (otherUserId) {
                    const targetSocketId = userSockets.get(otherUserId);
                    if (targetSocketId) {
                        io.to(targetSocketId).emit('session-ended', {
                            sessionId: sid,
                            fromUserId: userId,
                            type: sessionType,
                            durationMs,
                        });
                    }
                }

                console.log(
                    `Session auto-ended due to disconnect: sessionId=${sid}, fromUserId=${userId}, otherUser=${otherUserId}`
                );
            }
        }
    });
};
