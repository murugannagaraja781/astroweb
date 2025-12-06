/**
 * Presence Socket Handlers
 * Handles user online/offline status
 */

const onlineUsers = new Map(); // userId -> socketId

const AstrologerProfile = require('../../models/AstrologerProfile');

module.exports = (io, socket) => {

    // User comes online
    socket.on('user_online', async (data) => {
        const { userId } = data;

        if (!userId || typeof userId !== 'string' || userId === '[object Object]') {
            console.warn(`[WARN] Invalid userId received in user_online:`, userId);
            return;
        }

        onlineUsers.set(String(userId), socket.id);
        console.log(`[DEBUG] Map Updated: User ${userId} -> Socket ${socket.id}`);
        console.log(`[DEBUG] Current Map Size: ${onlineUsers.size}`);

        // Update DB
        try {
            // Only update if it looks like a valid ObjectId (24 hex chars)
            if (/^[0-9a-fA-F]{24}$/.test(userId)) {
                await AstrologerProfile.findOneAndUpdate({ userId }, { isOnline: true, lastActive: new Date() });
            }
        } catch (err) {
            console.error('Error updating online status:', err);
        }

        // Broadcast to all clients
        io.emit('user_status_changed', {
            userId,
            status: 'online',
            lastSeen: new Date()
        });

        console.log(`User ${userId} is online`);
    });

    // User goes offline
    socket.on('user_offline', async (data) => {
        const { userId } = data;
        onlineUsers.delete(userId);

        // Update DB
        try {
            if (userId && /^[0-9a-fA-F]{24}$/.test(userId)) {
                await AstrologerProfile.findOneAndUpdate({ userId }, { isOnline: false, lastActive: new Date() });
            }
        } catch (err) {
            console.error('Error updating offline status:', err);
        }

        io.emit('user_status_changed', {
            userId,
            status: 'offline',
            lastSeen: new Date()
        });

        console.log(`User ${userId} is offline`);
    });

    // Get online users
    socket.on('get_online_users', () => {
        const onlineUserIds = Array.from(onlineUsers.keys());
        socket.emit('online_users_list', { users: onlineUserIds });
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
        // Find and remove user from online list
        for (const [userId, socketId] of onlineUsers.entries()) {
            if (socketId === socket.id) {
                onlineUsers.delete(userId);

                // Update DB
                try {
                    if (userId && /^[0-9a-fA-F]{24}$/.test(userId)) {
                        await AstrologerProfile.findOneAndUpdate({ userId }, { isOnline: false, lastActive: new Date() });
                    } else {
                        console.warn(`[WARN] Skipping DB update for invalid userId on disconnect: ${userId}`);
                    }
                } catch (err) {
                    console.error('Error updating offline status on disconnect:', err);
                }

                io.emit('user_status_changed', {
                    userId,
                    status: 'offline',
                    lastSeen: new Date()
                });
                console.log(`User ${userId} disconnected`);
                break;
            }
        }
    });
};

// Export online users map for other handlers
module.exports.onlineUsers = onlineUsers;
