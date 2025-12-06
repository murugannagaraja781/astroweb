import React, { useState, useEffect } from 'react';
import { useWebRTC } from '../hooks/useWebRTC';
import { Mic, MicOff, Video, VideoOff, Phone, Maximize2, Minimize2, RefreshCw, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const VideoCall = ({
    roomId,
    socket,
    user,
    isInitiator,
    onEnd,
    peerName,
    peerSocketId // New prop for direct signaling
}) => {
    const {
        localStream,
        remoteStream,
        connectionStatus,
        error,
        retryConnection,
        endCall,
        toggleAudio,
        toggleVideo
    } = useWebRTC({ socket, user, roomId, peerSocketId, isInitiator, onCallEnd: onEnd });

    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [duration, setDuration] = useState(0);

    // Sync button state with hook
    useEffect(() => toggleAudio(!isMuted), [isMuted]);
    useEffect(() => toggleVideo(!isVideoOff), [isVideoOff]);

    // Timer
    useEffect(() => {
        let interval;
        if (connectionStatus === 'connected') {
            interval = setInterval(() => setDuration(prev => prev + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [connectionStatus]);

    const formatTime = (secs) => {
        const mins = Math.floor(secs / 60);
        const second = secs % 60;
        return `${mins}:${second < 10 ? '0' : ''}${second}`;
    };

    const handleReload = () => {
        window.location.reload(); // "auto reload" as requested for critical failures
    };

    return (
        <div className={`fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center overflow-hidden transition-all duration-300`}>

            {/* Header / Remote Info */}
            <div className="absolute top-0 left-0 right-0 p-6 z-10 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-start">
                <div className="flex flex-col">
                    <h2 className="text-white text-2xl font-bold tracking-tight">{peerName || "Unknown User"}</h2>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></span>
                        <p className="text-gray-300 text-sm font-medium capitalize">
                            {connectionStatus === 'connected' ? formatTime(duration) : `${connectionStatus}...`}
                        </p>
                    </div>
                </div>
            </div>

            {/* ERROR POPUP - "if any file got error show on popup" */}
            <AnimatePresence>
            {error && (
                 <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                 >
                     <div className="bg-slate-900 border border-red-500/50 p-8 rounded-3xl max-w-md w-full text-center shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse"></div>

                        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="text-red-500 w-10 h-10" />
                        </div>

                        <h3 className="text-2xl font-bold text-white mb-2">Connection Issue</h3>
                        <p className="text-gray-300 mb-8 leading-relaxed">
                            {error}
                        </p>

                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={retryConnection}
                                className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-xl transition font-medium"
                            >
                                <RefreshCw size={18} />
                                Retry
                            </button>
                            <button
                                onClick={handleReload}
                                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl transition font-medium shadow-lg shadow-red-500/20"
                            >
                                Reload Page
                            </button>
                        </div>

                        <button onClick={endCall} className="mt-6 text-gray-500 hover:text-white text-sm underline decoration-gray-500">
                            Cancel Call
                        </button>
                     </div>
                 </motion.div>
            )}
            </AnimatePresence>

            {/* VIDEO CONTAINER */}
            <div className="relative w-full h-full flex flex-col md:flex-row">
                {/* REMOTE VIDEO */}
                <div className="flex-1 relative bg-gray-900 flex items-center justify-center">
                    {remoteStream ? (
                        <video
                            className="w-full h-full object-cover"
                            autoPlay
                            playsInline
                            ref={video => { if (video) video.srcObject = remoteStream }}
                        />
                    ) : (
                        <div className="text-center p-8 animate-pulse">
                             <div className="w-24 h-24 bg-gray-800 rounded-full mx-auto mb-4 flex items-center justify-center border border-white/5">
                                <Video className="text-gray-600 w-10 h-10" />
                            </div>
                            <p className="text-gray-400 font-medium">Waiting for video stream...</p>
                        </div>
                    )}
                </div>

                {/* LOCAL VIDEO PIP */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    drag
                    dragConstraints={{ left: 0, right: 200, top: 0, bottom: 200 }}
                    className="absolute top-24 right-4 md:bottom-24 md:right-8 md:top-auto w-32 h-48 md:w-56 md:h-80 bg-gray-800 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 z-20 cursor-move hover:border-purple-500 transition-colors"
                >
                     {localStream ? (
                        <video
                            className="w-full h-full object-cover mirror"
                            autoPlay
                            playsInline
                            muted
                            ref={video => { if (video) video.srcObject = localStream }}
                            style={{ transform: 'scaleX(-1)' }}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full bg-black">
                            <VideoOff className="text-gray-500" />
                        </div>
                    )}
                    <div className="absolute bottom-2 left-2 text-[10px] uppercase tracking-wider font-bold bg-black/60 px-2 py-1 rounded-md text-white/80">You</div>
                </motion.div>
            </div>


            {/* CONTROLS BAR */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30 w-full max-w-md px-4">
                <div className="flex items-center justify-around bg-black/40 backdrop-blur-xl px-2 py-4 rounded-3xl border border-white/10 shadow-2xl">

                    <button
                         onClick={() => setIsMuted(!isMuted)}
                         className={`p-4 rounded-full transition-all duration-300 ${isMuted ? 'bg-red-500 text-white shadow-lg shadow-red-500/40' : 'bg-white/10 text-white hover:bg-white/20'}`}
                    >
                        {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                    </button>

                    <button
                         onClick={() => setIsVideoOff(!isVideoOff)}
                         className={`p-4 rounded-full transition-all duration-300 ${isVideoOff ? 'bg-red-500 text-white shadow-lg shadow-red-500/40' : 'bg-white/10 text-white hover:bg-white/20'}`}
                    >
                        {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
                    </button>

                    <button
                         onClick={() => {
                             if (!document.fullscreenElement) {
                                 document.documentElement.requestFullscreen();
                                 setIsFullScreen(true);
                             } else {
                                 if (document.exitFullscreen) {
                                    document.exitFullscreen();
                                    setIsFullScreen(false);
                                 }
                             }
                         }}
                         className="hidden md:block p-4 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
                    >
                        {isFullScreen ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
                    </button>

                    <button
                        onClick={endCall}
                        className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all shadow-lg hover:shadow-red-500/50 hover:scale-105 active:scale-95"
                    >
                        <Phone size={28} style={{ transform: 'rotate(135deg)' }} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VideoCall;
