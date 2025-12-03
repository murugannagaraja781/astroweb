# React Native App Development Prompt

## Project Overview
Build a React Native mobile app for an Astrology consultation platform with real-time chat, video/audio calls, and wallet system.

## Base URL
- **Development:** `http://localhost:9001`
- **Production:** `https://astroweb-production.up.railway.app`

## Tech Stack Required
- React Native (Expo or CLI)
- Socket.IO Client (for real-time features)
- WebRTC (for video/audio calls)
- Axios (for API calls)
- AsyncStorage (for token storage)
- React Navigation (for routing)

---

## Complete API Documentation

### 1. AUTHENTICATION APIs

#### Register User
```
POST /api/auth/register
Headers: None
Body: {
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "client" // or "astrologer" or "admin"
}
Response: {
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "client"
  }
}
```

#### Login
```
POST /api/auth/login
Headers: None
Body: {
  "email": "john@example.com",
  "password": "password123"
}
Response: {
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "client"
  }
}
```

#### Get Current User
```
GET /api/auth/me
Headers: {
  "Authorization": "Bearer <token>"
}
Response: {
  "id": "user_id",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "client",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

#### Logout
```
POST /api/auth/logout
Headers: {
  "Authorization": "Bearer <token>"
}
Response: {
  "msg": "Logged out successfully"
}
```

---

### 2. OTP APIs

#### Send OTP
```
POST /api/otp/send
Headers: None
Body: {
  "phone": "+919876543210"
}
Response: {
  "success": true,
  "msg": "OTP sent successfully"
}
```

#### Verify OTP
```
POST /api/otp/verify
Headers: None
Body: {
  "phone": "+919876543210",
  "otp": "123456"
}
Response: {
  "success": true,
  "token": "jwt_token_here",
  "user": { ... }
}
```

---

### 3. PUBLIC APIs (No Auth Required)

#### Get All Astrologers
```
GET /api/public/astrologers
Headers: None
Response: [
  {
    "_id": "astrologer_id",
    "userId": "user_id",
    "name": "Astrologer Name",
    "isOnline": true,
    "profile": {
      "specialties": ["Vedic", "Numerology"],
      "languages": ["English", "Hindi"],
      "experience": 10,
      "ratePerMinute": 5,
      "bio": "Expert astrologer..."
    }
  }
]
```

#### Get Banners
```
GET /api/public/banners
Headers: None
Response: [
  {
    "_id": "banner_id",
    "title": "Special Offer",
    "imageUrl": "https://...",
    "link": "/offers",
    "isActive": true
  }
]
```

#### Get Offers
```
GET /api/public/offers
Headers: None
Response: [
  {
    "_id": "offer_id",
    "title": "50% Off First Consultation",
    "description": "...",
    "discount": 50,
    "validUntil": "2024-12-31"
  }
]
```

#### Get Settings
```
GET /api/public/settings
Headers: None
Response: {
  "minRecharge": 100,
  "maxRecharge": 10000,
  "supportPhone": "+919876543210",
  "supportEmail": "support@astro.com"
}
```

---

### 4. WALLET APIs

#### Get Balance
```
GET /api/wallet/balance
Headers: {
  "Authorization": "Bearer <token>"
}
Response: {
  "_id": "wallet_id",
  "userId": "user_id",
  "balance": 500,
  "transactions": [
    {
      "amount": 100,
      "type": "credit",
      "description": "Welcome Bonus",
      "date": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### Add Money
```
POST /api/wallet/add
Headers: {
  "Authorization": "Bearer <token>"
}
Body: {
  "amount": 500
}
Response: {
  "_id": "wallet_id",
  "userId": "user_id",
  "balance": 1000,
  "transactions": [...]
}
```

---

### 5. ASTROLOGER APIs

#### Get Profile
```
GET /api/astrologer/profile
Headers: {
  "Authorization": "Bearer <token>"
}
Response: {
  "_id": "profile_id",
  "userId": "user_id",
  "name": "Astrologer Name",
  "isOnline": true,
  "profile": {
    "specialties": ["Vedic"],
    "languages": ["English"],
    "experience": 10,
    "ratePerMinute": 5,
    "bio": "..."
  }
}
```

#### Update Profile
```
PUT /api/astrologer/profile
Headers: {
  "Authorization": "Bearer <token>"
}
Body: {
  "name": "Updated Name",
  "profile": {
    "specialties": ["Vedic", "Tarot"],
    "languages": ["English", "Hindi"],
    "experience": 12,
    "ratePerMinute": 10,
    "bio": "Updated bio..."
  }
}
Response: { updated profile }
```

#### Toggle Online Status
```
PUT /api/astrologer/status
Headers: {
  "Authorization": "Bearer <token>"
}
Body: None
Response: {
  "isOnline": true
}
```

#### Get Earnings
```
GET /api/astrologer/earnings
Headers: {
  "Authorization": "Bearer <token>"
}
Response: {
  "totalEarnings": 5000,
  "thisMonth": 1200,
  "lastMonth": 800
}
```

#### Get Call History
```
GET /api/astrologer/call-history
Headers: {
  "Authorization": "Bearer <token>"
}
Response: [
  {
    "callId": "...",
    "clientName": "John Doe",
    "duration": 15,
    "amount": 75,
    "date": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### 6. CHAT APIs

#### Request Chat Session
```
POST /api/chat/request
Headers: {
  "Authorization": "Bearer <token>"
}
Body: {
  "astrologerId": "astrologer_profile_id"
}
Response: {
  "sessionId": "uuid-here",
  "ratePerMinute": 5
}
```

#### Get Pending Sessions (Astrologer)
```
GET /api/chat/sessions/pending
Headers: {
  "Authorization": "Bearer <token>"
}
Response: [
  {
    "sessionId": "uuid",
    "status": "requested",
    "ratePerMinute": 5,
    "createdAt": "...",
    "client": {
      "id": "client_id",
      "name": "John Doe"
    }
  }
]
```

#### Get Session Info
```
GET /api/chat/session/:sessionId
Headers: {
  "Authorization": "Bearer <token>"
}
Response: {
  "sessionId": "uuid",
  "client": { "id": "...", "name": "..." },
  "astrologer": { "id": "...", "name": "..." },
  "ratePerMinute": 5,
  "status": "active"
}
```

#### Get Chat History
```
GET /api/chat/history/session/:sessionId
Headers: {
  "Authorization": "Bearer <token>"
}
Response: {
  "sessionId": "uuid",
  "messages": [
    {
      "_id": "msg_id",
      "sender": "user_id",
      "message": "Hello",
      "type": "text",
      "timestamp": "..."
    }
  ]
}
```

#### Accept Chat Session
```
POST /api/chat/accept
Headers: {
  "Authorization": "Bearer <token>"
}
Body: {
  "sessionId": "uuid",
  "clientId": "client_id",
  "ratePerMinute": 5
}
Response: {
  "success": true,
  "msg": "Session accepted. ₹5 deducted",
  "remainingBalance": 495
}
```

#### Reject Chat Session
```
POST /api/chat/reject
Headers: {
  "Authorization": "Bearer <token>"
}
Body: {
  "sessionId": "uuid"
}
Response: {
  "success": true,
  "msg": "Chat session rejected"
}
```

---

### 7. HOROSCOPE APIs

#### Get Daily Horoscope
```
GET /api/horoscope/daily?sign=aries&lang=en&date=2024-12-03
Headers: None
Response: {
  "sign": "aries",
  "date": "2024-12-03",
  "prediction": "Today is a good day...",
  "luckyNumber": 7,
  "luckyColor": "Red"
}
```

#### Get All Horoscopes
```
GET /api/horoscope/all?lang=en&date=2024-12-03
Headers: None
Response: [
  {
    "sign": "aries",
    "prediction": "...",
    "luckyNumber": 7
  },
  ...
]
```

#### Get Zodiac Signs
```
GET /api/horoscope/signs
Headers: None
Response: [
  { "id": "aries", "name": "Aries", "symbol": "♈" },
  { "id": "taurus", "name": "Taurus", "symbol": "♉" },
  ...
]
```

#### Search Places
```
GET /api/horoscope/places?q=Chennai
Headers: None
Response: [
  {
    "name": "Chennai",
    "country": "India",
    "lat": 13.0827,
    "lon": 80.2707
  }
]
```

#### Generate Horoscope
```
POST /api/horoscope/generate
Headers: None
Body: {
  "name": "John Doe",
  "date": "1990-01-15",
  "time": "14:30",
  "place": "Chennai",
  "lat": 13.0827,
  "lon": 80.2707
}
Response: {
  "birthChart": { ... },
  "predictions": { ... }
}
```

---

### 8. CHART APIs

#### Generate Birth Chart
```
POST /api/chart/birth-chart
Headers: None
Body: {
  "name": "John Doe",
  "date": "1990-01-15",
  "time": "14:30",
  "lat": 13.0827,
  "lon": 80.2707
}
Response: {
  "chart": { ... },
  "planets": { ... }
}
```

#### Generate Navamsa Chart
```
POST /api/chart/navamsa
Headers: None
Body: { same as birth chart }
Response: { navamsa chart data }
```

#### Calculate Porutham (Compatibility)
```
POST /api/chart/porutham
Headers: None
Body: {
  "person1": {
    "name": "John",
    "date": "1990-01-15",
    "time": "14:30",
    "lat": 13.0827,
    "lon": 80.2707
  },
  "person2": {
    "name": "Jane",
    "date": "1992-05-20",
    "time": "10:15",
    "lat": 13.0827,
    "lon": 80.2707
  }
}
Response: {
  "compatibility": 85,
  "details": { ... }
}
```

---

### 9. CALL APIs

#### Initiate Call
```
POST /api/call/initiate
Headers: {
  "Authorization": "Bearer <token>"
}
Body: {
  "astrologerId": "astrologer_id",
  "type": "video" // or "audio"
}
Response: {
  "callId": "call_id",
  "roomId": "room_id"
}
```

#### End Call
```
POST /api/call/end
Headers: {
  "Authorization": "Bearer <token>"
}
Body: {
  "callId": "call_id",
  "duration": 15
}
Response: {
  "success": true,
  "totalCost": 75
}
```

#### Get Call History
```
GET /api/call/history
Headers: {
  "Authorization": "Bearer <token>"
}
Response: [
  {
    "callId": "...",
    "astrologerName": "...",
    "duration": 15,
    "cost": 75,
    "date": "..."
  }
]
```

---

### 10. AGORA TOKEN (for Video/Audio)

#### Get Agora Token
```
GET /api/agora/token?channel=room123&uid=12345
Headers: {
  "Authorization": "Bearer <token>"
}
Response: {
  "token": "agora_token_here",
  "channel": "room123",
  "uid": 12345
}
```

---

### 11. PHONEPE PAYMENT

#### Initiate Payment
```
POST /api/phonepe/initiate
Headers: {
  "Authorization": "Bearer <token>"
}
Body: {
  "amount": 500,
  "userId": "user_id"
}
Response: {
  "success": true,
  "paymentUrl": "https://phonepe.com/...",
  "transactionId": "txn_id"
}
```

#### Check Payment Status
```
POST /api/phonepe/status/:transactionId
Headers: {
  "Authorization": "Bearer <token>"
}
Response: {
  "status": "success",
  "amount": 500,
  "transactionId": "txn_id"
}
```

---

### 12. ADMIN APIs (Admin Only)

#### Get All Users
```
GET /api/admin/users
Headers: {
  "Authorization": "Bearer <admin_token>"
}
Response: [
  {
    "id": "...",
    "name": "...",
    "email": "...",
    "role": "client",
    "walletBalance": 500
  }
]
```

#### Add Money to User
```
POST /api/admin/wallet/add
Headers: {
  "Authorization": "Bearer <admin_token>"
}
Body: {
  "userId": "user_id",
  "amount": 1000
}
Response: {
  "success": true,
  "newBalance": 1500
}
```

#### Get Stats
```
GET /api/admin/stats
Headers: {
  "Authorization": "Bearer <admin_token>"
}
Response: {
  "totalUsers": 1000,
  "totalAstrologers": 50,
  "totalRevenue": 50000,
  "activeUsers": 200
}
```

---

## Socket.IO Events

### Connection
```javascript
const socket = io('http://localhost:9001', {
  transports: ['websocket', 'polling'],
  auth: { token: 'jwt_token_here' }
});
```

### Events to Emit (Client → Server)

#### User Online
```javascript
socket.emit('user_online', { userId: 'user_id' });
```

#### Video Call Request
```javascript
socket.emit('call:request', {
  fromId: 'client_id',
  toId: 'astrologer_user_id',
  fromName: 'John Doe',
  fromImage: 'avatar_url'
});
```

#### Audio Call Request
```javascript
socket.emit('audio:request', {
  fromId: 'client_id',
  toId: 'astrologer_user_id',
  fromName: 'John Doe',
  fromImage: 'avatar_url'
});
```

#### Accept Call
```javascript
socket.emit('call:accept', {
  toSocketId: 'caller_socket_id',
  roomId: 'room_id'
});
```

#### Reject Call
```javascript
socket.emit('call:reject', {
  toSocketId: 'caller_socket_id'
});
```

#### WebRTC Signaling
```javascript
// Offer
socket.emit('call:offer', {
  toSocketId: 'peer_socket_id',
  offer: rtcOffer
});

// Answer
socket.emit('call:answer', {
  toSocketId: 'peer_socket_id',
  answer: rtcAnswer
});

// ICE Candidate
socket.emit('call:candidate', {
  toSocketId: 'peer_socket_id',
  candidate: iceCandidate
});
```

#### Chat Message
```javascript
socket.emit('chat:message', {
  sessionId: 'session_id',
  message: 'Hello',
  type: 'text'
});
```

### Events to Listen (Server → Client)

#### Call Request Received
```javascript
socket.on('call:request', (data) => {
  // data: { fromId, fromName, fromImage, fromSocketId }
});
```

#### Call Accepted
```javascript
socket.on('call:accepted', (data) => {
  // data: { roomId, fromSocketId }
});
```

#### Call Rejected
```javascript
socket.on('call:rejected', () => {
  // Handle rejection
});
```

#### WebRTC Signaling
```javascript
socket.on('call:offer', ({ fromSocketId, offer }) => {
  // Handle offer
});

socket.on('call:answer', ({ answer }) => {
  // Handle answer
});

socket.on('call:candidate', ({ candidate }) => {
  // Handle ICE candidate
});
```

#### Chat Message Received
```javascript
socket.on('chat:message', (data) => {
  // data: { sender, message, type, timestamp }
});
```

---

## React Native Implementation Guide

### 1. Install Dependencies
```bash
npm install axios socket.io-client @react-native-async-storage/async-storage
npm install @react-navigation/native @react-navigation/stack
npm install react-native-webrtc
```

### 2. API Service Setup
```javascript
// services/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://localhost:9001/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### 3. Socket Service
```javascript
// services/socket.js
import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

let socket = null;

export const connectSocket = async () => {
  const token = await AsyncStorage.getItem('token');
  socket = io('http://localhost:9001', {
    transports: ['websocket', 'polling'],
    auth: { token }
  });
  return socket;
};

export const getSocket = () => socket;
```

### 4. Auth Context
```javascript
// context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      try {
        const res = await api.get('/auth/me');
        setUser(res.data);
      } catch (err) {
        await AsyncStorage.removeItem('token');
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    await AsyncStorage.setItem('token', res.data.token);
    setUser(res.data.user);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

---

## Key Features to Implement

1. **Authentication** - Login/Register with JWT
2. **Astrologer List** - Browse online astrologers
3. **Wallet** - Add money, check balance
4. **Chat** - Real-time text chat with Socket.IO
5. **Video/Audio Calls** - WebRTC implementation
6. **Horoscope** - Daily predictions
7. **Profile** - User/Astrologer profile management
8. **Payment** - PhonePe integration
9. **Notifications** - Push notifications for calls/messages

---

## Total APIs: 60+

- Authentication: 4
- OTP: 2
- Public: 4
- Wallet: 2
- Astrologer: 6
- Chat: 12
- Horoscope: 6
- Chart: 5
- Call: 3
- Agora: 1
- PhonePe: 2
- Admin: 13+

---

Use this documentation to build a complete React Native app with all features! 🚀
