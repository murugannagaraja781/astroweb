// index.js
require("dotenv").config();
const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const { Server } = require("socket.io");

// Optional service
let BillingTracker;
try {
  BillingTracker = require("./services/billingTracker");
} catch (e) {
  console.warn("[WARN] BillingTracker not found. Continuing without it.");
}

const app = express();
const server = http.createServer(app);

// -----------------------------------
// CORS CONFIG (Express 5 SAFE)
// -----------------------------------
const allowedOrigins = [
  process.env.CLIENT_URL,
  "https://astroweb-beryl.vercel.app",
  "http://localhost:3000",
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // Non-browser
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-auth-token"],
  })
);

// ❌ ILLEGAL IN EXPRESS 5 (removed):
// app.options("*", cors());

// -----------------------------------
// BODY PARSER
// -----------------------------------
app.use(express.json({ limit: "10mb" }));

// -----------------------------------
// ROUTES
// -----------------------------------
const chatRoutes = require("./routes/chatRoutes");
app.use("/api/chat", chatRoutes);

// Health check
app.get("/health", (req, res) =>
  res.json({
    status: "ok",
    time: new Date().toISOString(),
    env: process.env.NODE_ENV || "dev",
  })
);

// -----------------------------------
// SOCKET.IO
// -----------------------------------
const io = new Server(server, {
  cors: {
    origin: allowedOrigins.length ? allowedOrigins : "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.set("io", io);

const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("[io] connected:", socket.id);

  socket.on("join", (userId) => {
    if (!userId) return;
    socket.join(userId.toString());
    onlineUsers.set(userId.toString(), socket.id);
  });

  socket.on("join_room", (roomId) => {
    if (!roomId) return;
    socket.join(roomId.toString());
  });

  socket.on("sendMessage", async (payload) => {
    try {
      const { to, roomId, from, message } = payload;

      const target = roomId ? roomId.toString() : to?.toString();
      if (!target) return;

      io.to(target).emit("receiveMessage", {
        from,
        message,
        time: new Date(),
      });

      // Billing tracker
      try {
        if (BillingTracker?.updateChatUsage) {
          BillingTracker.updateChatUsage(from, target);
        }
      } catch (e) {
        console.warn("[BillingTracker] update failed:", e);
      }
    } catch (e) {
      console.error("[io] sendMessage error:", e);
    }
  });

  socket.on("typing", ({ to, roomId, from }) => {
    const target = roomId ? roomId.toString() : to?.toString();
    if (!target) return;
    io.to(target).emit("typingResponse", { from });
  });

  socket.on("disconnect", () => {
    for (const [userId, sid] of onlineUsers.entries()) {
      if (sid === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
  });
});

// -----------------------------------
// MONGO DB
// -----------------------------------
const MONGO_URI = process.env.MONGO_URI || process.env.MONGO_URL;

if (!MONGO_URI) {
  console.error("[FATAL] MONGO_URI missing in Railway variables");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected ✔"))
  .catch((err) => {
    console.error("Mongo connection error ❌", err);
    process.exit(1);
  });

// -----------------------------------
// BILLING TRACKER
// -----------------------------------
if (BillingTracker) {
  try {
    if (typeof BillingTracker === "function") {
      const tracker = new BillingTracker(io);
      if (tracker.start) tracker.start();
    } else if (BillingTracker.start) {
      BillingTracker.start(io);
    }
  } catch (e) {
    console.warn("[BillingTracker] init failed:", e);
  }
}

// -----------------------------------
// START SERVER
// -----------------------------------
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));

module.exports = { app, server, io };
