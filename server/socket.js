// socket.js
module.exports = function (io) {
    io.on("connection", (socket) => {
        console.log("Socket connected:", socket.id);



        socket.on("video:call_request", ({ roomId, to }) => {
            console.log("Call request → sending to", to);
            io.to(to).emit("video:incoming_call", { from: socket.id });
        });

        socket.on("video:call_accept", ({ roomId, to }) => {
            console.log("Call accepted → notifying", to);
            io.to(to).emit("video:call_accepted");
        });

        socket.on("video:call_reject", ({ roomId, to }) => {
            console.log("Call rejected → notifying", to);
            io.to(to).emit("video:call_rejected");
        });
        // Join room
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
