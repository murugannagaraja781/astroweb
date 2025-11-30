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

  const [clientSocket, setClientSocket] = useState(null);
  const [inCall, setInCall] = useState(false);
  const [waitingForAnswer, setWaitingForAnswer] = useState(false);

  useEffect(() => {
    connectSocket();
    return () => endCall();
  }, []);

  const connectSocket = () => {
    socketRef.current = io(SIGNALING_SERVER);

    socketRef.current.on("connect", () => {
      socketRef.current.emit("join", roomId);
    });

    socketRef.current.on("peer:joined", ({ socketId }) => {
      setClientSocket(socketId);
    });

    socketRef.current.on("video:call_accepted", () => {
      startPeerOffer();
    });

    socketRef.current.on("video:call_rejected", () => {
      alert("Client rejected the call");
      setWaitingForAnswer(false);
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

  const startCallRequest = () => {
    if (!clientSocket) return alert("Client not in room");

    socketRef.current.emit("video:call_request", {
      roomId,
      to: clientSocket,
    });

    setWaitingForAnswer(true);
  };

  const startPeerOffer = async () => {
    await setupLocalStream();

    pcRef.current = new RTCPeerConnection(ICE_SERVERS);

    localStreamRef.current.getTracks().forEach((track) =>
      pcRef.current.addTrack(track, localStreamRef.current)
    );

    pcRef.current.ontrack = (e) => {
      remoteRef.current.srcObject = e.streams[0];
    };

    pcRef.current.onicecandidate = (e) => {
      if (e.candidate) {
        socketRef.current.emit("call:candidate", {
          roomId,
          candidate: e.candidate,
          to: clientSocket,
        });
      }
    };

    const offer = await pcRef.current.createOffer();
    await pcRef.current.setLocalDescription(offer);

    socketRef.current.emit("call:offer", {
      roomId,
      offer,
      to: clientSocket,
    });

    setInCall(true);
    setWaitingForAnswer(false);
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
    if (pcRef.current) pcRef.current.close();
    if (localStreamRef.current)
      localStreamRef.current.getTracks().forEach((t) => t.stop());

    setInCall(false);
  };

  return (
    <div>
      <h3>Astrologer Video Call</h3>

      <video ref={localRef} autoPlay muted playsInline style={{ width: "45%" }} />
      <video ref={remoteRef} autoPlay playsInline style={{ width: "45%" }} />

      {!inCall && !waitingForAnswer && (
        <button onClick={startCallRequest}>📞 Start Call</button>
      )}

      {waitingForAnswer && <p>⏳ Waiting for client to accept…</p>}

      {inCall && <button onClick={endCall}>End Call</button>}
    </div>
  );
}
