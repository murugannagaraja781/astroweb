// server/socket.js
module.exports = function (io) {
    io.on("connection", (socket) => {
        console.log("Socket connected:", socket.id);

        // =========================
        // VIDEO CALL SIGNALING
        // =========================
        socket.on("video:call_request", ({ roomId, to }) => {
            console.log("Call request → sending to", to);
            io.to(to).emit("video:incoming_call", { from: socket.id, roomId });
        });

        socket.on("video:call_accept", ({ roomId, to }) => {
            console.log("Call accepted → notifying", to);
            io.to(to).emit("video:call_accepted", { roomId });
        });

        socket.on("video:call_reject", ({ roomId, to }) => {
            console.log("Call rejected → notifying", to);
            io.to(to).emit("video:call_rejected", { roomId });
        });

        // Join WebRTC room
        socket.on("join", (roomId) => {
            socket.join(roomId);

            const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
            console.log(
                `Socket ${socket.id} joined room ${roomId}. Clients: ${clients.length}`
            );

            // Notify existing peers
            socket.to(roomId).emit("peer:joined", { socketId: socket.id });

            // Send current peers list to the new user
            const others = clients.filter((id) => id !== socket.id);
            socket.emit("joined", { roomId, others });
        });

        // Offer
        socket.on("call:offer", ({ roomId, offer, to }) => {
            if (to) {
                io.to(to).emit("call:offer", { from: socket.id, offer });
            } else {
                socket.to(roomId).emit("call:offer", { from: socket.id, offer });
            }
        });

        // Answer
        socket.on("call:answer", ({ roomId, answer, to }) => {
            if (to) {
                io.to(to).emit("call:answer", { from: socket.id, answer });
            } else {
                socket.to(roomId).emit("call:answer", { from: socket.id, answer });
            }
        });

        // ICE Candidate
        socket.on("call:candidate", ({ roomId, candidate, to }) => {
            if (to) {
                io.to(to).emit("call:candidate", { from: socket.id, candidate });
            } else {
                socket.to(roomId).emit("call:candidate", { from: socket.id, candidate });
            }
        });

        // Leave room
        socket.on("leave", (roomId) => {
            socket.leave(roomId);
            socket.to(roomId).emit("peer:left", { socketId: socket.id });
        });

        // =========================
        // CHAT FLOW (CLIENT ↔ ASTROLOGER)
        // =========================

        // Client or astrologer joins a specific chat session room
        socket.on("join_chat", ({ sessionId }) => {
            if (!sessionId) return;
            const room = `chat_${sessionId}`;
            socket.join(room);
            console.log(`Socket ${socket.id} joined chat room ${room}`);
            socket.emit("chat:joined", { sessionId });
        });

        // Client sends chat request (after REST /api/chat/request created session)
        socket.on("chat:request", (payload) => {
            // payload: { clientId, astrologerId, ratePerMinute, sessionId }
            console.log("chat:request → broadcast", payload);
            // Simple broadcast – astrologer dashboard listens and also fetches pending sessions via API
            io.emit("chat:request", payload);
        });

        // Astrologer accepts
        socket.on("chat:accept", ({ sessionId }) => {
            console.log("chat:accept → session", sessionId);
            // Broadcast accepted so client AstrologerDetail can redirect
            io.emit("chat:accepted", { sessionId });
        });

        // Astrologer rejects
        socket.on("chat:reject", ({ sessionId }) => {
            console.log("chat:reject → session", sessionId);
            io.emit("chat:rejected", { sessionId });
        });

        // Chat message
        socket.on("chat:message", (message) => {
            // message: { sessionId, senderId, text, tempId, type? }
            if (!message || !message.sessionId) return;

            const room = `chat_${message.sessionId}`;
            console.log("chat:message → room", room, "from", socket.id);

            // Emit to everyone in this session room (other side + sender for sync)
            io.to(room).emit("chat:message", message);
        });

        // Typing indicator
        socket.on("chat:typing", ({ sessionId, userId }) => {
            if (!sessionId) return;
            const room = `chat_${sessionId}`;
            socket.to(room).emit("chat:typing", { userId });
        });

        // =========================
        // DISCONNECT
        // =========================
        socket.on("disconnect", () => {
            console.log("Socket disconnected:", socket.id);

            socket.rooms.forEach((roomId) => {
                if (roomId !== socket.id) {
                    socket.to(roomId).emit("peer:left", { socketId: socket.id });
                }
            });
        });
    });
};
