// server/socket.js
module.exports = function (io) {
    io.on("connection", (socket) => {
        console.log("🔌 Socket connected:", socket.id);

        // =====================================================
        // DIRECT 1-TO-1 VIDEO CALL SIGNALING (FINAL VERSION)
        // =====================================================

        // Astrologer -> Client : call request
        socket.on("video:call_request", ({ to, roomId }) => {
            console.log("📞 Video call request →", to);
            io.to(to).emit("video:incoming_call", {
                from: socket.id,
                roomId,
            });
        });

        // Client accepts call
        socket.on("video:call_accept", ({ to, roomId }) => {
            console.log("✅ Call accepted →", to);
            io.to(to).emit("video:call_accepted", { roomId });
        });

        // Client rejects call
        socket.on("video:call_reject", ({ to, roomId }) => {
            console.log("❌ Call rejected →", to);
            io.to(to).emit("video:call_rejected", { roomId });
        });

        // ----------------------------
        // WEBRTC: OFFER
        // ----------------------------
        socket.on("call:offer", ({ offer, to }) => {
            io.to(to).emit("call:offer", {
                from: socket.id,
                offer,
            });
        });

        // ----------------------------
        // WEBRTC: ANSWER
        // ----------------------------
        socket.on("call:answer", ({ answer, to }) => {
            io.to(to).emit("call:answer", {
                from: socket.id,
                answer,
            });
        });

        // ----------------------------
        // WEBRTC: ICE CANDIDATES
        // ----------------------------
        socket.on("call:candidate", ({ candidate, to }) => {
            io.to(to).emit("call:candidate", {
                from: socket.id,
                candidate,
            });
        });

        // ----------------------------
        // END CALL
        // ----------------------------
        socket.on("call:end", ({ to, reason }) => {
            io.to(to).emit("call:end", { reason });
        });

        // =====================================================
        // CHAT SYSTEM (ROOM BASED) — This is correct
        // =====================================================

        socket.on("join_chat", ({ sessionId }) => {
            if (!sessionId) return;
            const room = `chat_${sessionId}`;
            socket.join(room);
            console.log(`💬 ${socket.id} joined ${room}`);
            socket.emit("chat:joined", { sessionId });
        });

        socket.on("chat:request", (payload) => {
            io.emit("chat:request", payload);
        });

        socket.on("chat:accept", ({ sessionId }) => {
            io.emit("chat:accepted", { sessionId });
        });

        socket.on("chat:reject", ({ sessionId }) => {
            io.emit("chat:rejected", { sessionId });
        });

        socket.on("chat:message", (msg) => {
            if (!msg || !msg.sessionId) return;
            const room = `chat_${msg.sessionId}`;
            io.to(room).emit("chat:message", msg);
        });

        socket.on("chat:typing", ({ sessionId, userId }) => {
            const room = `chat_${sessionId}`;
            socket.to(room).emit("chat:typing", { userId });
        });

        // =====================================================
        // DISCONNECT
        // =====================================================
        socket.on("disconnect", () => {
            console.log("❌ Socket disconnected:", socket.id);
        });
    });
};
