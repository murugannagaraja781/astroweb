import { io } from 'socket.io-client';

class SocketManager {
    constructor() {
        this.socket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.messageQueue = [];
        this.listeners = new Map();
    }

    connect(url, options = {}) {
        if (this.socket?.connected) {
            console.log('[SocketManager] Already connected');
            return this.socket;
        }

        const defaultOptions = {
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: this.maxReconnectAttempts,
            timeout: 20000,
            autoConnect: true,
            transports: ['websocket', 'polling'],
        };

        this.socket = io(url, { ...defaultOptions, ...options });

        this.setupEventHandlers();
        return this.socket;
    }

    setupEventHandlers() {
        this.socket.on('connect', () => {
            console.log('[SocketManager] Connected');
            this.reconnectAttempts = 0;
            this.flushMessageQueue();
            this.emit('connection_status', { status: 'connected' });
        });

        this.socket.on('disconnect', (reason) => {
            console.log('[SocketManager] Disconnected:', reason);
            this.emit('connection_status', { status: 'disconnected', reason });
        });

        this.socket.on('reconnect_attempt', (attemptNumber) => {
            console.log(`[SocketManager] Reconnect attempt ${attemptNumber}`);
            this.reconnectAttempts = attemptNumber;
            this.emit('connection_status', {
                status: 'reconnecting',
                attempt: attemptNumber
            });
        });

        this.socket.on('reconnect', (attemptNumber) => {
            console.log(`[SocketManager] Reconnected after ${attemptNumber} attempts`);
            this.emit('connection_status', { status: 'reconnected' });
        });

        this.socket.on('reconnect_failed', () => {
            console.error('[SocketManager] Reconnection failed');
            this.emit('connection_status', { status: 'failed' });
        });

        this.socket.on('connect_error', (error) => {
            console.error('[SocketManager] Connection error:', error);
            this.emit('connection_status', { status: 'error', error });
        });
    }

    emit(event, data) {
        if (this.socket?.connected) {
            this.socket.emit(event, data);
        } else {
            // Queue message for later
            this.messageQueue.push({ event, data });
            console.log(`[SocketManager] Queued message: ${event}`);
        }
    }

    on(event, callback) {
        if (!this.socket) {
            console.warn('[SocketManager] Socket not initialized');
            return;
        }
        this.socket.on(event, callback);

        // Track listeners for cleanup
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    off(event, callback) {
        if (!this.socket) return;
        this.socket.off(event, callback);

        // Remove from tracked listeners
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    flushMessageQueue() {
        console.log(`[SocketManager] Flushing ${this.messageQueue.length} queued messages`);
        while (this.messageQueue.length > 0) {
            const { event, data } = this.messageQueue.shift();
            this.socket.emit(event, data);
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.messageQueue = [];
            this.listeners.clear();
        }
    }

    isConnected() {
        return this.socket?.connected || false;
    }

    getStatus() {
        if (!this.socket) return 'not_initialized';
        if (this.socket.connected) return 'connected';
        if (this.reconnectAttempts > 0) return 'reconnecting';
        return 'disconnected';
    }
}

// Export singleton instance
export default new SocketManager();
