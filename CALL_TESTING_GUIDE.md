# Video & Audio Call Testing Guide

## ✅ Fixes Applied

1. ✅ Fixed broken `.env` file (VITE_SIGNALING_SERVER)
2. ✅ Added TURN server configuration template
3. ✅ Removed duplicate socket handlers in server
4. ✅ Added comprehensive error handling for media permissions
5. ✅ Added connection state monitoring (connected, disconnected, failed, closed)
6. ✅ Added ICE connection state monitoring
7. ✅ Added ICE candidate queuing in ClientcalltoAstrologerVideoCall
8. ✅ Improved error messages for users

---

## 🚀 Quick Start Testing

### Step 1: Add TURN Server (CRITICAL!)
Edit `client/.env` and add:
```env
VITE_TURN_URL=turn:a.relay.metered.ca:443?transport=tcp
VITE_TURN_USERNAME=openrelayproject
VITE_TURN_CREDENTIAL=openrelayproject
```

### Step 2: Restart Both Server & Client
```bash
# Terminal 1 - Server
cd server
npm start

# Terminal 2 - Client
cd client
npm run dev
```

### Step 3: Test Basic Flow
1. Open browser 1: http://localhost:5173 (Client)
2. Open browser 2: http://localhost:5173 (Astrologer)
3. Login as astrologer in browser 2
4. Set astrologer status to "Online"
5. In browser 1, click on astrologer profile
6. Click "Video Call" or "Audio Call"
7. Accept call in browser 2
8. Verify video/audio streams appear

---

## 🧪 Testing Scenarios

### Test 1: Same Network (Should Always Work)
- Both users on same WiFi
- Expected: Call connects within 2-3 seconds
- Check: Both video streams visible

### Test 2: Different Networks (Requires TURN)
- User 1 on WiFi, User 2 on mobile hotspot
- Expected: Call connects within 5-10 seconds
- Check: Look for "relay" candidates in console

### Test 3: Permission Denied
1. Block camera/mic in browser settings
2. Try to start call
3. Expected: Clear error message with instructions

### Test 4: No Camera/Mic
1. Test on device without camera
2. Expected: "No camera found" error

### Test 5: Network Interruption
1. Start call successfully
2. Disconnect WiFi for 5 seconds
3. Reconnect WiFi
4. Expected: "Connection lost. Reconnecting..." message

### Test 6: Call Rejection
1. Client initiates call
2. Astrologer clicks "Reject"
3. Expected: Client sees rejection message

### Test 7: Call Timeout
1. Client initiates call
2. Astrologer doesn't respond for 45 seconds
3. Expected: "Request Missed" popup appears

---

## 🔍 Debugging Tools

### Browser Console Checks

#### 1. Check Socket Connection
```javascript
// Should see in console:
[Client] Socket connected: <socket-id>
[Astrologer] Socket connected: <socket-id>
```

#### 2. Check Call Request Flow
```javascript
// Client side:
[VideoCall] Sending call request to astrologer: {...}

// Server side:
📞 Call request from <client-id> to <astrologer-id>

// Astrologer side:
Incoming call request: {...}
```

#### 3. Check WebRTC Signaling
```javascript
// Should see:
[VideoCall] Requesting media access...
[VideoCall] Media access granted
[VideoCall] RTCPeerConnection created
[VideoCall] Sending offer to: <peer-socket-id>
[VideoCall] Received answer
[VideoCall] Connection state: connected
```

#### 4. Check ICE Candidates
```javascript
// Should see all three types:
[VideoCall] ICE Candidate type: host      // Local network
[VideoCall] ICE Candidate type: srflx     // STUN (public IP)
[VideoCall] ICE Candidate type: relay     // TURN (relay) ✅ IMPORTANT!
```

If you DON'T see "relay" type, TURN server is not working!

### Chrome WebRTC Internals
1. Open: `chrome://webrtc-internals/`
2. Start a call
3. Look for:
   - **ICE candidate pairs** - should show "relay" type
   - **Bytes sent/received** - should be increasing
   - **Connection state** - should be "connected"

### Firefox WebRTC Stats
1. Open: `about:webrtc`
2. Start a call
3. Check "Connection Log" for errors

---

## 🐛 Common Issues & Solutions

### Issue 1: "Connection failed" immediately
**Symptoms:**
- Call status goes to "failed" within seconds
- No video/audio streams

**Causes:**
- No TURN server configured
- Wrong TURN credentials
- Firewall blocking WebRTC

**Solutions:**
1. Add TURN server to `.env` (see TURN_SERVER_SETUP.md)
2. Test TURN credentials at: https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
3. Check firewall settings

### Issue 2: "Waiting for answer..." forever
**Symptoms:**
- Client stuck on "Connecting to Cosmos..."
- Astrologer doesn't receive notification

**Causes:**
- Socket not connected
- Astrologer offline
- Wrong userId mapping

**Solutions:**
1. Check console for socket connection errors
2. Verify astrologer is online (green dot)
3. Check `onlineUsers` map in server logs

### Issue 3: Call connects but no video/audio
**Symptoms:**
- Connection state shows "connected"
- Black screens or no audio

**Causes:**
- Bitrate is 0 (no data flowing)
- TURN server not working
- Media tracks not added to peer connection

**Solutions:**
1. Click "NET" button to see stats
2. Check if bitrate > 0
3. If bitrate = 0, TURN server issue
4. Check browser console for track errors

### Issue 4: "Camera already in use"
**Symptoms:**
- Error: "Camera/Microphone is already in use"

**Causes:**
- Another tab/app using camera
- Previous call didn't cleanup properly

**Solutions:**
1. Close other tabs using camera
2. Refresh page
3. Check Task Manager for apps using camera

### Issue 5: Poor call quality
**Symptoms:**
- Choppy video
- Audio cutting out
- High latency

**Causes:**
- Slow internet connection
- TURN server overloaded
- High packet loss

**Solutions:**
1. Check network stats (click "NET" button)
2. Look for high packet loss
3. Try different TURN server
4. Reduce video quality (future enhancement)

---

## 📊 Network Stats Interpretation

When you click the "NET" button during a call, you'll see:

### Good Connection:
```
Status: connected ✅
ICE: connected
Bitrate: 800-2000 kbps (video) or 20-50 kbps (audio)
Packet Loss: 0-2
RTT: 20-100ms
```

### Poor Connection:
```
Status: connected ⚠️
ICE: checking or disconnected
Bitrate: 0-100 kbps
Packet Loss: 10+
RTT: 500+ ms
```

### Failed Connection:
```
Status: failed ❌
ICE: failed
Bitrate: 0 kbps
Packet Loss: N/A
RTT: N/A
```

---

## 🎯 Success Criteria

Your calls are working properly if:

1. ✅ Call connects within 10 seconds
2. ✅ Both video streams visible and smooth
3. ✅ Audio is clear with no echo
4. ✅ Network stats show bitrate > 0
5. ✅ ICE candidates include "relay" type
6. ✅ Connection survives brief network interruptions
7. ✅ Calls work between different networks
8. ✅ Error messages are clear and helpful

---

## 🔧 Advanced Debugging

### Enable Verbose Logging
Add to component:
```javascript
pc.current.addEventListener('icecandidateerror', (event) => {
    console.error('ICE candidate error:', event);
});

pc.current.addEventListener('negotiationneeded', () => {
    console.log('Negotiation needed');
});
```

### Monitor All Socket Events
```javascript
socket.onAny((eventName, ...args) => {
    console.log(`[Socket] ${eventName}:`, args);
});
```

### Check Server Logs
Look for:
```
📞 Call request from <client> to <astrologer>
✅ Call accepted for socket <socket-id>
[Video Call] Offer from <socket-1> to <socket-2>
[Video Call] Answer from <socket-2> to <socket-1>
[Video Call] Candidate from <socket-1> to <socket-2>
```

---

## 📝 Testing Checklist

Before deploying to production:

### Basic Functionality:
- [ ] Video call connects successfully
- [ ] Audio call connects successfully
- [ ] Both video streams visible
- [ ] Audio is clear and synchronized
- [ ] Mute/unmute works
- [ ] Video on/off works
- [ ] End call works properly
- [ ] Call rejection works
- [ ] Call timeout works (45 seconds)

### Error Handling:
- [ ] Permission denied shows clear message
- [ ] No camera/mic shows clear message
- [ ] Connection failure shows clear message
- [ ] Network interruption handled gracefully
- [ ] Astrologer offline shows message

### Network Scenarios:
- [ ] Same WiFi network
- [ ] Different WiFi networks
- [ ] Mobile data to WiFi
- [ ] Behind corporate firewall
- [ ] VPN connection

### Browser Compatibility:
- [ ] Chrome desktop
- [ ] Firefox desktop
- [ ] Safari desktop
- [ ] Chrome mobile (Android)
- [ ] Safari mobile (iOS)

### Performance:
- [ ] Call connects in < 10 seconds
- [ ] Video quality is acceptable
- [ ] Audio has no echo or feedback
- [ ] No memory leaks (check after 10+ calls)
- [ ] CPU usage reasonable (< 50%)

---

## 🚨 Known Limitations

1. **No TURN server by default** - You MUST add one for production
2. **No call recording** - Not implemented yet
3. **No screen sharing** - Not implemented yet
4. **No group calls** - Only 1:1 calls supported
5. **No call quality adjustment** - Fixed bitrate
6. **No reconnection logic** - Call ends on disconnect

---

## 📞 Support

If calls still don't work after following this guide:

1. Check `VIDEO_AUDIO_CALL_ISSUES_FIXED.md` for detailed issue analysis
2. Check `TURN_SERVER_SETUP.md` for TURN server configuration
3. Enable verbose logging and share console output
4. Test TURN server at: https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
5. Check browser compatibility: https://caniuse.com/rtcpeerconnection

---

## 🎉 Next Steps

Once basic calls are working:

1. **Add TURN server** (if not done already)
2. **Test on production domain** (HTTPS required for camera/mic)
3. **Monitor call success rate** (add analytics)
4. **Implement reconnection logic** (auto-reconnect on disconnect)
5. **Add call quality indicators** (show network quality to users)
6. **Implement call recording** (if needed)
7. **Add screen sharing** (if needed)
8. **Optimize for mobile** (reduce bitrate, battery usage)

Good luck! 🚀
