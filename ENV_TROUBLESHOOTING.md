# Environment Configuration Troubleshooting

## Issue: App connecting to wrong server (production instead of localhost)

### Symptoms:
- 403 Forbidden errors
- Requests going to `https://astroweb-production.up.railway.app` instead of `http://localhost:9001`
- `.env` file shows localhost but app uses production URL

### Root Cause:
The app is using **cached/built files** that contain the old production URL.

---

## Solution 1: Clear Build Cache (Recommended)

```bash
# Stop the dev server (Ctrl+C in the terminal running it)

# Clear the build cache
cd client
rm -rf dist/
rm -rf node_modules/.vite/

# Restart dev server
npm run dev
```

This forces Vite to rebuild everything with the new `.env` values.

---

## Solution 2: Just Restart Dev Server

```bash
# Stop the dev server (Ctrl+C)

# Restart it
cd client
npm run dev
```

Vite should automatically pick up `.env` changes, but sometimes it needs a restart.

---

## Solution 3: Hard Refresh Browser

After restarting the dev server:

1. **Chrome/Firefox:** Press `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
2. **Or:** Open DevTools → Right-click refresh button → "Empty Cache and Hard Reload"

This clears the browser cache.

---

## Verify It's Fixed

### Check 1: Browser Console
Open browser console and look for:
```
[Client] Socket connected: <socket-id>
```

If you see connection errors, the server isn't running.

### Check 2: Network Tab
1. Open DevTools → Network tab
2. Refresh page
3. Look at the API requests
4. They should go to `http://localhost:9001`, NOT production

### Check 3: Check .env is loaded
Add this temporarily to your component:
```javascript
console.log("API URL:", import.meta.env.VITE_API_URL);
```

Should log: `http://localhost:9001`

---

## Common Mistakes

### Mistake 1: Server not running
**Error:** `ERR_CONNECTION_REFUSED` or `net::ERR_CONNECTION_REFUSED`

**Fix:**
```bash
# Terminal 1 - Start server
cd server
npm start

# Terminal 2 - Start client
cd client
npm run dev
```

### Mistake 2: Wrong port
**Error:** Connection refused on port 9001

**Fix:** Check if server is running on a different port. Look at server startup logs:
```
Server running on port 9001
```

### Mistake 3: .env not loaded
**Error:** `undefined` when checking `import.meta.env.VITE_API_URL`

**Fix:**
- Ensure `.env` file is in `client/` folder (not root)
- Ensure variables start with `VITE_`
- Restart dev server

### Mistake 4: Using production build
**Error:** Running `npm run preview` instead of `npm run dev`

**Fix:** Use `npm run dev` for development, not `npm run preview`

---

## Current Configuration

Your `.env` should look like this for **local development**:

```env
# Local Development
VITE_API_URL=http://localhost:9001
VITE_SIGNALING_SERVER=http://localhost:9001

# TURN Server (for testing)
VITE_TURN_URL=turn:a.relay.metered.ca:443?transport=tcp
VITE_TURN_USERNAME=openrelayproject
VITE_TURN_CREDENTIAL=openrelayproject

# Other configs
VITE_MSG91_AUTHKEY=478312AgHesvjV691c86b3P1
VITE_MSG91_WIDGET_ID=478312AgHesvjV691c86b3P1
VITE_AGORA_APP_ID=861410e65b584f8eae7e6c21823f2bea
VITE_AGORA_DEBUG=true
```

For **production**, uncomment the production URLs:
```env
# Production
VITE_API_URL=https://astroweb-production.up.railway.app
VITE_SIGNALING_SERVER=https://astroweb-production.up.railway.app

# Production TURN Server (get your own!)
VITE_TURN_URL=turn:your-production-turn-server.com:443
VITE_TURN_USERNAME=your-username
VITE_TURN_CREDENTIAL=your-password
```

---

## Testing Checklist

After fixing:

- [ ] Server is running (`cd server && npm start`)
- [ ] Client is running (`cd client && npm run dev`)
- [ ] Browser console shows no connection errors
- [ ] Network tab shows requests to `localhost:9001`
- [ ] Can login successfully
- [ ] Can see astrologers list
- [ ] Socket connection established

---

## Still Not Working?

### Check Server Logs
Look for:
```
Server running on port 9001
MongoDB connected
🔌 Socket connected: <socket-id>
```

### Check Client Logs
Look for:
```
[Client] Socket connected: <socket-id>
```

### Check MongoDB
Ensure MongoDB is running:
```bash
# If using local MongoDB
mongosh

# If using MongoDB Atlas
# Check connection string in server/.env
```

### Check Firewall
Ensure ports are not blocked:
- Port 9001 (server)
- Port 5173 (client dev server)
- Port 27017 (MongoDB, if local)

---

## Quick Commands Reference

```bash
# Start everything fresh
cd server && npm start &
cd client && rm -rf dist/ && npm run dev

# Check what's running on port 9001
lsof -i :9001

# Kill process on port 9001 (if stuck)
kill -9 $(lsof -t -i:9001)

# Check environment variables
cd client && cat .env

# Test server is responding
curl http://localhost:9001/api/public/astrologers
```

---

## Summary

**The 403 error happens because:**
1. Your app has built files with production URL
2. You changed `.env` to localhost
3. But the built files weren't regenerated

**Fix:**
1. Stop dev server
2. Delete `client/dist/` folder
3. Restart dev server
4. Hard refresh browser

That's it! 🎉
