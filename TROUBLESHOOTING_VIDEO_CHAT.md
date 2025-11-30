```markdown
# Video Call & Chat Troubleshooting Guide

## Quick Diagnostic Checklist

### ✅ Pre-flight Checks
 - [ ] Server is running on correct port
- [ ] MongoDB is connected
- [ ] Environment variables are set (`VITE_API_URL`, `MONGO_URI`, `JWT_SECRET`)
- [ ] User has valid JWT token
- [ ] User has sufficient wallet balance (for clients)

---

## Common Issues & Solutions

### 1. **404 Error on `/api/call/initiate`**

**Symptoms:**
```
POST https://astroweb-production.up.railway.app/api/call/initiate
Status: 404 Not Found
```

**Causes:**
- Backend route not deployed to production
- Server not running
- Incorrect API endpoint URL

**Solutions:**
1. Verify backend is deployed and running:
   ```bash
   curl https://astroweb-production.up.railway.app/api/call/history
   ```
2. Check if callRoutes are mounted in `server/index.js`:
   ```javascript
   app.use('/api/call', require('./routes/callRoutes'));
   ```
3. Verify `.env` file has correct `VITE_API_URL`:
   ```
   VITE_API_URL=https://astroweb-production.up.railway.app
   ```
4. Restart the client dev server after changing `.env`

---

### 2. **Insufficient Balance Error (For Valid Users)**

**Symptoms:**
```
Error: Insufficient balance. Minimum ₹1 required to start call/chat.
```

**Causes:**
- Wallet not initialized for user
- Balance check applied to astrologer/admin users
- Balance is actually zero

**Solutions:**
1. Check user wallet in database:
   ```javascript
   db.wallets.findOne({ userId: ObjectId("USER_ID") })
   ```
2. Add balance via admin panel or script:
   ```bash
   node server/scripts/addWelcomeBonus.js USER_ID
   ```
3. Verify role-based bypass logic is working:
   - **Admins**: Should have `balance = Infinity`
   - **Astrologers**: Should skip balance checks
   - **Clients**: Should check balance

---

### 3. **Video/Audio Not Connecting (Agora)**

**Symptoms:**
- Call initiated successfully
- No video/audio streams visible
- Console errors about Agora

**Causes:**
- Missing Agora App ID
- Incorrect Agora credentials
- Browser permissions denied
- Network/firewall issues

**Solutions:**
1. Verify Agora App ID is correct:
   ```javascript
   const APP_ID = '196be66ba9ab4172921c1e7f7e948879';
   ```
2. Check browser permissions:
   - Camera: Allowed
   - Microphone: Allowed
3. Test in different browser (Chrome recommended)
4. Check browser console for Agora errors:
   ```
   AgoraRTCError: PERMISSION_DENIED
   ```

---

### 4. **Socket.IO Not Connected**

**Symptoms:**
- Messages not sending in real-time
- Call notifications not received
- Console: `Socket disconnected`

**Causes:**
- Socket server not running
- Incorrect socket URL
- CORS issues

**Solutions:**
1. Verify socket connection URL:
   ```javascript
   const socket = io(import.meta.env.VITE_API_URL);
   ```
2. Check CORS settings in `server/index.js`:
   ```javascript
   const io = new Server(server, {
     cors: { origin: "*", methods: ["GET", "POST"] }
   });
   ```
3. Test socket connection:
   ```javascript
   socket.on('connect', () => console.log('✅ Socket connected'));
   socket.on('disconnect', () => console.log('❌ Socket disconnected'));
   ```

---

### 5. **Admin Cannot Call Without Balance**

**Symptoms:**
- Admin user gets "insufficient balance" error
- Admin role bypass not working

**Causes:**
- Role check logic not applied correctly
- User role not set to 'admin' in database

**Solutions:**
1. Verify user role in database:
   ```javascript
   db.users.findOne({ _id: ObjectId("USER_ID") })
   // Should have: { role: 'admin' }
   ```
2. Check frontend bypass logic in `VideoCall.jsx`:
   ```javascript
   if (user && user.role !== 'admin') {
     // Fetch balance
   } else {
     setBalance(Infinity);
   }
   ```
3. Check backend bypass logic in `callController.js`:
   ```javascript
   if (req.user.role === 'admin') {
     // Skip balance check
   }
   ```

---

## Error Code Reference

| Code | Message | Meaning | Action |
|------|---------|---------|--------|
| 400 | Invalid receiver ID | receiverId is not a valid MongoDB ObjectId | Check astrologer ID format |
| 400 | Insufficient balance | User doesn't have ₹1+ balance | Add money to wallet |
| 401 | No token, authorization denied | Missing `x-auth-token` header | Ensure user is logged in |
| 401 | Token is not valid | JWT token expired or invalid | Re-login to get new token |
| 403 | Access denied | User doesn't have required role | Check user role in database |
| 404 | Wallet not found | User has no wallet record | Create wallet or run initialization script |
| 404 | Astrologer not found | receiverId doesn't match any astrologer | Verify astrologer exists |
| 404 | Call log not found | callId invalid in /call/end request | Use correct callId from initiate response |
| 500 | Server Error | Backend crash or database issue | Check server logs |

---

## Debugging Commands

### Check API Endpoint
```bash
curl -X POST https://astroweb-production.up.railway.app/api/call/initiate \
  -H "Content-Type: application/json" \
  -H "x-auth-token: YOUR_JWT_TOKEN" \
  -d '{"receiverId":"ASTROLOGER_ID","type":"video"}'
```

### Check User Wallet
```bash
mongo
use astroweb
db.wallets.find({ userId: ObjectId("USER_ID") })
```

### Check Server Logs
```bash
# Local
tail -f server/logs/app.log  # if you have logging enabled

# Render.com
# Go to Dashboard → Logs tab
```

### Run Automated Troubleshooter
```bash
node server/scripts/video-call-troubleshooter.js
```

---

## Step-by-Step Debugging Flow

### For Call Initiation Issues:

1. **Verify User Authentication**
   - Check if JWT token exists in localStorage
   - Verify token hasn't expired
   - Test `/api/auth/me` endpoint

2. **Check Balance (if client)**
   - Hit `/api/wallet/balance`
   - Ensure balance >= ₹1
   - Add money if needed

3. **Verify Astrologer Exists**
   - Check astrologer ID is valid
   - Hit `/api/public/astrologers` to get list
   - Confirm astrologer is online

4. **Test Call Initiation**
   - Click "Call" button
   - Check browser console for errors
   - Verify network tab shows POST request
   - Check response status and body

5. **If 404 Error**
   - Verify backend is running
   - Check route is mounted in `server/index.js`
   - Test with curl command

6. **If 400/401 Error**
   - Check error message in response
   - Verify JWT token is being sent
   - Check balance/role requirements

7. **If 500 Error**
   - Check server logs immediately
   - Look for stack traces
   - Check MongoDB connection

---

## Prevention Best Practices

1. **Always use environment variables** for API URLs
2. **Add proper error handling** with try-catch blocks
3. **Show user-friendly error messages** via toast notifications
4. **Log detailed errors** to console for debugging
5. **Validate inputs** before making API calls
6. **Test all user roles** (client, astrologer, admin)
7. **Monitor balance** and show warnings before it runs out
8. **Use TypeScript** for better type safety (future enhancement)

---

## Contact Support

If issue persists after following this guide:
1. Collect error logs from browser console
2. Note exact steps to reproduce
3. Check server logs for backend errors
4. Document user role and balance state
5. Create detailed issue report
```
