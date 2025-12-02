 // AstrologertoClientVideoCall.jsx
import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SIGNALING_SERVER =
  import.meta.env.VITE_SIGNALING_SERVER ||
  "https://astroweb-production.up.railway.app";

const ICE_SERVERS = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export default function AstrologertoClientVideoCall() {
  const localRef = useRef(null);
  const remoteRef = useRef(null);
  const socket = useRef(null);
  const pc = useRef(null);
  const localStream = useRef(null);

  const [clientSocketId, setClientSocketId] = useState(null);
  const [waitingForAnswer, setWaitingForAnswer] = useState(false);
  const [inCall, setInCall] = useState(false);

  useEffect(() => {
    socket.current = io(SIGNALING_SERVER);

    // Someone (client) connects → astrologer needs their socket id
    socket.current.on("connect", () => {
      console.log("Astrologer connected:", socket.current.id);
    });

    // When client joins astrologer room in UI → this event triggers
    socket.current.on("peer:joined", ({ socketId }) => {
      console.log("Client joined:", socketId);
      setClientSocketId(socketId);
    });

    socket.current.on("video:call_accepted", handleCallAccepted);
    socket.current.on("video:call_rejected", handleCallRejected);
    socket.current.on("call:answer", handleAnswer);
    socket.current.on("call:candidate", handleCandidate);
    socket.current.on("call:end", () => cleanup());

    return () => cleanup();
  }, []);

  // Setup Local Media
  const setupLocal = async () => {
    if (localStream.current) return;

    localStream.current = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    localRef.current.srcObject = localStream.current;
  };

  // Send call request to client
  const startCall = async () => {
    if (!clientSocketId) {
      alert("Client not connected yet");
      return;
    }

    await setupLocal();

    socket.current.emit("video:call_request", {
      to: clientSocketId,
    });

    setWaitingForAnswer(true);
  };

  // When client accepts → astrologer creates offer
  const handleCallAccepted = async () => {
    setWaitingForAnswer(false);

    pc.current = new RTCPeerConnection(ICE_SERVERS);

    // Add media tracks
    localStream.current.getTracks().forEach((track) =>
      pc.current.addTrack(track, localStream.current)
    );

    pc.current.ontrack = (e) => {
      remoteRef.current.srcObject = e.streams[0];
      setInCall(true);
    };

    pc.current.onicecandidate = (e) => {
      if (e.candidate) {
        socket.current.emit("call:candidate", {
          to: clientSocketId,
          candidate: e.candidate,
        });
      }
    };

    // Create offer
    const offer = await pc.current.createOffer();
    await pc.current.setLocalDescription(offer);

    socket.current.emit("call:offer", {
      to: clientSocketId,
      offer,
    });
  };

  // When client rejects
  const handleCallRejected = () => {
    setWaitingForAnswer(false);
    alert("Client rejected the call");
  };

  // When astrologer receives the client's answer
  const handleAnswer = async ({ answer }) => {
    if (!pc.current) return;

    await pc.current.setRemoteDescription(answer);
    setInCall(true);
  };

  // Handle ICE candidate from client
  const handleCandidate = async ({ candidate }) => {
    if (!pc.current) return;
    await pc.current.addIceCandidate(candidate);
  };

  // End call
  const endCall = () => {
    socket.current.emit("call:end", { to: clientSocketId });
    cleanup();
  };

  // Cleanup function
  const cleanup = () => {
    try {
      pc.current?.close();
    } catch {}
    pc.current = null;

    if (localStream.current) {
      localStream.current.getTracks().forEach((t) => t.stop());
    }

    setInCall(false);
    setWaitingForAnswer(false);
  };

  return (
    <div className="p-4 text-center text-white">
      <h2 className="text-xl mb-4">Astrologer Video Call</h2>

      {!clientSocketId && (
        <p className="text-yellow-400">Waiting for client to join…</p>
      )}

      {clientSocketId && !inCall && !waitingForAnswer && (
        <button
          onClick={startCall}
          className="bg-green-600 px-4 py-2 rounded-md"
        >
          Start Call
        </button>
      )}

      {waitingForAnswer && (
        <p className="mt-4 text-blue-300">📞 Calling client… waiting…</p>
      )}

      {/* Local Video */}
      <div className="mt-4">
        <h4>You</h4>
        <video
          ref={localRef}
          autoPlay
          muted
          playsInline
          className="w-64 bg-black rounded-md"
        />
      </div>

      {/* Remote Video */}
      <div className="mt-4">
        <h4>Client</h4>
        <video
          ref={remoteRef}
          autoPlay
          playsInline
          className="w-64 bg-black rounded-md"
        />
      </div>

      {inCall && (
        <button
          onClick={endCall}
          className="mt-6 bg-red-600 px-4 py-2 rounded-md"
        >
          End Call
        </button>
      )}
    </div>
  );
}
