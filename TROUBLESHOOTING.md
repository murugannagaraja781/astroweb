# Troubleshooting Guide - AstroWeb

## 🔍 Common Issues & Solutions

### Issue 1: "No astrologers online at the moment"

**Cause**: No astrologers have `isOnline: true` status

**Solutions**:

#### Option A: Toggle Status via Astrologer Dashboard
1. Login as an astrologer at `/login`
2. Go to Astrologer Dashboard
3. Click the "Go Online/Offline" toggle button
4. Status should update in real-time

#### Option B: Check API Response
```bash
# Test the API
curl http://localhost:5000/api/public/astrologers

# Expected response:
[
  {
    "_id": "...",
    "name": "Astrologer Name",
    "isOnline": true,  // <-- Should be true
    "languages": [...],
    "specialties": [...]
  }
]
```

#### Option C: Manually Update Database
```javascript
// Connect to MongoDB and run:
db.astrologerprofiles.updateMany(
  {},
  { $set: { isOnline: true } }
)
```

---

### Issue 2: Server Not Starting

**Symptoms**: Server crashes or exits immediately

**Check**:
```bash
cd server
npm run dev
```

**Common Errors**:

#### Error: "EADDRINUSE: address already in use"
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or use different port in .env
PORT=5001
```

#### Error: "Cannot find module"
```bash
# Reinstall dependencies
cd server
rm -rf node_modules
npm install
```

#### Error: "MongoDB connection failed"
```bash
# Check .env file has:
MONGO_URI=mongodb+srv://...

# Test connection
mongosh "your_mongodb_uri"
```

---

### Issue 3: Real-time Status Not Updating

**Cause**: Socket.IO not connected

**Check Frontend Console**:
```javascript
// Should see:
Socket connected: xyz123
```

**Fix**:
1. Check `client/.env` has correct API URL:
```
VITE_API_URL=http://localhost:5000
```

2. Restart both servers:
```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd client && npm run dev
```

---

### Issue 4: Billing Not Working

**Symptoms**: Money not deducted during calls

**Check**:
1. Server console should show:
```
🔄 Billing Tracker started
📞 Call abc123: 5s, ₹0.08
📞 Call abc123: 10s, ₹0.17
```

2. If not showing, check `server/index.js`:
```javascript
const billingTracker = new BillingTracker(io);
billingTracker.start();
```

---

### Issue 5: Chat Messages Not Saving

**Symptoms**: Messages disappear on refresh

**Check Database**:
```javascript
// MongoDB
db.chatmessages.find().limit(5)

// Should return messages
```

**Fix**:
1. Ensure ChatMessage model exists:
```bash
ls server/models/ChatMessage.js
```

2. Check socket handler:
```bash
ls server/socket/handlers/chat.js
```

---

### Issue 6: Login/Registration Not Working

**Check**:
1. JWT_SECRET in `.env`:
```
JWT_SECRET=your_secret_key_min_32_characters
```

2. Test API:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "role": "client"
  }'
```

---

### Issue 7: Welcome Bonus Not Added

**Check**:
1. Register new client
2. Check wallet:
```bash
curl http://localhost:5000/api/wallet/balance \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should return: { "balance": 20 }
```

3. If not working, check `server/controllers/authController.js` line 27-38

---

## 🔧 Quick Diagnostic Commands

### Check All Services
```bash
# 1. Check if MongoDB is accessible
mongosh "your_mongodb_uri" --eval "db.stats()"

# 2. Check if server is running
curl http://localhost:5000/api/public/astrologers

# 3. Check if client is running
curl http://localhost:5173

# 4. Check processes
ps aux | grep node
```

### View Server Logs
```bash
cd server
npm run dev 2>&1 | tee server.log
```

### View Client Logs
```bash
# Open browser console (F12)
# Look for errors in Console tab
```

---

## 📊 Health Check Endpoints

Add these to test your server:

```javascript
// server/index.js
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    services: {
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      billingTracker: 'active'
    }
  });
});
```

Test:
```bash
curl http://localhost:5000/health
```

---

## 🐛 Debug Mode

Enable detailed logging:

```javascript
// server/index.js
const DEBUG = true;

if (DEBUG) {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}
```

---

## 📞 Still Not Working?

**Provide these details**:
1. Error message (exact text)
2. Browser console logs (F12 → Console)
3. Server terminal output
4. Which feature is broken (login, chat, calls, etc.)
5. Steps to reproduce

**Quick Reset**:
```bash
# Kill all node processes
killall node

# Restart everything
cd server && npm run dev &
cd client && npm run dev
```

---

## ✅ Verification Checklist

- [ ] MongoDB connected (check server logs)
- [ ] Server running on port 5000
- [ ] Client running on port 5173
- [ ] At least one astrologer exists in database
- [ ] Astrologer status is `isOnline: true`
- [ ] Socket.IO connected (check browser console)
- [ ] Billing tracker started (check server logs)
- [ ] JWT_SECRET set in .env
- [ ] VITE_API_URL set in client/.env

---

*Last updated: 2024-01-15*
