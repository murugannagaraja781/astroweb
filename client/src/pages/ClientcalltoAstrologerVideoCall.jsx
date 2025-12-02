// ClientcalltoAstrologerVideoCall.jsx
import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SIGNALING_SERVER =
  import.meta.env.VITE_SIGNALING_SERVER ||
  "https://astroweb-production.up.railway.app";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    ...(import.meta.env.VITE_TURN_URL
      ? [
          {
            urls: import.meta.env.VITE_TURN_URL,
            username: import.meta.env.VITE_TURN_USERNAME,
            credential: import.meta.env.VITE_TURN_CREDENTIAL,
          },
        ]
      : []),
  ],
};

export default function ClientcalltoAstrologerVideoCall() {
  const localRef = useRef(null);
  const remoteRef = useRef(null);
  const socket = useRef(null);
  const pc = useRef(null);
  const localStream = useRef(null);

  const [incomingCall, setIncomingCall] = useState(false);
  const [callerId, setCallerId] = useState(null);
  const [inCall, setInCall] = useState(false);

  useEffect(() => {
    socket.current = io(SIGNALING_SERVER);

    // astrologer calls client
    socket.current.on("video:incoming_call", ({ from }) => {
      setCallerId(from);
      setIncomingCall(true);
    });

    // WebRTC signaling
    socket.current.on("call:offer", handleOffer);
    socket.current.on("call:candidate", handleCandidate);
    socket.current.on("call:end", () => cleanup());

    return () => cleanup();
  }, []);

  // --- Setup Local Media ---
  const setupLocal = async () => {
    if (localStream.current) return;

    localStream.current = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    localRef.current.srcObject = localStream.current;
  };

  // --- Accept Call ---
  const acceptCall = async () => {
    setIncomingCall(false);
    await setupLocal();

    socket.current.emit("video:call_accept", { to: callerId });
  };

  // --- Reject Call ---
  const rejectCall = () => {
    socket.current.emit("video:call_reject", { to: callerId });
    setIncomingCall(false);
  };

  // --- Handle Offer (Astrologer sends) ---
  const handleOffer = async ({ from, offer }) => {
    await setupLocal();

    pc.current = new RTCPeerConnection(ICE_SERVERS);

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
          to: from,
          candidate: e.candidate,
        });
      }
    };

    await pc.current.setRemoteDescription(offer);
    const answer = await pc.current.createAnswer();
    await pc.current.setLocalDescription(answer);

    socket.current.emit("call:answer", {
      to: from,
      answer,
    });

    setInCall(true);
  };

  // --- Handle Ice Candidates ---
  const handleCandidate = async ({ candidate }) => {
    if (!pc.current) return;
    await pc.current.addIceCandidate(candidate);
  };

  // --- End Call ---
  const endCall = () => {
    socket.current.emit("call:end", { to: callerId });
    cleanup();
  };

  // --- Cleanup ---
  const cleanup = () => {
    try {
      pc.current?.close();
    } catch {}
    pc.current = null;

    if (localStream.current) {
      localStream.current.getTracks().forEach((t) => t.stop());
    }
    localStream.current = null;

    setInCall(false);
    setIncomingCall(false);
  };

  return (
    <div className="p-4 text-center text-white">
      <h2 className="text-xl mb-4">Client Video Call</h2>

      {/* Incoming Call Popup */}
      {incomingCall && (
        <div className="p-4 bg-purple-600 rounded-md shadow-lg">
          <p className="text-lg mb-4">📞 Incoming Call from Astrologer</p>
          <button
            className="bg-green-500 px-4 py-2 rounded-md mr-2"
            onClick={acceptCall}
          >
            Accept
          </button>
          <button
            className="bg-red-500 px-4 py-2 rounded-md"
            onClick={rejectCall}
          >
            Reject
          </button>
        </div>
      )}

      {/* Local Video */}
      <div className="mt-4">
        <h4>Your Video</h4>
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
        <h4>Astrologer</h4>
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
