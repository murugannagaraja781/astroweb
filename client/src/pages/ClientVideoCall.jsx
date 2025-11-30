 import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SIGNALING_SERVER = import.meta.env.VITE_SIGNALING_SERVER || "https://astroweb-production.up.railway.app";

const ICE_SERVERS = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export default function ClientVideoCall({ roomId }) {
  const localRef = useRef(null);
  const remoteRef = useRef(null);
  const socketRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);

  const [incomingCall, setIncomingCall] = useState(false);
  const [caller, setCaller] = useState(null);
  const [inCall, setInCall] = useState(false);

  useEffect(() => {
    connectSocket();
    return () => endCall();
  }, []);

  const connectSocket = () => {
    socketRef.current = io(SIGNALING_SERVER);

    socketRef.current.on("connect", () => {
      socketRef.current.emit("join", roomId);
    });

    socketRef.current.on("video:incoming_call", ({ from }) => {
      setCaller(from);
      setIncomingCall(true);
    });

    socketRef.current.on("call:offer", handleOffer);
    socketRef.current.on("call:candidate", handleCandidate);
  };

  const acceptCall = () => {
    socketRef.current.emit("video:call_accept", {
      roomId,
      to: caller,
    });

    setIncomingCall(false);
  };

  const rejectCall = () => {
    socketRef.current.emit("video:call_reject", {
      roomId,
      to: caller,
    });
    setIncomingCall(false);
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

  const handleOffer = async ({ from, offer }) => {
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
          to: from,
        });
      }
    };

    await pcRef.current.setRemoteDescription(offer);

    const answer = await pcRef.current.createAnswer();
    await pcRef.current.setLocalDescription(answer);

    socketRef.current.emit("call:answer", {
      roomId,
      answer,
      to: from,
    });

    setInCall(true);
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
      <h3 style={{color:'red'}}>Client Video Call</h3>

      {incomingCall && (
        <div style={{ background: "#222", padding: 20, borderRadius: 10 }}>
          <h4>📞 Astrologer is calling you…</h4>
          <button style={{backgroundColor:'green'}}onClick={acceptCall}>Accept</button>
          <button style={{backgroundColor:'red'}} onClick={rejectCall}>Reject</button>
        </div>
      )}

      <video ref={localRef} autoPlay muted playsInline style={{ width: "45%" }} />
      <video ref={remoteRef} autoPlay playsInline style={{ width: "45%" }} />

      {inCall && <button onClick={endCall}>End Call</button>}
    </div>
  );
}
