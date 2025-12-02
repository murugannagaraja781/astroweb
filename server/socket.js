// socket.js
module.exports = function (io) {
    io.on("connection", (socket) => {
        console.log("Socket connected:", socket.id);

        // ============================
        // 🔥 REAL-TIME CHAT FLOW
        // ============================

        // 1. Client requests chat
        socket.on("chat:request", ({ clientId, astrologerId }) => {
            console.log("Chat request from", clientId, "to", astrologerId);

            // sessionId = unique for that chat
            const sessionId = `${clientId}_${astrologerId}_${Date.now()}`;

            // Send request to astrologer
            io.to(astrologerId).emit("chat:incoming_request", {
                clientId,
                astrologerId,
                sessionId,
            });
        });

        // 2. Astrologer ACCEPTS
        socket.on("chat:accept", ({ sessionId, clientId, astrologerId }) => {
            console.log("Chat accepted:", sessionId);

            // Notify client instantly
            io.to(clientId).emit("chat:accepted", {
                sessionId,
                astrologerId,
            });

            // Notify astrologer also (optional)
            io.to(astrologerId).emit("chat:accepted_confirm", {
                sessionId,
            });
        });

        // 3. Astrologer REJECTS
        socket.on("chat:reject", ({ sessionId, clientId, astrologerId }) => {
            console.log("Chat rejected:", sessionId);

            io.to(clientId).emit("chat:rejected", {
                sessionId,
            });
        });

        // 4. Send messages inside chat
        socket.on("chat:message", ({ sessionId, senderId, text }) => {
            io.emit("chat:message", {
                sessionId,
                senderId,
                text,
                timestamp: new Date(),
            });
        });

        // 5. Typing event
        socket.on("chat:typing", ({ sessionId, userId }) => {
            io.emit("chat:typing", { sessionId, userId });
        });

        // ============================
        // 🔥 VIDEO CALL FLOW (your existing)
        // ============================

        socket.on("video:call_request", ({ roomId, to }) => {
            io.to(to).emit("video:incoming_call", { from: socket.id });
        });

        socket.on("video:call_accept", ({ roomId, to }) => {
            io.to(to).emit("video:call_accepted");
        });

        socket.on("video:call_reject", ({ roomId, to }) => {
            io.to(to).emit("video:call_rejected");
        });

        // Join room
        socket.on("join", (roomId) => {
            socket.join(roomId);
            const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);

            socket.to(roomId).emit("peer:joined", { socketId: socket.id });

            const others = clients.filter((id) => id !== socket.id);
            socket.emit("joined", { roomId, others });
        });

        // Offer
        socket.on("call:offer", ({ roomId, offer, to }) => {
            if (to) io.to(to).emit("call:offer", { from: socket.id, offer });
            else socket.to(roomId).emit("call:offer", { from: socket.id, offer });
        });

        // Answer
        socket.on("call:answer", ({ roomId, answer, to }) => {
            if (to) io.to(to).emit("call:answer", { from: socket.id, answer });
            else socket.to(roomId).emit("call:answer", { from: socket.id, answer });
        });

        // Candidate
        socket.on("call:candidate", ({ roomId, candidate, to }) => {
            if (to) io.to(to).emit("call:candidate", { from: socket.id, candidate });
            else socket.to(roomId).emit("call:candidate", { from: socket.id, candidate });
        });

        // Leave
        socket.on("leave", (roomId) => {
            socket.leave(roomId);
            socket.to(roomId).emit("peer:left", { socketId: socket.id });
        });

        // Disconnect
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
