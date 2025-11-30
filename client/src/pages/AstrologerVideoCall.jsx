// AstrologerVideoCall.jsx
import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SIGNALING_SERVER = import.meta.env.VITE_SIGNALING_SERVER || "http://localhost:3000";

const ICE_SERVERS = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export default function AstrologerVideoCall({ roomId }) {
  const localRef = useRef(null);
  const remoteRef = useRef(null);
  const socketRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);

  const [joined, setJoined] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [clientSocket, setClientSocket] = useState(null);

  useEffect(() => {
    connectSocket();
    return () => endCall();
  }, []);

  const connectSocket = () => {
    socketRef.current = io(SIGNALING_SERVER);

    socketRef.current.on("connect", () => {
      socketRef.current.emit("join", roomId);
      setJoined(true);
    });

    socketRef.current.on("peer:joined", ({ socketId }) => {
      setClientSocket(socketId);
    });

    socketRef.current.on("call:answer", handleAnswer);
    socketRef.current.on("call:candidate", handleCandidate);
  };

  const setupLocalStream = async () => {
    if (localStreamRef.current) return;

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    localStreamRef.current = stream;
    localRef.current.srcObject = stream;
  };

  const createPeer = async (toSocketId) => {
    if (pcRef.current) return pcRef.current;

    pcRef.current = new RTCPeerConnection(ICE_SERVERS);

    const stream = localStreamRef.current;
    stream.getTracks().forEach((track) => pcRef.current.addTrack(track, stream));

    pcRef.current.ontrack = (e) => {
      remoteRef.current.srcObject = e.streams[0];
    };

    pcRef.current.onicecandidate = (e) => {
      if (e.candidate) {
        socketRef.current.emit("call:candidate", {
          roomId,
          candidate: e.candidate,
          to: toSocketId,
        });
      }
    };

    return pcRef.current;
  };

  const startCall = async () => {
    if (!clientSocket) return alert("Waiting for client to join…");

    await setupLocalStream();
    const pc = await createPeer(clientSocket);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socketRef.current.emit("call:offer", {
      roomId,
      offer,
      to: clientSocket,
    });

    setInCall(true);
  };

  const handleAnswer = async ({ answer }) => {
    if (pcRef.current) {
      await pcRef.current.setRemoteDescription(answer);
    }
  };

  const handleCandidate = ({ candidate }) => {
    if (pcRef.current) {
      pcRef.current.addIceCandidate(candidate);
    }
  };

  const endCall = () => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    setInCall(false);
  };

  return (
    <div>
      <h3>Astrologer Video Call</h3>

      <video autoPlay playsInline muted ref={localRef} style={{ width: "45%" }} />
      <video autoPlay playsInline ref={remoteRef} style={{ width: "45%" }} />

      {!inCall ? (
        <button onClick={startCall}>Start Call</button>
      ) : (
        <button onClick={endCall}>End Call</button>
      )}
    </div>
  );
}
