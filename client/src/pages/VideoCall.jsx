// VideoCall.jsx
import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

/**
 * Simple 1:1 WebRTC video call component using Socket.IO for signaling.
 * - Join a room (roomId string)
 * - If another peer is present, exchange offer/answer/ICE via server
 *
 * IMPORTANT:
 * - Replace SIGNALING_SERVER with your server URL
 * - This example uses a single STUN server (Google). Add TURN for production.
 */

const SIGNALING_SERVER = import.meta.env.VITE_SIGNALING_SERVER || "https://astroweb-production.up.railway.app";
const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" }
    // Add TURN servers here for production
  ]
};

export default function VideoCall({name}) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const socketRef = useRef(null);
  const localStreamRef = useRef(null);

  const [roomId, setRoomId] = useState(name);
  const [joined, setJoined] = useState(false);
  const [calling, setCalling] = useState(false);
  const [muted, setMuted] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      cleanupCall();
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ensureSocket = () => {
    if (!socketRef.current) {
      socketRef.current = io(SIGNALING_SERVER, { autoConnect: true });
      attachSocketHandlers();
    }
    return socketRef.current;
  };

  const attachSocketHandlers = () => {
    const socket = socketRef.current;
    socket.on("connect", () => {
      console.log("Connected to signaling server", socket.id);
    });

    socket.on("joined", (data) => {
      console.log("Joined room:", data);
      setJoined(true);
    });

    socket.on("peer:joined", ({ socketId }) => {
      console.log("Peer joined:", socketId);
      // Could auto-initiate call here if desired
    });

    socket.on("call:offer", async ({ from, offer }) => {
      console.log("Received offer from:", from);
      await ensureLocalStream();
      await createPeerConnection(from);
      try {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pcRef.current.createAnswer();
        await pcRef.current.setLocalDescription(answer);
        socket.emit("call:answer", { roomId, answer, to: from });
        setCalling(true);
      } catch (err) {
        console.error("Error handling offer:", err);
      }
    });

    socket.on("call:answer", async ({ from, answer }) => {
      console.log("Received answer from:", from);
      try {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (err) {
        console.error("Error setting remote answer:", err);
      }
    });

    socket.on("call:candidate", async ({ from, candidate }) => {
      if (!candidate) return;
      try {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("Error adding ICE candidate:", err);
      }
    });

    socket.on("peer:left", ({ socketId }) => {
      console.log("Peer left:", socketId);
      hangup();
    });
  };

  const joinRoom = () => {
    if (!roomId.trim()) return alert("Enter a room ID");
    ensureSocket();
    socketRef.current.emit("join", roomId);
    setJoined(true);
  };

  const ensureLocalStream = async () => {
    if (localStreamRef.current) return localStreamRef.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      console.error("Error getting media:", err);
      throw err;
    }
  };

  const createPeerConnection = async (remoteSocketId) => {
    if (pcRef.current) return pcRef.current;

    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    // Add local tracks
    const localStream = localStreamRef.current;
    if (localStream) {
      localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
    }

    // Remote tracks -> attach to remoteVideo
    pc.ontrack = (evt) => {
      // When multiple tracks come, use the first stream
      const [stream] = evt.streams;
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    };

    // ICE candidates -> send via socket
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit("call:candidate", {
          roomId,
          candidate: event.candidate,
          to: remoteSocketId // target peer
        });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("PC state:", pc.connectionState);
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed" || pc.connectionState === "closed") {
        hangup();
      }
    };

    return pc;
  };

  const startCall = async () => {
    if (!roomId.trim()) return alert("Join a room first");
    await ensureLocalStream();
    ensureSocket();

    // Create offer and send to room (server will forward to others)
    const pc = await createPeerConnection(); // no target yet
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socketRef.current.emit("call:offer", { roomId, offer });
      setCalling(true);
    } catch (err) {
      console.error("Error starting call:", err);
    }
  };

  const hangup = () => {
    // Close peer connection
    if (pcRef.current) {
      try {
        pcRef.current.close();
      } catch (e) {}
      pcRef.current = null;
    }

    // Stop local tracks if you want to release camera/mic
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      if (localVideoRef.current) localVideoRef.current.srcObject = null;
    }

    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setCalling(false);

    // Optionally notify server
    if (socketRef.current) socketRef.current.emit("leave", roomId);
  };

  const cleanupCall = () => {
    hangup();
    if (socketRef.current) {
      socketRef.current.off();
    }
  };

  const toggleMute = () => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
    setMuted((m) => !m);
  };

  const toggleVideo = () => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
    setVideoEnabled((v) => !v);
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold mb-2">WebRTC Video Call (Socket.IO signaling)</h2>

      <div className="mb-3 flex gap-2">
        <input
          type="text"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          placeholder="Room ID"
          className="border px-3 py-2 rounded flex-1"
        />
        {!joined ? (
          <button onClick={joinRoom} className="px-4 py-2 bg-blue-600 text-white rounded">Join</button>
        ) : (
          <button onClick={() => {
            // allow re-join logic if needed
            if (!socketRef.current) ensureSocket();
            socketRef.current.emit("join", roomId);
          }} className="px-4 py-2 bg-gray-600 text-white rounded">Re-Join</button>
        )}
        <button onClick={startCall} className="px-4 py-2 bg-green-600 text-white rounded">Call</button>
        <button onClick={hangup} className="px-4 py-2 bg-red-600 text-white rounded">Hangup</button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3">
        <div className="bg-black/70 rounded overflow-hidden">
          <p className="text-sm text-center py-1 bg-black/50 text-white">Local</p>
          <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-64 object-cover bg-black" />
        </div>
        <div className="bg-black/70 rounded overflow-hidden">
          <p className="text-sm text-center py-1 bg-black/50 text-white">Remote</p>
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-64 object-cover bg-black" />
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={toggleMute} className="px-3 py-2 border rounded">
          {muted ? "Unmute" : "Mute"}
        </button>
        <button onClick={toggleVideo} className="px-3 py-2 border rounded">
          {videoEnabled ? "Stop Video" : "Start Video"}
        </button>
        <div className="flex-1 text-right text-sm text-gray-600">
          {calling ? "In call" : "Not in call"}
        </div>
      </div>
    </div>
  );
}
