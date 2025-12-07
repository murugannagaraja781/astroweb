import { useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";

const socket = io(
    "https://astroweb-production.up.railway.app",
    { autoConnect: false, transports: ['websocket'] }
);

export const useChatSocket = (sessionId, user) => {
    const [conversation, setConversation] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [sessionInfo, setSessionInfo] = useState(null);
    const [sessionDuration, setSessionDuration] = useState(0);
    const [error, setError] = useState(null);
    const [isConnected, setIsConnected] = useState(socket.connected);

    // Expose socket for direct access if needed, though we try to wrap it
    // const socketRef = useRef(socket);

    useEffect(() => {
        if (!user?.id || !sessionId) return;

        // Attach identity
        socket.io.opts.query = { username: user.name, userId: user.id };

        if (!socket.connected) {
            socket.connect();
        }

        console.log("[useChatSocket] Joining session:", sessionId);
        socket.emit("user_online", { userId: user.id });
        socket.emit("join_chat", { sessionId, userId: user.id });

        // Listeners
        const onConnect = () => setIsConnected(true);
        const onConnectError = (err) => {
            console.error("[socket] connect_error", err);
            setError(`Connection error: ${err.message}`);
            setIsConnected(false);
        };
        const onDisconnect = (reason) => {
            console.warn("[socket] disconnect:", reason);
            setIsConnected(false);
            if (reason === "io server disconnect") {
                setError("Disconnected by server.");
            }
        };
        const onReconnect = () => {
            console.log("[socket] reconnect");
            setError(null);
            setIsConnected(true);
            socket.emit("join_chat", { sessionId, userId: user.id });
        };

        const onChatMessage = (newMessage) => {
            setConversation((prev) => {
                // 1. Temp ID match
                if (newMessage.tempId) {
                    const exists = prev.some((msg) => msg.tempId === newMessage.tempId);
                    if (exists) {
                        return prev.map((msg) =>
                            msg.tempId === newMessage.tempId
                                ? { ...msg, ...newMessage, pending: false }
                                : msg
                        );
                    }
                }
                // 2. Real ID match
                if (newMessage._id) {
                    const exists = prev.some((msg) => msg._id === newMessage._id);
                    if (exists) return prev;
                }
                // 3. New message
                return [...prev, newMessage];
            });
        };

        const onChatTyping = (data) => {
            if (data.userId && data.userId !== user.id) {
                setIsTyping(true);
                setTimeout(() => setIsTyping(false), 1500);
            }
        };

        const onChatSessionInfo = (info) => {
            console.log("[Chat] Info update:", info);
            setSessionInfo(info);
        };

        const onWalletUpdate = (data) => {
            if (data.elapsed) setSessionDuration(data.elapsed);
        };

        // Events
        socket.on("connect", onConnect);
        socket.on("connect_error", onConnectError);
        socket.on("disconnect", onDisconnect);
        socket.on("reconnect", onReconnect);
        socket.on("chat:message", onChatMessage);
        socket.on("chat:typing", onChatTyping);
        socket.on("chat:session_info", onChatSessionInfo);
        socket.on("chat:accepted", () => socket.emit("join_chat", { sessionId, userId: user.id }));
        socket.on("chat:started", (data) => console.log("Chat started", data)); // Refresh info usually handled by component fetching
        socket.on("wallet:update", onWalletUpdate);

        return () => {
            socket.off("connect", onConnect);
            socket.off("connect_error", onConnectError);
            socket.off("disconnect", onDisconnect);
            socket.off("reconnect", onReconnect);
            socket.off("chat:message", onChatMessage);
            socket.off("chat:typing", onChatTyping);
            socket.off("chat:session_info", onChatSessionInfo);
            socket.off("chat:accepted");
            socket.off("chat:started");
            socket.off("wallet:update", onWalletUpdate);
        };
    }, [sessionId, user?.id, user?.name]);

    const sendMessage = useCallback((text, type = 'text', mediaUrl = null) => {
        if (!socket.connected) {
            setError("Not connected");
            return;
        }
        const tempId = "tmp_" + Date.now() + "_" + Math.random().toString(36).slice(2);
        const newMsg = {
            tempId,
            senderId: user.id,
            text,
            type,
            mediaUrl,
            timestamp: new Date().toISOString(),
            pending: true
        };

        // Optimistic
        setConversation(prev => [...prev, newMsg]);

        socket.emit("chat:message", {
            sessionId,
            senderId: user.id,
            text,
            type,
            mediaUrl,
            tempId
        });
    }, [sessionId, user]);
    // Note: user?.id is sufficient, full user object not needed for dependency

    const sendTyping = useCallback(() => {
        if (socket.connected) socket.emit("chat:typing", { sessionId, userId: user.id });
    }, [sessionId, user]);
    // Note: user?.id is sufficient

    const endSession = useCallback(() => {
        if (socket.connected) socket.emit("chat:end", { sessionId });
    }, [sessionId]);

    return {
        conversation,
        setConversation, // Allow manual setting (e.g. from initial fetch)
        isTyping,
        sessionInfo,
        setSessionInfo,
        sessionDuration,
        error,
        setError,
        sendMessage,
        sendTyping,
        endSession,
        isConnected,
        socket // expose raw socket for advanced needs
    };
};
