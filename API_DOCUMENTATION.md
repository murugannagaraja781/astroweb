# AstroWeb API Documentation

Complete reference for all API endpoints used in the AstroWeb platform.

---

## Base URL
- **Development**: `http://localhost:5000`
- **Production**: `https://astroweb-production.up.railway.app`

---

## Authentication

All authenticated requests require a JWT token in the Authorization header:
```javascript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

### POST `/api/auth/register`
**Purpose**: Register a new user (client/astrologer/admin)

**Request**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "role": "client"  // "client" | "astrologer" | "admin"
}
```

**Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "user_123",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "client"
  }
}
```

### POST `/api/auth/login`
**Purpose**: Login existing user

**Request**:
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response**: Same as register

### GET `/api/auth/me`
**Purpose**: Get current authenticated user
**Auth**: Required

**Response**:
```json
{
  "_id": "user_123",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "client"
}
```

### POST `/api/auth/logout`
**Purpose**: Logout user (clears session)

**Response**:
```json
{
  "msg": "Logged out successfully"
}
```

---

## OTP Verification

### POST `/api/otp/send`
**Purpose**: Send OTP to mobile number

**Request**:
```json
{
  "mobile": "+919876543210"
}
```

**Response**:
```json
{
  "success": true,
  "msg": "OTP sent successfully"
}
```

### POST `/api/otp/verify`
**Purpose**: Verify OTP code

**Request**:
```json
{
  "mobile": "+919876543210",
  "otp": "123456"
}
```

**Response**:
```json
{
  "success": true,
  "msg": "OTP verified"
}
```

---

## Public Routes

### GET `/api/public/astrologers`
**Purpose**: Get list of all astrologers (public access)

**Response**:
```json
[
  {
    "_id": "astro_123",
    "name": "Guru Sharma",
    "email": "guru@astro.com",
    "role": "astrologer",
    "profile": {
      "userId": "astro_123",
      "languages": ["English", "Hindi", "Tamil"],
      "specialties": ["Vedic", "Numerology"],
      "ratePerMinute": 50,
      "bio": "Expert astrologer...",
      "isOnline": true
    }
  }
]
```

---

## Wallet Management

### POST `/api/wallet/add`
**Purpose**: Add money to user wallet
**Auth**: Required

**Request**:
```json
{
  "amount": 500
}
```

**Response**:
```json
{
  "balance": 1500,
  "msg": "Money added successfully"
}
```

### GET `/api/wallet/balance`
**Purpose**: Get current wallet balance
**Auth**: Required

**Response**:
```json
{
  "balance": 1500
}
```

---

## Astrologer Routes

### PUT `/api/astrologer/status`
**Purpose**: Toggle astrologer online/offline status
**Auth**: Required (Astrologer only)

**Response**:
```json
{
  "userId": "astro_123",
  "languages": ["English", "Hindi"],
  "specialties": ["Vedic", "Tarot"],
  "ratePerMinute": 50,
  "bio": "Expert astrologer...",
  "isOnline": false,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Socket Event Emitted**: `astrologerStatusUpdate`
```json
{
  "astrologerId": "astro_123",
  "isOnline": false
}
```

### GET `/api/astrologer/profile`
**Purpose**: Get astrologer profile
**Auth**: Required (Astrologer only)

**Response**:
```json
{
  "userId": "astro_123",
  "languages": ["English", "Hindi", "Tamil"],
  "specialties": ["Vedic", "Numerology", "Tarot"],
  "ratePerMinute": 50,
  "bio": "Experienced astrologer with 10+ years...",
  "isOnline": true
}
```

### PUT `/api/astrologer/profile`
**Purpose**: Update astrologer profile
**Auth**: Required (Astrologer only)

**Request**:
```json
{
  "languages": ["English", "Hindi", "Tamil"],
  "specialties": ["Vedic", "Numerology"],
  "ratePerMinute": 60,
  "bio": "Updated bio..."
}
```

**Response**: Updated profile object

---

## Call Management

### POST `/api/call/initiate`
**Purpose**: Initiate a call/chat session
**Auth**: Required

**Request**:
```json
{
  "receiverId": "astro_123",
  "type": "video"  // "video" | "chat"
}
```

**Response**:
```json
{
  "callId": "call_001",
  "msg": "Call initiated"
}
```

### POST `/api/call/end`
**Purpose**: End call and calculate billing
**Auth**: Required

**Request**:
```json
{
  "callId": "call_001"
}
```

**Response**:
```json
{
  "msg": "Call ended",
  "cost": 250,
  "remainingBalance": 1250
}
```

**Note**: Duration is calculated from `acceptedTime` to `endTime` on the server

---

## Horoscope

### GET `/api/horoscope/daily`
**Purpose**: Get daily horoscope for specific zodiac sign

**Query Params**:
- `sign`: Zodiac sign (e.g., "mesham", "rishabam")
- `lang`: Language code (default: "ta")
- `date`: Date in YYYY-MM-DD format (default: today)

**Response**:
```json
{
  "rasi": "Mesham",
  "date": "2024-01-15",
  "language": "ta",
  "overall": "Today is favorable for new beginnings...",
  "career": "Good day for career advancement...",
  "money": "Financial gains expected...",
  "family": "Harmony in family matters...",
  "love": "Romantic prospects look bright...",
  "health": "Maintain good health habits...",
  "remedy": "Wear red color for luck..."
}
```

### GET `/api/horoscope/all`
**Purpose**: Get all horoscopes for today

**Query Params**:
- `lang`: Language code (default: "ta")
- `date`: Date in YYYY-MM-DD format (default: today)

**Response**: Array of horoscope objects

### GET `/api/horoscope/signs`
**Purpose**: Get list of zodiac signs

**Response**:
```json
[
  {
    "id": "mesham",
    "name": "மேஷம்",
    "englishName": "Aries",
    "icon": "♈"
  }
]
```

---

## Admin Routes

### GET `/api/admin/stats`
**Purpose**: Get platform statistics
**Auth**: Required (Admin only)

**Response**:
```json
{
  "totalUsers": 1250,
  "totalAstrologers": 45,
  "totalEarnings": 125000,
  "activeCalls": 8,
  "todayEarnings": 5000,
  "pendingRequests": 3
}
```

### GET `/api/admin/astrologers`
**Purpose**: Get all astrologers with profiles
**Auth**: Required (Admin only)

**Response**: Array of astrologer objects with profiles

### POST `/api/admin/astrologers`
**Purpose**: Add new astrologer
**Auth**: Required (Admin only)

**Request**:
```json
{
  "name": "New Astrologer",
  "email": "new@astro.com",
  "password": "password123",
  "languages": ["English", "Hindi"],
  "specialties": ["Vedic"],
  "ratePerMinute": 40,
  "bio": "Bio text..."
}
```

### DELETE `/api/admin/astrologers/:id`
**Purpose**: Remove astrologer
**Auth**: Required (Admin only)

### GET `/api/admin/users`
**Purpose**: Get all users with wallet balances
**Auth**: Required (Admin only)

**Response**:
```json
[
  {
    "_id": "user_123",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "client",
    "walletBalance": 1500,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### POST `/api/admin/wallet/add`
**Purpose**: Add money to user wallet (admin action)
**Auth**: Required (Admin only)

**Request**:
```json
{
  "userId": "user_123",
  "amount": 500
}
```

**Response**:
```json
{
  "msg": "Money added successfully",
  "balance": 2000
}
```

### GET `/api/admin/horoscopes`
**Purpose**: Get all horoscope entries
**Auth**: Required (Admin only)

### POST `/api/admin/horoscopes`
**Purpose**: Add/update horoscope
**Auth**: Required (Admin only)

**Request**:
```json
{
  "rasi": "Mesham",
  "type": "daily",
  "content": "Horoscope content...",
  "date": "2024-01-15",
  "language": "tamil"
}
```

### DELETE `/api/admin/horoscopes/:id`
**Purpose**: Delete horoscope entry
**Auth**: Required (Admin only)

### GET `/api/admin/offers`
**Purpose**: Get all offers
**Auth**: Required (Admin only)

### POST `/api/admin/offers`
**Purpose**: Create new offer
**Auth**: Required (Admin only)

**Request**:
```json
{
  "title": "New Year Offer",
  "code": "NEWYEAR2024",
  "discount": 20,
  "type": "percentage",
  "validUntil": "2024-12-31",
  "description": "20% off on all consultations"
}
```

### DELETE `/api/admin/offers/:id`
**Purpose**: Delete offer
**Auth**: Required (Admin only)

### GET `/api/admin/banners`
**Purpose**: Get all banners
**Auth**: Required (Admin only)

### POST `/api/admin/banners`
**Purpose**: Create new banner
**Auth**: Required (Admin only)

**Request**:
```json
{
  "title": "Special Consultation",
  "subtitle": "Book now!",
  "image": "https://example.com/banner.jpg",
  "targetUrl": "/astrologer/123",
  "isActive": true,
  "position": "home_top"
}
```

### DELETE `/api/admin/banners/:id`
**Purpose**: Delete banner
**Auth**: Required (Admin only)

### GET `/api/admin/settings`
**Purpose**: Get platform settings
**Auth**: Required (Admin only)

**Response**:
```json
{
  "platformTitle": "AstroElite",
  "platformLogo": "👑",
  "primaryColor": "purple",
  "currency": "₹",
  "language": "tamil",
  "timezone": "Asia/Kolkata"
}
```

### PUT `/api/admin/settings`
**Purpose**: Update platform settings
**Auth**: Required (Admin only)

### GET `/api/admin/recent-logins`
**Purpose**: Get recent user logins
**Auth**: Required (Admin only)

**Response**:
```json
[
  {
    "name": "John Doe",
    "email": "john@example.com",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
]
```

---

## Socket.IO Events

### Client → Server

#### `join`
**Purpose**: Join a room (user ID or chat room)
```json
"user_123"
```

#### `callUser`
**Purpose**: Initiate call to another user
```json
{
  "userToCall": "astro_123",
  "signalData": {},
  "from": "user_123",
  "name": "John Doe",
  "type": "video",
  "callId": "call_001"
}
```

#### `answerCall`
**Purpose**: Accept incoming call
```json
{
  "to": "user_123",
  "callId": "call_001"
}
```

#### `rejectCall`
**Purpose**: Reject incoming call
```json
{
  "to": "user_123"
}
```

#### `endCall`
**Purpose**: End active call
```json
{
  "to": "user_123"
}
```

#### `sendMessage`
**Purpose**: Send chat message
```json
{
  "roomId": "room_123",
  "senderId": "user_123",
  "text": "Hello!",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "type": "text"
}
```

#### `typing`
**Purpose**: Indicate user is typing
```json
{
  "roomId": "room_123",
  "name": "John Doe"
}
```

#### `stopTyping`
**Purpose**: Indicate user stopped typing
```json
{
  "roomId": "room_123"
}
```

### Server → Client

#### `callUser`
**Purpose**: Notify user of incoming call
```json
{
  "signal": {},
  "from": "user_123",
  "name": "John Doe",
  "type": "video",
  "callId": "call_001"
}
```

#### `callAccepted`
**Purpose**: Notify caller that call was accepted
```json
{
  "accepted": true
}
```

#### `callRejected`
**Purpose**: Notify caller that call was rejected

#### `callEnded`
**Purpose**: Notify user that call ended

#### `receiveMessage`
**Purpose**: Receive chat message
```json
{
  "roomId": "room_123",
  "senderId": "user_123",
  "text": "Hello!",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "type": "text"
}
```

#### `displayTyping`
**Purpose**: Show typing indicator
```json
{
  "name": "John Doe"
}
```

#### `hideTyping`
**Purpose**: Hide typing indicator

#### `astrologerStatusUpdate`
**Purpose**: Real-time astrologer status change
```json
{
  "astrologerId": "astro_123",
  "isOnline": false
}
```

---

## Error Responses

All error responses follow this format:
```json
{
  "msg": "Error description",
  "error": "Detailed error message"
}
```

Common HTTP Status Codes:
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Server Error

---

## Notes

1. **Billing Logic**: Calls/chats are billed only from the moment the astrologer accepts (`acceptedTime`), not from initiation.

2. **Real-time Updates**: Astrologer status changes emit socket events to update all connected clients instantly.

3. **Authentication**: Most routes require JWT authentication. Include the token in the Authorization header.

4. **Wallet Transactions**: All wallet operations create transaction records for audit purposes.

5. **Socket Connections**: Clients should connect to the socket server on mount and join their user ID room for receiving events.
