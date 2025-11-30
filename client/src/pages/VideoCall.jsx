 // ClientVideoCall.jsx
 import React, { useEffect, useRef, useState } from "react";
 import { io } from "socket.io-client";

 const SIGNALING_SERVER = import.meta.env.VITE_SIGNALING_SERVER || "http://localhost:3000";

 const ICE_SERVERS = {
   iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
 };

 export default function ClientVideoCall({ roomId }) {
   const localRef = useRef(null);
   const remoteRef = useRef(null);
   const socketRef = useRef(null);
   const pcRef = useRef(null);
   const localStreamRef = useRef(null);

   const [joined, setJoined] = useState(false);
   const [inCall, setInCall] = useState(false);

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

     socketRef.current.on("call:offer", handleOffer);
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

   // CLIENT NEVER SENDS OFFER FIRST — ONLY RECEIVES OFFER FROM ASTROLOGER
   const handleOffer = async ({ from, offer }) => {
     await setupLocalStream();
     const pc = await createPeer(from);

     await pc.setRemoteDescription(offer);
     const answer = await pc.createAnswer();
     await pc.setLocalDescription(answer);

     socketRef.current.emit("call:answer", { roomId, answer, to: from });
     setInCall(true);
   };

   const handleAnswer = async () => {};

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
       <h3>Client Video Call</h3>

       <video autoPlay playsInline muted ref={localRef} style={{ width: "45%" }} />
       <video autoPlay playsInline ref={remoteRef} style={{ width: "45%" }} />

       <div>
         {inCall ? (
           <button onClick={endCall}>End Call</button>
         ) : (
           <p>Wait for astrologer to start the video call…</p>
         )}
       </div>
     </div>
   );
 }
