// server/socket.js
const chatHandler = require('./socket/handlers/chat');
const presenceHandler = require('./socket/handlers/presence');
const { onlineUsers } = require('./socket/handlers/presence');

module.exports = function (io) {
    io.on("connection", (socket) => {
        console.log("🔌 Socket connected:", socket.id);

        // Initialize handlers
        presenceHandler(io, socket);
        chatHandler(io, socket);

        // =====================================================
        // VIDEO CALL SIGNALING
        // =====================================================

        // Client -> Server -> Astrologer: Call Request
        socket.on("call:request", ({ fromId, toId, fromName, fromImage }) => {
            console.log(`📞 Call request from ${fromId} to ${toId}`);
            const targetSocketId = onlineUsers.get(toId);

            if (targetSocketId) {
                io.to(targetSocketId).emit("call:request", {
                    fromId,
                    fromName,
                    fromImage,
                    fromSocketId: socket.id // Send caller's socket ID for direct reply
                });
            } else {
                // Astrologer offline
                console.log(`User ${toId} is offline`);
                socket.emit("call:offline");
            }
        });

        // Astrologer -> Server -> Client: Call Accepted
        socket.on("call:accept", ({ toSocketId, roomId }) => {
            console.log(`✅ Call accepted for socket ${toSocketId}`);
            io.to(toSocketId).emit("call:accepted", {
                roomId,
                fromSocketId: socket.id
            });
        });

        // Astrologer -> Server -> Client: Call Rejected
        socket.on("call:reject", ({ toSocketId }) => {
            console.log(`❌ Call rejected for socket ${toSocketId}`);
            io.to(toSocketId).emit("call:rejected");
        });

        // End Call
        socket.on("call:end", ({ toSocketId }) => {
            if (toSocketId) io.to(toSocketId).emit("call:end");
        });

        // ----------------------------
        // WEBRTC SIGNALING
        // ----------------------------
        // NOTE: WebRTC signaling is handled in socket/handlers/signaling.js
        // Duplicate handlers removed to prevent double-processing

        // =====================================================
        // AUDIO CALL SIGNALING
        // =====================================================

        // Client -> Server -> Astrologer: Audio Call Request
        socket.on("audio:request", ({ fromId, toId, fromName, fromImage }) => {
            console.log(`🎙️ Audio call request from ${fromId} to ${toId}`);
            const targetSocketId = onlineUsers.get(toId);

            if (targetSocketId) {
                io.to(targetSocketId).emit("audio:request", {
                    fromId,
                    fromName,
                    fromImage,
                    fromSocketId: socket.id
                });
            } else {
                console.log(`User ${toId} is offline`);
                socket.emit("audio:offline");
            }
        });

        // Astrologer -> Server -> Client: Audio Call Accepted
        socket.on("audio:accept", ({ toSocketId, roomId }) => {
            console.log(`✅ Audio call accepted for socket ${toSocketId}`);
            io.to(toSocketId).emit("audio:accepted", {
                roomId,
                fromSocketId: socket.id
            });
        });

        // Astrologer -> Server -> Client: Audio Call Rejected
        socket.on("audio:reject", ({ toSocketId }) => {
            console.log(`❌ Audio call rejected for socket ${toSocketId}`);
            io.to(toSocketId).emit("audio:rejected");
        });

        // End Audio Call
        socket.on("audio:end", ({ toSocketId }) => {
            if (toSocketId) io.to(toSocketId).emit("audio:end");
        });

        // Audio WebRTC Signaling
        socket.on("audio:offer", ({ toSocketId, offer }) => {
            console.log(`[SIGNAL] audio:offer from=${socket.id} to=${toSocketId}`);
            io.to(toSocketId).emit("audio:offer", { fromSocketId: socket.id, offer });
        });

        socket.on("audio:answer", ({ toSocketId, answer }) => {
            console.log(`[SIGNAL] audio:answer from=${socket.id} to=${toSocketId}`);
            io.to(toSocketId).emit("audio:answer", { fromSocketId: socket.id, answer });
        });

        socket.on("audio:candidate", ({ toSocketId, candidate }) => {
            console.log(`[SIGNAL] audio:candidate from=${socket.id} to=${toSocketId}`);
            io.to(toSocketId).emit("audio:candidate", { fromSocketId: socket.id, candidate });
        });

        // Video WebRTC Signaling (if separate)
        socket.on("call:offer", ({ roomId, offer }) => {
            // Note: Original code broadcast to room, but user guide suggests direct messaging.
            // Keeping original logic but adding logs.
            console.log(`[SIGNAL] call:offer from=${socket.id} to=room:${roomId}`);
            socket.to(roomId).emit("call:offer", { from: socket.id, offer });
        });

        socket.on("call:answer", ({ roomId, answer, to }) => {
            console.log(`[SIGNAL] call:answer from=${socket.id} to=${to}`);
            io.to(to).emit("call:answer", { from: socket.id, answer });
        });

        socket.on("call:candidate", ({ roomId, candidate, to }) => {
            console.log(`[SIGNAL] call:candidate from=${socket.id} to=${to}`);
            io.to(to).emit("call:candidate", { from: socket.id, candidate });
        });

        // =====================================================
        // DISCONNECT
        // =====================================================
        socket.on("disconnect", () => {
            console.log("❌ Socket disconnected:", socket.id);
        });
    });
};
