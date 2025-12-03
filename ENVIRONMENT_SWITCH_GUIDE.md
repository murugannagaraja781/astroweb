# Environment Switch Guide

Quick guide to switch between local development and production environments.

---

## 🌐 Current Configuration

**Production Mode** ✅

```env
VITE_API_URL=https://astroweb-production.up.railway.app
VITE_SIGNALING_SERVER=https://astroweb-production.up.railway.app
```

---

## 🔄 Switch to Local Development

Edit `client/.env`:

```env
# Comment out production URLs
# VITE_API_URL=https://astroweb-production.up.railway.app
VITE_API_URL=http://localhost:9001

# VITE_SIGNALING_SERVER=https://astroweb-production.up.railway.app
VITE_SIGNALING_SERVER=http://localhost:9001
```

Then restart your dev server:
```bash
cd client
npm run dev
```

---

## 🚀 Switch to Production

Edit `client/.env`:

```env
# Use production URLs
VITE_API_URL=https://astroweb-production.up.railway.app
# VITE_API_URL=http://localhost:9001

VITE_SIGNALING_SERVER=https://astroweb-production.up.railway.app
# VITE_SIGNALING_SERVER=http://localhost:9001
```

Then restart your dev server:
```bash
cd client
npm run dev
```

---

## 📝 Environment Variables Reference

### Client (.env)

| Variable | Local | Production |
|----------|-------|------------|
| `VITE_API_URL` | `http://localhost:9001` | `https://astroweb-production.up.railway.app` |
| `VITE_SIGNALING_SERVER` | `http://localhost:9001` | `https://astroweb-production.up.railway.app` |
| `VITE_AGORA_APP_ID` | `861410e65b584f8eae7e6c21823f2bea` | Same |
| `VITE_MSG91_AUTHKEY` | `478312AgHesvjV691c86b3P1` | Same |

### Server (.env)

| Variable | Value |
|----------|-------|
| `PORT` | `9001` |
| `MONGO_URI` | `mongodb+srv://...` |
| `JWT_SECRET` | `your_jwt_secret_key_here` |
| `MSG91_AUTHKEY` | `478312AgHesvjV691c86b3P1` |
| `MSG91_TEMPLATE_ID` | `1407172294566795685` |
| `MSG91_SENDER_ID` | `ASTRO9` |
| `AGORA_APP_ID` | `a3c27ce672804538b4e78baeaf0687b2` |
| `AGORA_APP_CERTIFICATE` | `d6d14f52b1ef4f88befc8e06ddd1a974` |

---

## 🧪 Testing Endpoints

### Local Development
```bash
# Test API
curl http://localhost:9001/api/auth/test

# Test Socket.IO
curl http://localhost:9001/socket.io/
```

### Production
```bash
# Test API
curl https://astroweb-production.up.railway.app/api/auth/test

# Test Socket.IO
curl https://astroweb-production.up.railway.app/socket.io/
```

---

## ⚠️ Important Notes

1. **Always restart dev server** after changing .env files
2. **Clear browser cache** if you see old URLs
3. **Check browser console** for connection errors
4. **Verify CORS settings** in production server
5. **Socket.IO requires WebSocket support** - check firewall/proxy settings

---

## 🐛 Troubleshooting

### Issue: Socket.IO not connecting

**Check:**
1. VITE_SIGNALING_SERVER matches VITE_API_URL
2. Server is running and accessible
3. No CORS errors in browser console
4. WebSocket is not blocked by firewall

**Fix:**
```javascript
// In browser console
console.log(import.meta.env.VITE_API_URL)
console.log(import.meta.env.VITE_SIGNALING_SERVER)
```

### Issue: API calls failing

**Check:**
1. VITE_API_URL is correct
2. Server is running
3. Network tab shows correct URL
4. No 502/503 errors

**Fix:**
```bash
# Test server health
curl https://astroweb-production.up.railway.app/
```

### Issue: OTP not working

**Check:**
1. MSG91_AUTHKEY is set in server .env
2. MSG91_TEMPLATE_ID is correct
3. Server logs show OTP request
4. Check MSG91 dashboard for delivery status

---

## 🔐 Security Notes

- Never commit .env files with real credentials
- Use different credentials for local/production
- Rotate API keys regularly
- Monitor API usage in dashboards

---

## ✅ Current Status

- ✅ Production URLs configured
- ✅ Socket.IO pointing to production
- ✅ API URL pointing to production
- ✅ MSG91 credentials configured
- ✅ Agora credentials configured

**You're now connected to production!** 🚀

