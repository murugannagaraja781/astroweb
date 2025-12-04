# Video Call Not Working - Complete Diagnosis & Fix

## 🔍 Issues Identified

### 1. **Missing TURN Server** ❌
- Your .env has TURN server commented out
- Without TURN, calls fail when users are behind NAT/firewall
- Only STUN servers configured (not enough for most networks)

### 2. **Socket.IO Connection Issues** ⚠️
- Using localhost but may not be running
- No error handling for socket connection failures
- Socket events may not be properly registered

### 3. **Peer Socket ID Dependency** ❌
- ICE candidates only sent when `peerSocketId` exists
- But `peerSocketId` is set AFTER offer is received
- Early candidates are lost

### 4. **Room Joining Missing** ❌
- Socket connects but never joins the room
- No `socket.emit('join-room', roomId)`
- Peers can't find each other

### 5. **No Offer Creation** ❌
- Client waits for offer but never creates one
- Need logic to determine who initiates the call

---

## 🛠️ Complete Fix

### Fix 1: Add TURN Server (Critical)

Update `client/.env`:
```env
# TURN Server (FREE - No signup required)
VITE_TURN_URL=turn:openrelay.metered.ca:443?transport=tcp
VITE_TURN_USERNAME=openrelayproject
VITE_TURN_CREDENTIAL=openrelayproject
```

Or get better TURN credentials from:
- https://www.metered.ca/tools/openrelay/ (Free)
- https://xirsys.com/ (Free tier)
- Twilio TURN (Paid)

### Fix 2: Fix Socket Connection & Room Joining

Replace the video call component with this fixed version:



```javascript
// ClientcalltoAstrologerVideoCall.jsx - FIXED VERSION
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { FiVideo, FiVideoOff, FiMic, FiMicOff, FiPhone } from "react-icons/fi";

const SIGNALING_SERVER = import.meta.env.VITE_SIGNALING_SERVER || "http://localhost:9001";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    // TURN server (REQUIRED for NAT traversal)
    ...(import.meta.env.VITE_TURN_URL ? [{
      urls: import.meta.env.VITE_TURN_URL,
      username: import.meta.env.VITE_TURN_USERNAME,
      credential: import.meta.env.VITE_TURN_CREDENTIAL,
    }] : [
      // Fallback free TURN server
      {
        urls: "turn:openrelay.metered.ca:443?transport=tcp",
        username: "openrelayproject",
        credential: "openrelayproject"
      }
    ]),
  ],
};

export default function ClientcalltoAstrologerVideoCall({ roomId, isInitiator = false }) {
  const localRef = useRef(null);
  const remoteRef = useRef(null);
  const socket = useRef(null);
  const pc = useRef(null);
  const localStream = useRef(null);

  const [callStatus, setCallStatus] = useState("initializing");
  const [isLocalVideoEnabled, setIsLocalVideoEnabled] = useState(true);
  const [isLocalAudioEnabled, setIsLocalAudioEnabled] = useState(true);
  const [error, setError] = useState(null);
  const [peerSocketId, setPeerSocketId] = useState(null);
  const candidateQueue = useRef([]);
  const [connectionStats, setConnectionStats] = useState({});

  useEffect(() => {
    console.log("[VideoCall] Initializing with:", { roomId, isInitiator, server: SIGNALING_SERVER });

    if (!roomId) {
      setError("❌ Missing room ID");
      return;
    }

    // Initialize socket
    socket.current = io(SIGNALING_SERVER, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.current.on('connect', () => {
      console.log("[VideoCall] Socket connected:", socket.current.id);
      setCallStatus("connecting");

      // Join the room
      socket.current.emit('join-room', { roomId });
      console.log("[VideoCall] Joined room:", roomId);
    });

    socket.current.on('connect_error', (err) => {
      console.error("[VideoCall] Socket connection error:", err);
      setError(`❌ Connection error: ${err.message}`);
    });

    socket.current.on('disconnect', () => {
      console.log("[VideoCall] Socket disconnected");
      setCallStatus("disconnected");
    });

    const initCall = async () => {
      try {
        console.log("[VideoCall] Requesting media devices...");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: true
        });

        console.log("[VideoCall] Got media stream:", stream.getTracks().length, "tracks");
        localStream.current = stream;
        if (localRef.current) {
          localRef.current.srcObject = stream;
        }

        // Create peer connection
        pc.current = new RTCPeerConnection(ICE_SERVERS);
        console.log("[VideoCall] Created RTCPeerConnection");

        // Add tracks
        stream.getTracks().forEach(track => {
          console.log("[VideoCall] Adding track:", track.kind);
          pc.current.addTrack(track, stream);
        });

        // ICE candidate handler
        pc.current.onicecandidate = (event) => {
          if (event.candidate) {
            console.log("[VideoCall] Sending ICE candidate");
            socket.current.emit("call:candidate", {
              roomId,
              candidate: event.candidate
            });
          } else {
            console.log("[VideoCall] ICE gathering complete");
          }
        };

        // Track handler
        pc.current.ontrack = (event) => {
          console.log("[VideoCall] Received remote track:", event.track.kind);
          if (remoteRef.current && event.streams[0]) {
            remoteRef.current.srcObject = event.streams[0];
            setCallStatus("connected");
          }
        };

        // Connection state monitoring
        pc.current.onconnectionstatechange = () => {
          const state = pc.current.connectionState;
          console.log("[VideoCall] Connection state:", state);

          switch (state) {
            case 'connected':
              setCallStatus("connected");
              setError(null);
              startStatsMonitoring();
              break;
            case 'disconnected':
              setCallStatus("disconnected");
              setError("⚠️ Connection lost. Reconnecting...");
              break;
            case 'failed':
              setCallStatus("failed");
              setError("❌ Connection failed. Check your network and TURN server.");
              break;
            case 'closed':
              setCallStatus("ended");
              break;
          }
        };

        pc.current.oniceconnectionstatechange = () => {
          const state = pc.current.iceConnectionState;
          console.log("[VideoCall] ICE state:", state);

          if (state === "failed") {
            setError("❌ ICE connection failed. You may need a TURN server.");
          }
        };

        // If initiator, create and send offer
        if (isInitiator) {
          console.log("[VideoCall] Creating offer as initiator");
          const offer = await pc.current.createOffer();
          await pc.current.setLocalDescription(offer);

          socket.current.emit("call:offer", {
            roomId,
            offer
          });
          console.log("[VideoCall] Offer sent");
        }

        setCallStatus("waiting");

      } catch (err) {
        console.error("[VideoCall] Error initializing:", err);
        let errorMessage = "Failed to access camera/microphone. ";

        if (err.name === "NotAllowedError") {
          errorMessage = "❌ Camera/Microphone permission denied. Please allow access.";
        } else if (err.name === "NotFoundError") {
          errorMessage = "❌ No camera or microphone found.";
        } else if (err.name === "NotReadableError") {
          errorMessage = "❌ Camera/Microphone is already in use.";
        } else {
          errorMessage = `❌ ${err.message}`;
        }

        setError(errorMessage);
        setCallStatus("error");
      }
    };

    initCall();

    // Socket event handlers
    const handleOffer = async ({ offer, fromSocketId }) => {
      console.log("[VideoCall] Received offer from:", fromSocketId);
      setPeerSocketId(fromSocketId);

      if (!pc.current) {
        console.error("[VideoCall] No peer connection");
        return;
      }

      try {
        await pc.current.setRemoteDescription(new RTCSessionDescription(offer));
        console.log("[VideoCall] Remote description set");

        // Process queued candidates
        while (candidateQueue.current.length > 0) {
          const candidate = candidateQueue.current.shift();
          await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
          console.log("[VideoCall] Added queued candidate");
        }

        const answer = await pc.current.createAnswer();
        await pc.current.setLocalDescription(answer);

        socket.current.emit("call:answer", {
          roomId,
          answer
        });
        console.log("[VideoCall] Answer sent");

      } catch (err) {
        console.error("[VideoCall] Error handling offer:", err);
        setError("Failed to establish connection: " + err.message);
      }
    };

    const handleAnswer = async ({ answer }) => {
      console.log("[VideoCall] Received answer");

      if (!pc.current) {
        console.error("[VideoCall] No peer connection");
        return;
      }

      try {
        await pc.current.setRemoteDescription(new RTCSessionDescription(answer));
        console.log("[VideoCall] Remote description set from answer");

        // Process queued candidates
        while (candidateQueue.current.length > 0) {
          const candidate = candidateQueue.current.shift();
          await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
          console.log("[VideoCall] Added queued candidate");
        }

      } catch (err) {
        console.error("[VideoCall] Error handling answer:", err);
        setError("Failed to complete connection: " + err.message);
      }
    };

    const handleCandidate = async ({ candidate }) => {
      console.log("[VideoCall] Received ICE candidate");

      if (!pc.current) {
        console.error("[VideoCall] No peer connection");
        return;
      }

      try {
        if (pc.current.remoteDescription) {
          await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
          console.log("[VideoCall] ICE candidate added");
        } else {
          console.log("[VideoCall] Queuing candidate (no remote description yet)");
          candidateQueue.current.push(candidate);
        }
      } catch (err) {
        console.error("[VideoCall] Error adding ICE candidate:", err);
      }
    };

    const handleEnd = () => {
      console.log("[VideoCall] Call ended by peer");
      setCallStatus("ended");
      cleanup();
    };

    const handleUserJoined = ({ socketId }) => {
      console.log("[VideoCall] User joined:", socketId);
      setPeerSocketId(socketId);
    };

    // Register socket listeners
    socket.current.on("call:offer", handleOffer);
    socket.current.on("call:answer", handleAnswer);
    socket.current.on("call:candidate", handleCandidate);
    socket.current.on("call:end", handleEnd);
    socket.current.on("user-joined", handleUserJoined);

    return () => {
      console.log("[VideoCall] Cleanup");
      cleanup();

      if (socket.current) {
        socket.current.off("call:offer");
        socket.current.off("call:answer");
        socket.current.off("call:candidate");
        socket.current.off("call:end");
        socket.current.off("user-joined");
        socket.current.disconnect();
      }
    };
  }, [roomId, isInitiator]);

  const startStatsMonitoring = () => {
    const interval = setInterval(async () => {
      if (pc.current && pc.current.connectionState === 'connected') {
        const stats = await pc.current.getStats();
        const statsObj = {};

        stats.forEach(report => {
          if (report.type === 'inbound-rtp' && report.kind === 'video') {
            statsObj.bytesReceived = report.bytesReceived;
            statsObj.packetsLost = report.packetsLost;
          }
        });

        setConnectionStats(statsObj);
      }
    }, 2000);

    return () => clearInterval(interval);
  };

  const cleanup = () => {
    console.log("[VideoCall] Cleaning up resources");

    if (localStream.current) {
      localStream.current.getTracks().forEach(track => {
        track.stop();
        console.log("[VideoCall] Stopped track:", track.kind);
      });
    }

    if (pc.current) {
      pc.current.close();
      console.log("[VideoCall] Closed peer connection");
    }
  };

  const toggleVideo = () => {
    if (localStream.current) {
      const track = localStream.current.getVideoTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsLocalVideoEnabled(track.enabled);
        console.log("[VideoCall] Video:", track.enabled ? "enabled" : "disabled");
      }
    }
  };

  const toggleAudio = () => {
    if (localStream.current) {
      const track = localStream.current.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsLocalAudioEnabled(track.enabled);
        console.log("[VideoCall] Audio:", track.enabled ? "enabled" : "disabled");
      }
    }
  };

  const endCall = () => {
    console.log("[VideoCall] Ending call");

    if (socket.current) {
      socket.current.emit("call:end", { roomId });
    }

    setCallStatus("ended");
    cleanup();
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Status Bar */}
      <div className="bg-gray-800 p-4 text-white">
        <div className="flex justify-between items-center">
          <div>
            <span className="font-semibold">Status: </span>
            <span className={`
              ${callStatus === 'connected' ? 'text-green-400' : ''}
              ${callStatus === 'connecting' || callStatus === 'waiting' ? 'text-yellow-400' : ''}
              ${callStatus === 'failed' || callStatus === 'error' ? 'text-red-400' : ''}
            `}>
              {callStatus.toUpperCase()}
            </span>
          </div>
          <div className="text-sm text-gray-400">
            Room: {roomId}
          </div>
        </div>

        {error && (
          <div className="mt-2 p-2 bg-red-900 text-red-200 rounded text-sm">
            {error}
          </div>
        )}

        {connectionStats.bytesReceived && (
          <div className="mt-2 text-xs text-gray-400">
            Received: {(connectionStats.bytesReceived / 1024).toFixed(0)} KB |
            Lost: {connectionStats.packetsLost || 0} packets
          </div>
        )}
      </div>

      {/* Video Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        {/* Remote Video */}
        <div className="relative bg-black rounded-lg overflow-hidden">
          <video
            ref={remoteRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-4 left-4 text-white bg-black bg-opacity-50 px-3 py-1 rounded">
            Remote
          </div>
        </div>

        {/* Local Video */}
        <div className="relative bg-black rounded-lg overflow-hidden">
          <video
            ref={localRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-4 left-4 text-white bg-black bg-opacity-50 px-3 py-1 rounded">
            You
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-6">
        <div className="flex justify-center gap-4">
          <button
            onClick={toggleVideo}
            className={`p-4 rounded-full ${
              isLocalVideoEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
            } text-white transition-colors`}
            title={isLocalVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
          >
            {isLocalVideoEnabled ? <FiVideo size={24} /> : <FiVideoOff size={24} />}
          </button>

          <button
            onClick={toggleAudio}
            className={`p-4 rounded-full ${
              isLocalAudioEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
            } text-white transition-colors`}
            title={isLocalAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
          >
            {isLocalAudioEnabled ? <FiMic size={24} /> : <FiMicOff size={24} />}
          </button>

          <button
            onClick={endCall}
            className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
            title="End call"
          >
            <FiPhone size={24} className="rotate-135" />
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Fix 3: Update Server Socket Handlers

Make sure your server has these socket handlers in `server/socket.js`:

```javascript
// server/socket.js
module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join room
    socket.on('join-room', ({ roomId }) => {
      socket.join(roomId);
      console.log(`${socket.id} joined room: ${roomId}`);

      // Notify others in room
      socket.to(roomId).emit('user-joined', { socketId: socket.id });
    });

    // Forward offer
    socket.on('call:offer', ({ roomId, offer }) => {
      console.log(`Offer from ${socket.id} to room ${roomId}`);
      socket.to(roomId).emit('call:offer', {
        offer,
        fromSocketId: socket.id
      });
    });

    // Forward answer
    socket.on('call:answer', ({ roomId, answer }) => {
      console.log(`Answer from ${socket.id} to room ${roomId}`);
      socket.to(roomId).emit('call:answer', {
        answer,
        fromSocketId: socket.id
      });
    });

    // Forward ICE candidates
    socket.on('call:candidate', ({ roomId, candidate }) => {
      console.log(`ICE candidate from ${socket.id} to room ${roomId}`);
      socket.to(roomId).emit('call:candidate', {
        candidate,
        fromSocketId: socket.id
      });
    });

    // End call
    socket.on('call:end', ({ roomId }) => {
      console.log(`Call ended by ${socket.id} in room ${roomId}`);
      socket.to(roomId).emit('call:end');
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};
```

---

## 🧪 Testing Steps

### 1. Start Local Server
```bash
cd server
npm start
# Should see: Server running on port 9001
```

### 2. Start Client
```bash
cd client
npm run dev
# Should see: Local: http://localhost:5173
```

### 3. Test Video Call

Open two browser windows:
- Window 1: `http://localhost:5173/video-call?room=test123&initiator=true`
- Window 2: `http://localhost:5173/video-call?room=test123`

Check browser console for logs.

---

## 🐛 Debugging Checklist

- [ ] Server is running on port 9001
- [ ] Socket.IO connects (check console: "Socket connected")
- [ ] Room joined (check console: "Joined room")
- [ ] Camera/mic permission granted
- [ ] Local video shows in "You" panel
- [ ] Offer/Answer exchanged (check console logs)
- [ ] ICE candidates sent/received
- [ ] Connection state becomes "connected"
- [ ] Remote video appears
- [ ] TURN server configured (critical for production)

---

## 📊 Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "NotAllowedError" | Camera permission denied | Allow in browser settings |
| "ICE failed" | No TURN server | Add TURN credentials to .env |
| "Socket connection error" | Server not running | Start server with `npm start` |
| "No remote video" | Offer/answer not exchanged | Check socket event handlers |
| "Connection failed" | Firewall blocking | Use TURN server with TCP/443 |

---

## ✅ Quick Fix Summary

1. **Add TURN server to `.env`**
2. **Replace video call component** with fixed version above
3. **Update server socket handlers**
4. **Restart both server and client**
5. **Test with two browser windows**

Your video call should now work! 🎉
