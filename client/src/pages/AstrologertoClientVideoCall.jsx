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
  const [callStatus, setCallStatus] = useState("disconnected");

  useEffect(() => {
    connectSocket();
    return () => endCall();
  }, []);

  const connectSocket = () => {
    socketRef.current = io(SIGNALING_SERVER);

    socketRef.current.on("connect", () => {
      socketRef.current.emit("join", roomId);
      setCallStatus("waiting");
    });

    socketRef.current.on("video:incoming_call", ({ from }) => {
      setCaller(from);
      setIncomingCall(true);
      setCallStatus("incoming");
    });

    socketRef.current.on("call:offer", handleOffer);
    socketRef.current.on("call:candidate", handleCandidate);

    socketRef.current.on("call:end", () => {
      setCallStatus("ended");
      setTimeout(() => endCall(), 2000);
    });
  };

  const acceptCall = () => {
    socketRef.current.emit("video:call_accept", {
      roomId,
      to: caller,
    });
    setIncomingCall(false);
    setCallStatus("connecting");
  };

  const rejectCall = () => {
    socketRef.current.emit("video:call_reject", {
      roomId,
      to: caller,
    });
    setIncomingCall(false);
    setCallStatus("rejected");
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
      setCallStatus("error");
    }
  };

  const handleOffer = async ({ from, offer }) => {
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
          to: from,
        });
      }
    };

    pcRef.current.onconnectionstatechange = () => {
      if (pcRef.current.connectionState === "connected") {
        setCallStatus("connected");
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
    if (pcRef.current) {
      pcRef.current.close();
      socketRef.current.emit("call:end", { roomId, to: caller });
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    setInCall(false);
    setCallStatus("ended");
  };

  const getStatusMessage = () => {
    const messages = {
      waiting: "🔄 Waiting for astrologer...",
      incoming: "📞 Incoming Call",
      connecting: "🔗 Connecting...",
      connected: "✅ Call Connected",
      ended: "❌ Call Ended",
      rejected: "❌ Call Rejected",
      error: "⚠️ Connection Error"
    };
    return messages[callStatus] || "Ready";
  };

  return (
    <div style={styles.container}>
      <AnimationStyles />
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>☯</div>
          <h3 style={styles.title}>Cosmic Connection</h3>
        </div>
        <div style={styles.statusIndicator}>
          <div style={{
            ...styles.statusDot,
            backgroundColor: callStatus === "connected" ? "#10B981" :
                           callStatus === "connecting" ? "#F59E0B" : "#EF4444"
          }} />
          <span style={styles.statusText}>{getStatusMessage()}</span>
        </div>
      </div>

      {/* Video Container */}
      <div style={styles.videoContainer}>
        {/* Local Video */}
        <div style={styles.videoWrapper}>
          <div style={styles.videoLabel}>
            <span style={styles.videoLabelText}>You</span>
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
              <p style={styles.placeholderText}>Waiting for connection</p>
            </div>
          )}
        </div>

        {/* Remote Video */}
        <div style={styles.videoWrapper}>
          <div style={styles.videoLabel}>
            <span style={styles.videoLabelText}>Astrologer</span>
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
              <p style={styles.placeholderText}>Astrologer will appear here</p>
            </div>
          )}
        </div>
      </div>

      {/* Incoming Call Modal */}
      {incomingCall && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <div style={styles.modalIcon}>📞</div>
              <h3 style={styles.modalTitle}>Incoming Cosmic Call</h3>
            </div>
            <p style={styles.modalText}>
              Astrologer is calling to connect with your destiny...
            </p>
            <div style={styles.modalButtons}>
              <button style={styles.acceptButton} onClick={acceptCall}>
                <span style={styles.buttonIcon}>✅</span>
                Accept Call
              </button>
              <button style={styles.rejectButton} onClick={rejectCall}>
                <span style={styles.buttonIcon}>❌</span>
                Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Call Controls */}
      {inCall && (
        <div style={styles.controls}>
          <button style={styles.endCallButton} onClick={endCall}>
            <span style={styles.endCallIcon}>📞</span>
            End Cosmic Call
          </button>
        </div>
      )}

      {/* Footer */}
      <div style={styles.footer}>
        <p style={styles.footerText}>
          🔮 Your cosmic journey awaits - Connect with the stars
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
    padding: "20px",
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
    fontSize: "2.5rem",
    filter: "drop-shadow(0 0 10px rgba(168, 85, 247, 0.5))",
  },
  title: {
    margin: 0,
    background: "linear-gradient(45deg, #a855f7, #ec4899)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    fontSize: "1.8rem",
    fontWeight: "bold",
  },
  statusIndicator: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 20px",
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
    fontSize: "0.9rem",
    fontWeight: "500",
  },
  videoContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "20px",
    marginBottom: "30px",
  },
  videoWrapper: {
    position: "relative",
    background: "rgba(255, 255, 255, 0.05)",
    borderRadius: "20px",
    padding: "10px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    minHeight: "300px",
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
    top: "15px",
    left: "15px",
    background: "rgba(0, 0, 0, 0.7)",
    padding: "5px 15px",
    borderRadius: "15px",
    zIndex: 10,
  },
  videoLabelText: {
    fontSize: "0.8rem",
    fontWeight: "500",
    color: "#fff",
  },
  placeholder: {
    textAlign: "center",
    padding: "40px",
  },
  placeholderIcon: {
    fontSize: "3rem",
    marginBottom: "15px",
    opacity: 0.7,
  },
  placeholderText: {
    margin: 0,
    color: "#94a3b8",
    fontSize: "0.9rem",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    background: "linear-gradient(135deg, #1e1b4b 0%, #3730a3 100%)",
    padding: "40px",
    borderRadius: "25px",
    textAlign: "center",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5)",
    maxWidth: "400px",
    width: "90%",
  },
  modalHeader: {
    marginBottom: "20px",
  },
  modalIcon: {
    fontSize: "4rem",
    marginBottom: "15px",
    animation: "ring 1.5s infinite",
  },
  modalTitle: {
    margin: "0 0 10px 0",
    fontSize: "1.5rem",
    fontWeight: "bold",
    color: "#fff",
  },
  modalText: {
    margin: "0 0 30px 0",
    color: "#c7d2fe",
    lineHeight: "1.5",
  },
  modalButtons: {
    display: "flex",
    gap: "15px",
    justifyContent: "center",
  },
  acceptButton: {
    background: "linear-gradient(45deg, #10b981, #059669)",
    border: "none",
    padding: "12px 25px",
    borderRadius: "50px",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.3s ease",
    fontSize: "1rem",
  },
  rejectButton: {
    background: "linear-gradient(45deg, #ef4444, #dc2626)",
    border: "none",
    padding: "12px 25px",
    borderRadius: "50px",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.3s ease",
    fontSize: "1rem",
  },
  controls: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "20px",
  },
  endCallButton: {
    background: "linear-gradient(45deg, #ef4444, #dc2626)",
    border: "none",
    padding: "15px 30px",
    borderRadius: "50px",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "1.1rem",
    boxShadow: "0 5px 15px rgba(239, 68, 68, 0.4)",
    transition: "all 0.3s ease",
  },
  endCallIcon: {
    fontSize: "1.2rem",
  },
  buttonIcon: {
    fontSize: "1.1rem",
  },
  footer: {
    textAlign: "center",
    padding: "20px",
    background: "rgba(255, 255, 255, 0.05)",
    borderRadius: "15px",
    marginTop: "20px",
  },
  footerText: {
    margin: 0,
    color: "#94a3b8",
    fontSize: "0.9rem",
    fontStyle: "italic",
  },
};

// CSS Animations as inline style tag
const AnimationStyles = () => (
  <style>{`
    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }

    @keyframes ring {
      0% { transform: rotate(0deg); }
      25% { transform: rotate(10deg); }
      50% { transform: rotate(-10deg); }
      75% { transform: rotate(5deg); }
      100% { transform: rotate(0deg); }
    }

    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(168, 85, 247, 0.4);
    }
  `}</style>
);