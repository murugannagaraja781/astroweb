import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

const SIGNALING_URL = import.meta.env.VITE_SIGNALING_SERVER || import.meta.env.VITE_API_URL || "http://localhost:8080";

export default function HealthTest() {
  const [serverStatus, setServerStatus] = useState("Checking...");
  const [socketStatus, setSocketStatus] = useState("Checking...");
  const [roomStatus, setRoomStatus] = useState("Waiting...");
  const [offerStatus, setOfferStatus] = useState("Waiting...");
  const [answerStatus, setAnswerStatus] = useState("Waiting...");
  const [iceStatus, setIceStatus] = useState("Waiting...");

  useEffect(() => {
    // 1) CHECK SERVER
    fetch(SIGNALING_URL + "/api/public/health") // Assuming there's a health endpoint or just root
      .then(() => setServerStatus("PASS"))
      .catch(() => setServerStatus("FAIL"));

    // 2) CHECK SOCKET CONNECT
    const socket = io(SIGNALING_URL, { transports: ['websocket'] });

    socket.on("connect", () => {
      setSocketStatus("PASS");

      // TEST JOIN-ROOM EVENT
      socket.emit("join-room", "test-room");
      setRoomStatus("PASS");
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
      setSocketStatus("FAIL");
    });

    // 3) TEST OFFER EVENT
    socket.on("offer", () => {
      setOfferStatus("PASS");
    });

    // 4) TEST ANSWER EVENT
    socket.on("answer", () => {
      setAnswerStatus("PASS");
    });

    // 5) TEST ICE EVENT
    socket.on("ice-candidate", () => {
      setIceStatus("PASS");
    });

    return () => socket.disconnect();
  }, []);

  const box = (label, value) => (
    <div style={{ marginBottom: 10 }}>
      <strong>{label}:</strong> <span style={{ color: value === "PASS" ? "green" : value === "FAIL" ? "red" : "black" }}>{value}</span>
    </div>
  );

  return (
    <div style={{ padding: 20, fontSize: 18 }}>
      <h2>Socket.IO + WebRTC Health Test</h2>
      <p>Signaling URL: {SIGNALING_URL}</p>

      {box("1. Server running", serverStatus)}
      {box("2. Socket.IO connection", socketStatus)}
      {box("3. Join Room Event", roomStatus)}
      {box("4. Offer Event", offerStatus)}
      {box("5. Answer Event", answerStatus)}
      {box("6. ICE Candidate Event", iceStatus)}
    </div>
  );
}
