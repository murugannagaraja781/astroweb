# AstroWeb API Endpoints Documentation

## Complete API List - Total: **34 Endpoints**

### Summary by Method:
- **GET**: 11 endpoints
- **POST**: 18 endpoints
- **PUT**: 2 endpoints
- **DELETE**: 6 endpoints
- **PATCH**: 0 endpoints

---

## 1. Authentication Routes (`/api/auth`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/auth/register` | ❌ No | Register new user |
| POST | `/api/auth/login` | ❌ No | User login |
| GET | `/api/auth/me` | ✅ Yes | Get current user info |
| POST | `/api/auth/logout` | ❌ No | User logout |

**Total: 4 endpoints** (3 POST, 1 GET)

---

## 2. OTP Routes (`/api/otp`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/otp/send` | ❌ No | Send OTP to phone number |
| POST | `/api/otp/verify` | ❌ No | Verify OTP and login |

**Total: 2 endpoints** (2 POST)

---

## 3. Admin Routes (`/api/admin`)

| Method | Endpoint | Auth Required | Role | Description |
|--------|----------|---------------|------|-------------|
| POST | `/api/admin/astrologer` | ✅ Yes | Admin | Add new astrologer |
| DELETE | `/api/admin/astrologer/:id` | ✅ Yes | Admin | Remove astrologer |
| GET | `/api/admin/astrologers` | ✅ Yes | Any | Get all astrologers |
| POST | `/api/admin/horoscope` | ✅ Yes | Admin | Add horoscope |
| GET | `/api/admin/horoscopes` | ✅ Yes | Any | Get all horoscopes |
| DELETE | `/api/admin/horoscope/:id` | ✅ Yes | Admin | Delete horoscope |
| GET | `/api/admin/stats` | ✅ Yes | Admin | Get dashboard statistics |
| GET | `/api/admin/settings` | ✅ Yes | Admin | Get app settings |
| POST | `/api/admin/settings` | ✅ Yes | Admin | Update app settings |
| GET | `/api/admin/offers` | ✅ Yes | Admin | Get all offers |
| POST | `/api/admin/offers` | ✅ Yes | Admin | Add new offer |
| DELETE | `/api/admin/offers/:id` | ✅ Yes | Admin | Delete offer |
| GET | `/api/admin/banners` | ✅ Yes | Admin | Get all banners |
| POST | `/api/admin/banners` | ✅ Yes | Admin | Add new banner |
| DELETE | `/api/admin/banners/:id` | ✅ Yes | Admin | Delete banner |
| GET | `/api/admin/recent-logins` | ✅ Yes | Admin | Get recent user logins |

**Total: 16 endpoints** (6 POST, 6 GET, 4 DELETE)

---

## 4. Astrologer Routes (`/api/astrologer`)

| Method | Endpoint | Auth Required | Role | Description |
|--------|----------|---------------|------|-------------|
| PUT | `/api/astrologer/status` | ✅ Yes | Astrologer | Toggle online/offline status |
| PUT | `/api/astrologer/profile` | ✅ Yes | Astrologer | Update astrologer profile |
| GET | `/api/astrologer/profile` | ✅ Yes | Astrologer | Get astrologer profile |

**Total: 3 endpoints** (2 PUT, 1 GET)

---

## 5. Call Routes (`/api/call`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/call/initiate` | ✅ Yes | Initiate a call session |
| POST | `/api/call/end` | ✅ Yes | End a call session |

**Total: 2 endpoints** (2 POST)

---

## 6. Public Routes (`/api/public`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/public/astrologers` | ❌ No | Get public list of astrologers |

**Total: 1 endpoint** (1 GET)

---

## 7. Wallet Routes (`/api/wallet`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/wallet/add` | ✅ Yes | Add money to wallet |
| GET | `/api/wallet/balance` | ✅ Yes | Get wallet balance |

**Total: 2 endpoints** (1 POST, 1 GET)

---

## 8. Socket.IO Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `connection` | Server ← Client | User connects to socket |
| `join` | Server ← Client | Join a room/identifier |
| `callUser` | Server ← Client | Initiate call to user |
| `answerCall` | Server ← Client | Answer incoming call |
| `rejectCall` | Server ← Client | Reject incoming call |
| `sendMessage` | Server ← Client | Send chat message |
| `typing` | Server ← Client | User is typing |
| `stopTyping` | Server ← Client | User stopped typing |
| `endCall` | Server ← Client | End ongoing call |
| `disconnect` | Server ← Client | User disconnects |
| `callUser` | Server → Client | Incoming call notification |
| `callAccepted` | Server → Client | Call accepted notification |
| `callRejected` | Server → Client | Call rejected notification |
| `receiveMessage` | Server → Client | Receive chat message |
| `displayTyping` | Server → Client | Show typing indicator |
| `hideTyping` | Server → Client | Hide typing indicator |
| `callEnded` | Server → Client | Call ended notification |

**Total: 17 socket events**

---

## Complete API Breakdown

### By HTTP Method:
```
GET:    11 endpoints (32.4%)
POST:   18 endpoints (52.9%)
PUT:    2 endpoints  (5.9%)
DELETE: 6 endpoints  (17.6%)
PATCH:  0 endpoints  (0%)
───────────────────────────────
TOTAL:  34 REST endpoints
```

### By Authentication:
```
Public (No Auth):     6 endpoints (17.6%)
Protected (Auth):    28 endpoints (82.4%)
```

### By Role:
```
Public:              6 endpoints
Any Authenticated:   2 endpoints
Admin Only:         14 endpoints
Astrologer Only:     3 endpoints
Client/Any:          9 endpoints
```

---

## Request/Response Examples

### Example 1: Send OTP
```bash
POST /api/otp/send
Content-Type: application/json

{
  "phoneNumber": "9876543210"
}

Response (200):
{
  "type": "success",
  "message": "OTP sent successfully"
}
```

### Example 2: Get Dashboard Stats
```bash
GET /api/admin/stats
Authorization: Bearer <JWT_TOKEN>

Response (200):
{
  "totalUsers": 1250,
  "totalAstrologers": 45,
  "totalEarnings": 12500,
  "activeCalls": 12,
  "todayEarnings": 2500,
  "pendingRequests": 8
}
```

### Example 3: Toggle Astrologer Status
```bash
PUT /api/astrologer/status
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "isOnline": true
}

Response (200):
{
  "msg": "Status updated successfully",
  "isOnline": true
}
```

---

## Middleware Used

### 1. `auth` Middleware
- **Purpose**: Verify JWT token
- **Location**: All protected routes
- **Adds**: `req.user` with user ID and role

### 2. `adminCheck` Middleware
- **Purpose**: Ensure user is admin
- **Location**: Admin-only routes
- **Requires**: `auth` middleware first

### 3. `astrologerCheck` Middleware
- **Purpose**: Ensure user is astrologer
- **Location**: Astrologer-only routes
- **Requires**: `auth` middleware first

---

## Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized (Invalid/Missing token) |
| 403 | Forbidden (Insufficient permissions) |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## Testing APIs

### Using cURL:
```bash
# Send OTP
curl -X POST http://localhost:9001/api/otp/send \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"9876543210"}'

# Login
curl -X POST http://localhost:9001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Get Protected Resource
curl -X GET http://localhost:9001/api/wallet/balance \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Using Postman:
1. Import collection with all endpoints
2. Set environment variable for base URL: `http://localhost:9001`
3. Set authorization header after login
4. Test each endpoint

---

## API Version: 1.0
## Base URL: `http://localhost:9001` (Development)
## Production URL: `https://astroweb-y0i6.onrender.com` (Production)

**Last Updated**: Nov 24, 2025
