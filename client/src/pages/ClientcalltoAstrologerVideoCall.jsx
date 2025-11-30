 // ClientcalltoAstrologerVideoCall.jsx
import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SIGNALING_SERVER = import.meta.env.VITE_SIGNALING_SERVER || "https://astroweb-production.up.railway.app";

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
  const [callStatus, setCallStatus] = useState("waiting");
  const [connectionError, setConnectionError] = useState(null);

  useEffect(() => {
    connectSocket();
    return () => endCall();
  }, []);

  const connectSocket = () => {
    socketRef.current = io(SIGNALING_SERVER);

    socketRef.current.on("connect", () => {
      socketRef.current.emit("join", roomId);
      setCallStatus("ready");
    });

    socketRef.current.on("peer:joined", ({ socketId }) => {
      setClientSocket(socketId);
      setCallStatus("client_joined");
    });

    socketRef.current.on("video:call_accepted", () => {
      setCallStatus("connecting");
      startPeerOffer();
    });

    socketRef.current.on("video:call_rejected", () => {
      setCallStatus("rejected");
      setWaitingForAnswer(false);
      setTimeout(() => setCallStatus("ready"), 3000);
    });

    socketRef.current.on("call:answer", handleAnswer);
    socketRef.current.on("call:candidate", handleCandidate);
    socketRef.current.on("disconnect", () => {
      setCallStatus("disconnected");
    });
  };

  const setupLocalStream = async () => {
    if (localStreamRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      localStreamRef.current = stream;
      localRef.current.srcObject = stream;
    } catch (error) {
      console.error("Error accessing media devices:", error);
      setConnectionError("Could not access camera/microphone");
      setCallStatus("error");
    }
  };

  const startCallRequest = () => {
    if (!clientSocket) {
      setConnectionError("Client is not in the room yet");
      return;
    }

    socketRef.current.emit("video:call_request", {
      roomId,
      to: clientSocket,
    });

    setWaitingForAnswer(true);
    setCallStatus("calling");
  };

  const startPeerOffer = async () => {
    await setupLocalStream();

    pcRef.current = new RTCPeerConnection(ICE_SERVERS);

    localStreamRef.current.getTracks().forEach((track) =>
      pcRef.current.addTrack(track, localStreamRef.current)
    );

    pcRef.current.ontrack = (e) => {
      remoteRef.current.srcObject = e.streams[0];
      setCallStatus("connected");
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

    pcRef.current.onconnectionstatechange = () => {
      if (pcRef.current.connectionState === "connected") {
        setCallStatus("connected");
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
    if (pcRef.current) {
      pcRef.current.close();
      socketRef.current.emit("call:end", { roomId, to: clientSocket });
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    setInCall(false);
    setCallStatus("ended");
    setTimeout(() => setCallStatus("ready"), 2000);
  };

  const getStatusMessage = () => {
    const messages = {
      waiting: "🔄 Connecting to room...",
      ready: "✅ Ready for consultation",
      client_joined: "👤 Client joined the room",
      calling: "📞 Calling client...",
      connecting: "🔗 Establishing connection...",
      connected: "✅ Cosmic Connection Established",
      ended: "❌ Consultation Ended",
      rejected: "❌ Client declined the call",
      disconnected: "⚠️ Connection Lost",
      error: "⚠️ System Error"
    };
    return messages[callStatus] || "Ready";
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>🌙</div>
          <div>
            <h3 style={styles.title}>Astrologer Portal</h3>
            <p style={styles.subtitle}>Room: {roomId}</p>
          </div>
        </div>
        <div style={styles.statusIndicator}>
          <div style={{
            ...styles.statusDot,
            backgroundColor:
              callStatus === "connected" ? "#10B981" :
              callStatus === "calling" ? "#F59E0B" :
              callStatus === "ready" ? "#10B981" : "#EF4444"
          }} />
          <span style={styles.statusText}>{getStatusMessage()}</span>
        </div>
      </div>

      {/* Connection Error Alert */}
      {connectionError && (
        <div style={styles.alert}>
          <span style={styles.alertIcon}>⚠️</span>
          {connectionError}
          <button
            style={styles.alertClose}
            onClick={() => setConnectionError(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* Video Container */}
      <div style={styles.videoContainer}>
        {/* Local Video - Astrologer */}
        <div style={styles.videoWrapper}>
          <div style={styles.videoLabel}>
            <span style={styles.videoLabelText}>Your Camera</span>
            <div style={styles.liveIndicator} />
          </div>
          <video
            ref={localRef}
            autoPlay
            muted
            playsInline
            style={styles.video}
          />
          {!inCall && (
            <div style={styles.placeholder}>
              <div style={styles.placeholderIcon}>🔮</div>
              <p style={styles.placeholderText}>Your camera preview</p>
            </div>
          )}
        </div>

        {/* Remote Video - Client */}
        <div style={styles.videoWrapper}>
          <div style={styles.videoLabel}>
            <span style={styles.videoLabelText}>Client</span>
            {inCall && <div style={styles.liveIndicator} />}
          </div>
          <video
            ref={remoteRef}
            autoPlay
            playsInline
            style={styles.video}
          />
          {!inCall && (
            <div style={styles.placeholder}>
              <div style={styles.placeholderIcon}>✨</div>
              <p style={styles.placeholderText}>
                {clientSocket ? "Client is waiting" : "Waiting for client..."}
              </p>
              {clientSocket && (
                <button
                  style={styles.startCallButton}
                  onClick={startCallRequest}
                >
                  Start Consultation
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Call Controls */}
      <div style={styles.controls}>
        {!inCall && !waitingForAnswer && clientSocket && (
          <button
            style={styles.startCallBtn}
            onClick={startCallRequest}
            disabled={!clientSocket}
          >
            <span style={styles.buttonIcon}>📞</span>
            Start Cosmic Consultation
          </button>
        )}

        {waitingForAnswer && (
          <div style={styles.waitingContainer}>
            <div style={styles.ringAnimation}>
              <div style={styles.ring} />
              <div style={styles.ring} />
              <div style={styles.ring} />
            </div>
            <p style={styles.waitingText}>Calling client...</p>
            <button
              style={styles.cancelCallBtn}
              onClick={() => {
                setWaitingForAnswer(false);
                setCallStatus("ready");
              }}
            >
              Cancel Call
            </button>
          </div>
        )}

        {inCall && (
          <button style={styles.endCallButton} onClick={endCall}>
            <span style={styles.endCallIcon}>📞</span>
            End Consultation
          </button>
        )}
      </div>

      {/* Client Info Panel */}
      {clientSocket && (
        <div style={styles.clientPanel}>
          <div style={styles.clientInfo}>
            <div style={styles.clientAvatar}>👤</div>
            <div>
              <h4 style={styles.clientName}>Client Connected</h4>
              <p style={styles.clientStatus}>Ready for consultation</p>
            </div>
          </div>
          <div style={styles.roomInfo}>
            <span style={styles.roomBadge}>Room: {roomId}</span>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={styles.footer}>
        <p style={styles.footerText}>
          ✨ Share your cosmic wisdom with those who seek guidance
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    backgroundColor: "#0f0f23",
    background: "linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)",
    color: "#e2e8f0",
    minHeight: "100vh",
    padding: "20px",
    position: "relative",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
    padding: "25px",
    background: "rgba(255, 255, 255, 0.05)",
    borderRadius: "20px",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
  },
  logoIcon: {
    fontSize: "3rem",
    filter: "drop-shadow(0 0 15px rgba(255, 255, 0, 0.5))",
  },
  title: {
    margin: 0,
    background: "linear-gradient(45deg, #f59e0b, #fbbf24)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    fontSize: "2rem",
    fontWeight: "bold",
  },
  subtitle: {
    margin: "5px 0 0 0",
    color: "#94a3b8",
    fontSize: "0.9rem",
  },
  statusIndicator: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px 24px",
    background: "rgba(255, 255, 255, 0.1)",
    borderRadius: "25px",
  },
  statusDot: {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    animation: "pulse 2s infinite",
  },
  statusText: {
    fontSize: "1rem",
    fontWeight: "500",
  },
  alert: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "linear-gradient(45deg, #dc2626, #b91c1c)",
    padding: "15px 20px",
    borderRadius: "12px",
    marginBottom: "20px",
    border: "1px solid rgba(255, 255, 255, 0.2)",
  },
  alertIcon: {
    fontSize: "1.2rem",
  },
  alertClose: {
    background: "none",
    border: "none",
    color: "white",
    fontSize: "1.5rem",
    cursor: "pointer",
    marginLeft: "auto",
  },
  videoContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
    gap: "25px",
    marginBottom: "30px",
  },
  videoWrapper: {
    position: "relative",
    background: "rgba(255, 255, 255, 0.05)",
    borderRadius: "20px",
    padding: "15px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    minHeight: "350px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  video: {
    width: "100%",
    height: "100%",
    maxHeight: "400px",
    borderRadius: "15px",
    objectFit: "cover",
    background: "#000",
  },
  videoLabel: {
    position: "absolute",
    top: "20px",
    left: "20px",
    background: "rgba(0, 0, 0, 0.7)",
    padding: "8px 16px",
    borderRadius: "15px",
    zIndex: 10,
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  videoLabelText: {
    fontSize: "0.9rem",
    fontWeight: "500",
    color: "#fff",
  },
  liveIndicator: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    backgroundColor: "#10B981",
    animation: "pulse 1.5s infinite",
  },
  placeholder: {
    textAlign: "center",
    padding: "40px",
  },
  placeholderIcon: {
    fontSize: "4rem",
    marginBottom: "20px",
    opacity: 0.7,
  },
  placeholderText: {
    margin: "0 0 20px 0",
    color: "#94a3b8",
    fontSize: "1rem",
  },
  startCallButton: {
    background: "linear-gradient(45deg, #f59e0b, #d97706)",
    border: "none",
    padding: "12px 24px",
    borderRadius: "25px",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "0.9rem",
    transition: "all 0.3s ease",
  },
  controls: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "30px",
  },
  startCallBtn: {
    background: "linear-gradient(45deg, #f59e0b, #d97706)",
    border: "none",
    padding: "18px 35px",
    borderRadius: "50px",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontSize: "1.2rem",
    boxShadow: "0 5px 20px rgba(245, 158, 11, 0.4)",
    transition: "all 0.3s ease",
  },
  waitingContainer: {
    textAlign: "center",
    padding: "30px",
    background: "rgba(255, 255, 255, 0.05)",
    borderRadius: "20px",
    border: "1px solid rgba(245, 158, 11, 0.3)",
  },
  ringAnimation: {
    position: "relative",
    width: "80px",
    height: "80px",
    margin: "0 auto 20px",
  },
  ring: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "60px",
    height: "60px",
    border: "3px solid #f59e0b",
    borderRadius: "50%",
    animation: "ripple 1.5s infinite",
    ":nth-child(2)": {
      animationDelay: "0.5s",
    },
    ":nth-child(3)": {
      animationDelay: "1s",
    },
  },
  waitingText: {
    margin: "0 0 20px 0",
    fontSize: "1.1rem",
    color: "#f59e0b",
    fontWeight: "500",
  },
  cancelCallBtn: {
    background: "rgba(239, 68, 68, 0.2)",
    border: "1px solid #ef4444",
    padding: "10px 20px",
    borderRadius: "25px",
    color: "#ef4444",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  endCallButton: {
    background: "linear-gradient(45deg, #ef4444, #dc2626)",
    border: "none",
    padding: "18px 35px",
    borderRadius: "50px",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontSize: "1.2rem",
    boxShadow: "0 5px 20px rgba(239, 68, 68, 0.4)",
    transition: "all 0.3s ease",
  },
  buttonIcon: {
    fontSize: "1.3rem",
  },
  endCallIcon: {
    fontSize: "1.3rem",
  },
  clientPanel: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "rgba(255, 255, 255, 0.05)",
    padding: "20px 25px",
    borderRadius: "15px",
    marginBottom: "20px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
  },
  clientInfo: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
  },
  clientAvatar: {
    fontSize: "2.5rem",
    background: "rgba(245, 158, 11, 0.2)",
    padding: "10px",
    borderRadius: "50%",
  },
  clientName: {
    margin: 0,
    fontSize: "1.2rem",
    fontWeight: "bold",
    color: "#f59e0b",
  },
  clientStatus: {
    margin: "5px 0 0 0",
    color: "#94a3b8",
    fontSize: "0.9rem",
  },
  roomInfo: {
    textAlign: "right",
  },
  roomBadge: {
    background: "rgba(255, 255, 255, 0.1)",
    padding: "8px 16px",
    borderRadius: "20px",
    fontSize: "0.9rem",
    color: "#c7d2fe",
  },
  footer: {
    textAlign: "center",
    padding: "25px",
    background: "rgba(255, 255, 255, 0.05)",
    borderRadius: "15px",
  },
  footerText: {
    margin: 0,
    color: "#94a3b8",
    fontSize: "1rem",
    fontStyle: "italic",
  },
};

// Add CSS animations
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
`, styleSheet.cssRules.length);

styleSheet.insertRule(`
  @keyframes ripple {
    0% { width: 0; height: 0; opacity: 1; }
    100% { width: 100px; height: 100px; opacity: 0; }
  }
`, styleSheet.cssRules.length);

styleSheet.insertRule(`
  button:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(245, 158, 11, 0.5);
  }
`, styleSheet.cssRules.length);

styleSheet.insertRule(`
  .cancelCallBtn:hover {
    box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4);
  }
`, styleSheet.cssRules.length);

styleSheet.insertRule(`
  .endCallButton:hover {
    box-shadow: 0 8px 25px rgba(239, 68, 68, 0.6);
  }
`, styleSheet.cssRules.length);