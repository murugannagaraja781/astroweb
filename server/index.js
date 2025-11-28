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

// IMPORTANT: UPDATE THIS
const CLIENT_URL = process.env.CLIENT_URL || "https://astroweb-beryl.vercel.app";

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
  allowEIO3: true
});

app.use(cors({
  origin: CLIENT_URL,
  credentials: true,
}));

app.use(express.json());

// expose socket
app.set("io", io);

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/otp", require("./routes/otpRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/wallet", require("./routes/walletRoutes"));
app.use("/api/astrologer", require("./routes/astrologerRoutes"));
app.use("/api/call", require("./routes/callRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));
app.use("/api/public", require("./routes/publicRoutes"));
app.use("/api/horoscope", require("./routes/horoscopeRoutes"));
app.use("/api/payment/phonepe", require("./routes/phonePeRoutes"));
app.use("/api/agora", require("./routes/agoraRoutes"));

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    time: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// DB CONNECT
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Mongo Connected"))
  .catch(err => console.error("Mongo Error:", err));

// SOCKET HANDLER
require("./socket")(io);

// Billing tracker
const billingTracker = new BillingTracker(io);
billingTracker.start();

// PORT FIX FOR RAILWAY
const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
