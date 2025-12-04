# Production Connection Issues - Fix Guide

## 🚨 Current Issues

1. **ERR_INTERNET_DISCONNECTED / ERR_NAME_NOT_RESOLVED**
   - Socket.IO cannot connect to production server
   - DNS resolution failing intermittently

2. **Audio Play() Errors**
   - "The play() request was interrupted because media was removed"
   - "The play() request was interrupted by a call to pause()"

---

## ✅ Immediate Fix Applied

**Switched back to localhost** for stable development:

```env
VITE_API_URL=http://localhost:9001
VITE_SIGNALING_SERVER=http://localhost:9001
```

---

## 🔧 Production Server Issues

### Problem: Railway Server Instability

The production server at `astroweb-production.up.railway.app` is:
- ✅ Running (responds to requests)
- ❌ Intermittently unreachable
- ❌ DNS resolution issues
- ❌ Possible server crashes

### Root Causes:

1. **Server Crash from Behavior Controller**
   - The behavior controller was trying to import `swisseph` module
   - This caused server to crash on startup
   - **Status:** Fixed ✅

2. **Railway Free Tier Limitations**
   - Server may sleep after inactivity
   - Limited resources
   - Network instability

3. **DNS Propagation Issues**
   - Railway domain may have DNS issues
   - Intermittent resolution failures

---

## 🛠️ Solutions

### Solution 1: Use Localhost for Development (Current)

**Best for:** Local testing and development

```bash
# 1. Start local server
cd server
npm start

# 2. Start client (in new terminal)
cd client
npm run dev
```

**Pros:**
- ✅ Stable connection
- ✅ Fast development
- ✅ No network issues
- ✅ Full debugging

**Cons:**
- ❌ Can't test from mobile
- ❌ Can't share with others

### Solution 2: Fix Production Server

**Steps:**

1. **Check Railway Logs**
   ```bash
   # Login to Railway dashboard
   # Check deployment logs
   # Look for errors
   ```

2. **Verify Server is Running**
   ```bash
   curl https://astroweb-production.up.railway.app/socket.io/
   ```

3. **Redeploy if Needed**
   ```bash
   git push origin main
   # Railway auto-deploys
   ```

4. **Add Health Check Endpoint**
   ```javascript
   // In server/index.js
   app.get('/health', (req, res) => {
     res.json({ status: 'ok', timestamp: new Date() });
   });
   ```

### Solution 3: Use ngrok for Testing

**Best for:** Testing on mobile/sharing with others

```bash
# Install ngrok
npm install -g ngrok

# Start local server
cd server && npm start

# In new terminal, expose it
ngrok http 9001

# Copy the https URL (e.g., https://abc123.ngrok.io)
# Update client/.env
VITE_API_URL=https://abc123.ngrok.io
VITE_SIGNALING_SERVER=https://abc123.ngrok.io
```

---

## 🎵 Audio Play() Errors Fix

### Problem

Browser blocks audio.play() if:
- User hasn't interacted with page
- Audio element is removed from DOM
- play() called while already playing

### Solution: Proper Audio Handling

```javascript
// In AstrologerDashboard.jsx

const playNotificationSound = async () => {
  if (!notificationSoundRef.current) {
    console.warn('Audio ref not initialized');
    return;
  }

  try {
    // Reset audio to beginning
    notificationSoundRef.current.currentTime = 0;

    // Play audio
    await notificationSoundRef.current.play();
    console.log('✅ Notification sound played');
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('⚠️ Audio play aborted (user interaction needed)');
    } else if (error.name === 'NotAllowedError') {
      console.log('⚠️ Audio play blocked by browser');
    } else {
      console.error('❌ Audio play error:', error);
    }
  }
};

// Initialize audio with user interaction
useEffect(() => {
  const initAudio = () => {
    if (notificationSoundRef.current) {
      // Prime the audio with user interaction
      notificationSoundRef.current.play()
        .then(() => {
          notificationSoundRef.current.pause();
          notificationSoundRef.current.currentTime = 0;
          console.log('✅ Audio initialized');
        })
        .catch(err => console.log('Audio init:', err.message));
    }
  };

  // Wait for user interaction
  document.addEventListener('click', initAudio, { once: true });

  return () => {
    document.removeEventListener('click', initAudio);
  };
}, []);
```

---

## 🌐 WebRTC Connection Checklist

Based on your WebRTC checklist, here's what to verify:

### 1. Browser Permissions ✅
```javascript
// Check if getUserMedia returned tracks
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    console.log('Tracks:', stream.getTracks().length);
    // Should be 2 (video + audio)
  });
```

### 2. TURN Server Configuration ⚠️
```javascript
// Add to RTCPeerConnection config
const config = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: 'turn:a.relay.metered.ca:443?transport=tcp',
      username: 'your-username',
      credential: 'your-password'
    }
  ]
};
```

### 3. ICE Candidate Forwarding ✅
```javascript
// Ensure all candidates are forwarded
pc.onicecandidate = (event) => {
  if (event.candidate) {
    socket.emit('ice-candidate', {
      to: remoteUserId,
      candidate: event.candidate
    });
  }
};
```

### 4. Connection State Monitoring ✅
```javascript
pc.oniceconnectionstatechange = () => {
  console.log('ICE State:', pc.iceConnectionState);
  // Should go: new → checking → connected
};

pc.onconnectionstatechange = () => {
  console.log('Connection State:', pc.connectionState);
};
```

### 5. HTTPS Required ✅
- ✅ Production uses HTTPS
- ✅ Localhost works with HTTP
- ⚠️ Test on real devices requires HTTPS

---

## 📋 Testing Checklist

Before using production:

- [ ] Server is running (check Railway dashboard)
- [ ] Health endpoint responds: `curl https://astroweb-production.up.railway.app/health`
- [ ] Socket.IO connects: Check browser console
- [ ] No 502/503 errors
- [ ] DNS resolves: `nslookup astroweb-production.up.railway.app`
- [ ] CORS configured correctly
- [ ] Environment variables set in Railway
- [ ] Logs show no errors

---

## 🚀 Recommended Setup

**For Development:**
```env
VITE_API_URL=http://localhost:9001
VITE_SIGNALING_SERVER=http://localhost:9001
```

**For Production Testing:**
```env
VITE_API_URL=https://astroweb-production.up.railway.app
VITE_SIGNALING_SERVER=https://astroweb-production.up.railway.app
```

**For Mobile Testing:**
```bash
# Use ngrok
ngrok http 9001
# Then use the ngrok URL
```

---

## 🐛 Debugging Commands

```bash
# Test server health
curl https://astroweb-production.up.railway.app/health

# Test Socket.IO
curl https://astroweb-production.up.railway.app/socket.io/

# Test DNS
nslookup astroweb-production.up.railway.app

# Test from browser console
fetch('https://astroweb-production.up.railway.app/health')
  .then(r => r.json())
  .then(console.log)
```

---

## ✅ Current Status

- ✅ Switched to localhost for stability
- ✅ Server behavior controller fixed
- ⚠️ Production server needs monitoring
- ⚠️ Audio errors need proper handling
- ⚠️ TURN server configuration needed for production

**Next Steps:**
1. Test with localhost
2. Fix audio handling
3. Monitor production server
4. Add TURN server for WebRTC
5. Test on mobile with ngrok

