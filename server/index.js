const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
const BillingTracker = require("./services/billingTracker");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all for dev simplicity
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

// Make socket.io instance available to controllers
app.set("io", io);

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/otp", require("./routes/otpRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/wallet", require("./routes/walletRoutes"));
app.use("/api/astrologer", require("./routes/astrologerRoutes"));
app.use("/api/call", require("./routes/callRoutes"));
app.use("/api/chat", require("./routes/chatRoutes")); // NEW: Chat routes
app.use("/api/public", require("./routes/publicRoutes"));
app.use("/api/horoscope", require("./routes/horoscopeRoutes"));
app.use("/api/payment/phonepe", require("./routes/phonePeRoutes")); // PhonePe Payment Gateway
// Agora token endpoint
app.use("/api/agora", require("./routes/agoraRoutes"));

// Database Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err));

// Socket.IO Setup (Modular Handlers)
require("./socket")(io);

// Start Billing Tracker (Server-side time tracking)
const billingTracker = new BillingTracker(io);
billingTracker.start();

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  billingTracker.stop();
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.IO ready`);
  console.log(`💰 Billing Tracker active`);
  if (process.env.PHONEPE_AUTH_KEY) {
    console.log(`📲 PhonePe key configured`);
  } else {
    console.warn(`⚠️ PhonePe key missing (set PHONEPE_AUTH_KEY in .env)`);
  }
});
