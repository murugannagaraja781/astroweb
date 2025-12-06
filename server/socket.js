// server/socket.js
const chatHandler = require('./socket/handlers/chat');
const presenceHandler = require('./socket/handlers/presence');
const signalingHandler = require('./socket/handlers/signaling');
const { onlineUsers } = require('./socket/handlers/presence');

module.exports = function (io) {
    io.on("connection", (socket) => {
        console.log("🔌 Socket connected:", socket.id);

        // Initialize handlers
        presenceHandler(io, socket);
        chatHandler(io, socket);
        signalingHandler(io, socket);

        // =====================================================
        // DISCONNECT
        // =====================================================
        socket.on("disconnect", () => {
            console.log("❌ Socket disconnected:", socket.id);
        });
    });
};
