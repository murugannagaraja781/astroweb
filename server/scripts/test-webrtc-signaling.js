const io = require("socket.io-client");

const SOCKET_URL = "http://localhost:9001"; // Adjust if your server runs on a different port locally

const client1 = io(SOCKET_URL);
const client2 = io(SOCKET_URL);

const user1Id = "user1_test_id";
const user2Id = "user2_test_id";

console.log("🚀 Starting WebRTC Signaling Test...");

// Simulate User 1 (Caller)
client1.on("connect", () => {
    console.log("✅ User 1 Connected:", client1.id);
    client1.emit("join-room", user1Id);

    // Step 1: User 1 calls User 2
    setTimeout(() => {
        console.log("📞 User 1 calling User 2...");
        client1.emit("callUser", {
            userToCall: user2Id,
            signalData: { type: "offer", sdp: "mock-sdp-offer" },
            from: user1Id,
            name: "User 1"
        });
    }, 1000);
});

client1.on("callAccepted", (signal) => {
    console.log("✅ Call Accepted by User 2!");
    console.log("   Signal received:", signal);

    if (signal.type === "answer") {
        console.log("🎉 Signaling Flow Complete: Offer -> Answer exchange successful.");
        process.exit(0);
    } else {
        console.error("❌ Unexpected signal type:", signal.type);
        process.exit(1);
    }
});

// Simulate User 2 (Receiver)
client2.on("connect", () => {
    console.log("✅ User 2 Connected:", client2.id);
    client2.emit("join-room", user2Id);
});

client2.on("callUser", (data) => {
    console.log("🔔 User 2 received call from:", data.name);
    console.log("   Signal received:", data.signal);

    if (data.from === user1Id && data.signal.type === "offer") {
        console.log("📞 User 2 answering call...");
        // Step 2: User 2 answers
        client2.emit("answerCall", {
            signal: { type: "answer", sdp: "mock-sdp-answer" },
            to: user1Id
        });
    }
});

// Timeout if test takes too long
setTimeout(() => {
    console.error("❌ Test Timed Out");
    process.exit(1);
}, 5000);
