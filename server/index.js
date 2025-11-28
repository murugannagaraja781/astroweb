// index.js
require("dotenv").config();
const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const { Server } = require("socket.io");
const path = require("path");

// Optional service - may or may not be present in your project
let BillingTracker;
try {
  BillingTracker = require("./services/billingTracker");
} catch (e) {
  console.warn("[WARN] BillingTracker not found or failed to load. Continuing without it.");
}

const app = express();
const server = http.createServer(app);

// -------------------------
// CORS - keep it explicit
// -------------------------
const allowedOrigins = [
  process.env.CLIENT_URL,
  "https://astroweb-beryl.vercel.app",
  "http://localhost:3000",
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // allow non-browser requests like curl, server-to-server (origin == undefined)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-auth-token"],
  })
);
app.options("*", cors());

// -------------------------
// Body parser
// -------------------------
app.use(express.json({ limit: "10mb" }));

// -------------------------
// ROUTES - require after middleware
// -------------------------
/**
 * NOTE: route filename must exactly match on disk:
 * routes/chatRoutes.js
 */
const chatRoutes = require("./routes/chatRoutes");
app.use("/api/chat", chatRoutes);

// health
app.get("/health", (req, res) =>
  res.json({
    status: "ok",
    time: new Date().toISOString(),
    env: process.env.NODE_ENV || "development",
  })
);

// -------------------------
// SOCKET.IO
// -------------------------
const io = new Server(server, {
  cors: {
    origin: allowedOrigins.length ? allowedOrigins : "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
  // transports: ["websocket"], // optional; keep default for compatibility
});

// expose io to routes/controllers via app
app.set("io", io);

// In-memory online user mapping (userId -> socketId)
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("[io] connected:", socket.id);

  // join personal room by userId
  socket.on("join", (userId) => {
    try {
      if (!userId) return;
      socket.join(userId.toString());
      onlineUsers.set(userId.toString(), socket.id);
      console.log(`[io] user ${userId} joined room ${userId}`);
    } catch (e) {
      console.error("[io] join error", e);
    }
  });

  // join a chat session room
  socket.on("join_room", (roomId) => {
    try {
      if (!roomId) return;
      socket.join(roomId.toString());
      console.log(`[io] socket ${socket.id} joined room ${roomId}`);
    } catch (e) {
      console.error("[io] join_room error", e);
    }
  });

  // send message to a userId (room) or session room
  socket.on("sendMessage", async (payload) => {
    try {
      const { to, roomId, from, message } = payload;
      // Prefer roomId if present, else to (userId)
      if (roomId) {
        io.to(roomId.toString()).emit("receiveMessage", {
          from,
          message,
          time: new Date(),
        });
      } else if (to) {
        io.to(to.toString()).emit("receiveMessage", {
          from,
          message,
          time: new Date(),
        });
      }
      // call billing tracker if available and method exists
      try {
        if (BillingTracker && typeof BillingTracker.updateChatUsage === "function") {
          BillingTracker.updateChatUsage(from, to || roomId);
        } else if (BillingTracker && typeof BillingTracker === "function") {
          // if it's a class with instance methods, we don't know. ignore.
        }
      } catch (btErr) {
        console.warn("[BillingTracker] update failed:", btErr);
      }
    } catch (err) {
      console.error("[io] sendMessage error:", err);
    }
  });

  socket.on("typing", ({ to, roomId, from }) => {
    try {
      if (roomId) io.to(roomId.toString()).emit("typingResponse", { from });
      else if (to) io.to(to.toString()).emit("typingResponse", { from });
    } catch (e) {
      console.error("[io] typing error", e);
    }
  });

  socket.on("disconnect", () => {
    // remove from onlineUsers
    for (const [userId, sid] of onlineUsers.entries()) {
      if (sid === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
    console.log("[io] disconnected:", socket.id);
  });
});

// -------------------------
// DATABASE
// -------------------------
const MONGO_URI = process.env.MONGO_URI || process.env.MONGO_URL;
if (!MONGO_URI) {
  console.error("[FATAL] MONGO_URI is not set. Set it in Railway variables.");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI, {
    autoIndex: true,
    // useNewUrlParser/useUnifiedTopology not required on newer mongoose
  })
  .then(() => console.log("MongoDB connected ✔"))
  .catch((err) => {
    console.error("MongoDB connection error ❌", err);
    process.exit(1);
  });

// -------------------------
// OPTIONAL: BillingTracker start (if class exported)
if (BillingTracker) {
  try {
    if (typeof BillingTracker === "function") {
      // if it's a class constructor
      const btInstance = new BillingTracker(io);
      if (typeof btInstance.start === "function") {
        btInstance.start();
      }
    } else if (typeof BillingTracker.start === "function") {
      BillingTracker.start(io);
    }
  } catch (btErr) {
    console.warn("[WARN] BillingTracker initialization failed:", btErr);
  }
}

// -------------------------
// START
// -------------------------
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// Export for testing if needed
module.exports = { app, server, io };
