export const config = {
    SIGNALING_SERVER: import.meta.env.VITE_SIGNALING_SERVER || "https://astroweb-production.up.railway.app",
    ICE_SERVERS: {
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            ...(import.meta.env.VITE_TURN_URL ? [{
                urls: import.meta.env.VITE_TURN_URL,
                username: import.meta.env.VITE_TURN_USERNAME,
                credential: import.meta.env.VITE_TURN_CREDENTIAL,
            }] : []),
        ],
    }
};
