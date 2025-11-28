// -------------------------
// SERVER SETUP
// -------------------------
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");

const BillingTracker = require("./services/billingTracker");
const chatRoutes = require("./routes/chatRoute");

dotenv.config();

const app = express();
const server = http.createServer(app);

// -------------------------
// MIDDLEWARE
// -------------------------
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
}));

app.use(express.json());

// -------------------------
// ROUTES
// -------------------------
app.use("/api/chat", chatRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Server running successfully ✔");
});

// -------------------------
// SOCKET.IO
// -------------------------
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Store users
let onlineUsers = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join personal room
  socket.on("joinRoom", ({ userId }) => {
    if (!userId) return;
    socket.join(userId);
    onlineUsers[userId] = socket.id;
    console.log("User joined room:", userId);
  });

  // One-to-one message
  socket.on("sendMessage", async (data) => {
    try {
      const { senderId, receiverId, message } = data;

      if (!receiverId) return;

      io.to(receiverId).emit("receiveMessage", {
        senderId,
        message,
        time: new Date(),
      });

      // Billing tracker update
      BillingTracker.updateChatUsage(senderId, receiverId);

      console.log("Message sent to:", receiverId);
    } catch (err) {
      console.log("Error sending message", err);
    }
  });

  // Typing event
  socket.on("typing", ({ senderId, receiverId }) => {
    io.to(receiverId).emit("typingResponse", { senderId });
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    // Remove user from onlineUsers
    for (let uid in onlineUsers) {
      if (onlineUsers[uid] === socket.id) {
        delete onlineUsers[uid];
      }
    }
  });
});

// -------------------------
// MONGODB CONNECTION
// -------------------------
mongoose
  .connect(process.env.MONGO_URL, {
    autoIndex: true,
  })
  .then(() => console.log("MongoDB connected ✔"))
  .catch((err) => console.log("MongoDB error ❌", err));

// -------------------------
// START SERVER
// -------------------------
const PORT = process.env.PORT || 9001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
