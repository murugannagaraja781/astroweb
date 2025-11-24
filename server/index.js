const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all for dev simplicity
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/otp', require('./routes/otpRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/wallet', require('./routes/walletRoutes'));
app.use('/api/astrologer', require('./routes/astrologerRoutes'));
app.use('/api/call', require('./routes/callRoutes'));
app.use('/api/public', require('./routes/publicRoutes'));
app.use('/api/horoscope', require('./routes/horoscopeRoutes'));

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// Socket.io
io.on('connection', (socket) => {
  console.log('User Connected:', socket.id);

  socket.on('join', (identifier) => {
    socket.join(identifier);
    console.log(`User ${socket.id} joined ${identifier}`);
  });

  socket.on('callUser', ({ userToCall, signalData, from, name, type }) => {
    io.to(userToCall).emit('callUser', { signal: signalData, from, name, type });
  });

  socket.on('answerCall', (data) => {
    console.log('Answer call received:', data);
    io.to(data.to).emit('callAccepted', { accepted: true });
  });

  socket.on('rejectCall', (data) => {
    io.to(data.to).emit('callRejected');
  });

  socket.on('sendMessage', (data) => {
    io.to(data.roomId).emit('receiveMessage', data);
  });

  socket.on('typing', (data) => {
    socket.to(data.roomId).emit('displayTyping', data);
  });

  socket.on('stopTyping', (data) => {
    socket.to(data.roomId).emit('hideTyping');
  });

  socket.on('endCall', ({ to }) => {
    io.to(to).emit('callEnded');
  });

  socket.on('disconnect', () => {
    socket.broadcast.emit('callEnded');
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
