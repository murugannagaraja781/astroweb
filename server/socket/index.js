const chatHandler = require('./handlers/chat');
const signalingHandler = require('./handlers/signaling');
const presenceHandler = require('./handlers/presence');

/**
 * Socket.IO Setup
 * Organizes all socket handlers
 */

module.exports = (io) => {
    io.on('connection', (socket) => {
        const username = socket.handshake.query.username;
        socket.username = username;
        console.log(`✅ User Connected: ${socket.id} (Name: ${username || 'Unknown'})`);

        // Register all handlers
        chatHandler(io, socket);
        signalingHandler(io, socket);
        presenceHandler(io, socket);
        require('./handlers/p2pCall')(io, socket);

        // Handle disconnect
        socket.on('disconnect', () => {
            console.log('❌ User Disconnected:', socket.id);
        });
    });

    return io;
};
