const { createServer } = require("http");
const { Server } = require("socket.io");
const Client = require("socket.io-client");
const mongoose = require("mongoose");
const presenceHandler = require("../socket/handlers/presence");
const signalingHandler = require("../socket/handlers/signaling");

describe("Socket Signaling Integration Test", () => {
    let io, serverServerSocket, clientSocketAstro, clientSocketUser;
    let httpServer;
    let port;

    // Helper to wait for event
    const waitForCallback = (socket, event) => {
        return new Promise((resolve) => {
            socket.once(event, resolve);
        });
    };

    beforeAll((done) => {
        // Setup HTTP & Socket.IO Server
        httpServer = createServer();
        io = new Server(httpServer);

        // Attach handlers
        io.on("connection", (socket) => {
            serverServerSocket = socket;
            presenceHandler(io, socket);
            signalingHandler(io, socket);
        });

        // Listen on random port
        httpServer.listen(() => {
            port = httpServer.address().port;
            done();
        });
    });

    afterAll((done) => {
        io.close();
        if (clientSocketAstro) clientSocketAstro.close();
        if (clientSocketUser) clientSocketUser.close();
        httpServer.close(done);
    });

    test("should route call request using userId even after socket reconnection", (done) => {
        // 1. Connect Astrologer
        clientSocketAstro = new Client(`http://localhost:${port}`);
        const astroUserId = "astro_user_123";

        clientSocketAstro.on("connect", () => {
            // Register Astrologer
            clientSocketAstro.emit("user_online", { userId: astroUserId });

            // Wait a bit for registration to process
            setTimeout(() => {
                // 2. Connect Client
                clientSocketUser = new Client(`http://localhost:${port}`);
                const clientUserId = "client_user_456";

                clientSocketUser.on("connect", () => {
                    // 3. Client sends call request targeting Astrologer ID
                    console.log("TEST: Sending first call request...");
                    clientSocketUser.emit("call:request", {
                        fromId: clientUserId,
                        toId: astroUserId, // Targeting User ID
                        callId: "call_1"
                    });
                });

                // Astrologer should receive it
                const handleFirstCall = (data) => {
                    if (data.callId !== "call_1") return;
                    console.log("TEST: Astrologer received first call.");

                    // 4. Astrologer reconnects (SIMULATE REFRESH)
                    clientSocketAstro.close(); // Identify old socket is gone

                    // Create NEW socket connection for same astrologer
                    clientSocketAstro = new Client(`http://localhost:${port}`);

                    clientSocketAstro.on("connect", () => {
                        console.log("TEST: Astrologer reconnected (new socket ID).");
                        // Register SAME User ID
                        clientSocketAstro.emit("user_online", { userId: astroUserId });

                        setTimeout(() => {
                            // 5. Client sends SECOND call request to SAME User ID
                            console.log("TEST: Sending second call request...");
                            clientSocketUser.emit("call:request", {
                                fromId: clientUserId,
                                toId: astroUserId, // Targeting same User ID
                                callId: "call_2"
                            });
                        }, 500);

                        // New socket should receive the call
                        clientSocketAstro.on("call:request", (data2) => {
                            if (data2.callId === "call_2") {
                                console.log("TEST: Astrologer received second call on NEW socket!");
                                done(); // SUCCESS!
                            }
                        });
                    });
                };

                // Listen for first call
                clientSocketAstro.on("call:request", handleFirstCall);
            }, 500);
        });
    }, 10000); // 10s timeout
});
