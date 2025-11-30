/**
 * Signaling Socket Handler
 * Handles WebRTC signaling for video calls
 */

module.exports = (io, socket) => {
    // Join Room
    socket.on("join-room", (roomId) => {
        socket.join(roomId);
        console.log(`User ${socket.id} joined room ${roomId}`);
    });

    // Call User
    socket.on("callUser", (data) => {
        const { userToCall, signalData, from, name } = data;
        io.to(userToCall).emit("callUser", {
            signal: signalData,
            from,
            name
        });
    });

    // Answer Call
    socket.on("answerCall", (data) => {
        io.to(data.to).emit("callAccepted", data.signal);
    });

    // End Call
    socket.on("endCall", (data) => {
        const { to } = data;
        io.to(to).emit("callEnded");
    });
};
