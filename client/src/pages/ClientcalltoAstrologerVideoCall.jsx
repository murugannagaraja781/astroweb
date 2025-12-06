import React, { useEffect, useRef, useState } from "react";
import { FiVideo, FiVideoOff, FiMic, FiMicOff, FiPhone, FiInfo, FiX } from "react-icons/fi";
import { useVideoCall } from "../hooks/useVideoCall";

export default function ClientcalltoAstrologerVideoCall({ roomId }) {
    const {
        callStatus,
        localStream,
        remoteStream,
        error,
        debugLogs,
        isVideoEnabled,
        isAudioEnabled,
        toggleVideo,
        toggleAudio,
        endCall
    } = useVideoCall(roomId);

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const [showDebug, setShowDebug] = useState(true);

    // Sync streams to video elements
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    return (
        <div className="flex flex-col items-center justify-center h-full bg-gray-900 text-white p-4 relative overflow-hidden">
            {/* Debug Overlay */}
            {showDebug && (
                <div className="absolute top-4 right-4 z-50 w-80 max-h-96 bg-black/80 backdrop-blur-sm rounded-lg border border-purple-500/30 flex flex-col shadow-2xl overflow-hidden">
                    <div className="flex items-center justify-between p-2 bg-gradient-to-r from-purple-900 to-black border-b border-purple-500/30">
                        <div className="flex items-center gap-2 text-xs font-bold text-purple-200">
                            <FiInfo />
                            <span>Debug Logs ({callStatus})</span>
                        </div>
                        <button onClick={() => setShowDebug(false)} className="text-gray-400 hover:text-white transition-colors">
                            <FiX size={14} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-[10px]">
                        {debugLogs.length === 0 && <span className="text-gray-600 italic">Waiting for logs...</span>}
                        {debugLogs.map((log, i) => (
                            <div key={i} className="border-b border-gray-800/50 last:border-0 pb-0.5">
                                <span className="text-purple-400 mr-2 opacity-50">{log.split('] ')[0]}]</span>
                                <span className="text-gray-300">{log.split('] ')[1] || log}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!showDebug && (
                <button
                    onClick={() => setShowDebug(true)}
                    className="absolute top-4 right-4 z-50 bg-black/50 p-2 rounded-full hover:bg-purple-600 transition-all"
                    title="Show Debug Logs"
                >
                    <FiInfo />
                </button>
            )}

            <h2 className="text-2xl font-bold mb-4 z-10 drop-shadow-lg">Video Consultation</h2>

            {error && (
                <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-red-600 px-6 py-3 rounded-full z-50 shadow-xl animate-bounce">
                    <p className="font-bold">{error}</p>
                </div>
            )}

            <div className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-gray-800 group">
                {/* Remote Video (Main) */}
                <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                />

                {/* Placeholder if no remote stream */}
                {!remoteStream && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90 text-gray-500 flex-col gap-4">
                        <div className="w-20 h-20 border-4 border-gray-700 border-t-purple-500 rounded-full animate-spin"></div>
                        <p className="animate-pulse font-mono tracking-widest text-sm">
                            {callStatus === 'calling' ? 'CONNECTING...' : 'WAITING FOR ASTROLOGER...'}
                        </p>
                    </div>
                )}

                {/* Local Video (PIP) */}
                <div className="absolute bottom-4 right-4 w-32 md:w-48 aspect-video bg-gray-800 rounded-xl overflow-hidden border-2 border-purple-500 shadow-lg transition-all duration-300 hover:scale-105 hover:border-white">
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover transform scale-x-[-1]"
                    />
                    <div className="absolute bottom-1 right-2 text-[10px] font-bold bg-black/50 px-1 rounded text-white/80">YOU</div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex gap-6 mt-8 z-10">
                <button
                    onClick={toggleAudio}
                    className={`p-5 rounded-full transition-all duration-300 shadow-xl transform hover:scale-110 ${isAudioEnabled ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white ring-4 ring-red-500/30'}`}
                    title={isAudioEnabled ? "Mute Mic" : "Unmute Mic"}
                >
                    {isAudioEnabled ? <FiMic size={24} /> : <FiMicOff size={24} />}
                </button>

                <button
                    onClick={endCall}
                    className="p-5 rounded-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white shadow-xl transform hover:scale-110 shadow-red-500/20 ring-4 ring-transparent hover:ring-red-500/30 transition-all"
                    title="End Call"
                >
                    <FiPhone size={32} className="transform rotate-135" />
                </button>

                <button
                    onClick={toggleVideo}
                    className={`p-5 rounded-full transition-all duration-300 shadow-xl transform hover:scale-110 ${isVideoEnabled ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white ring-4 ring-red-500/30'}`}
                    title={isVideoEnabled ? "Turn Off Camera" : "Turn On Camera"}
                >
                    {isVideoEnabled ? <FiVideo size={24} /> : <FiVideoOff size={24} />}
                </button>
            </div>

            <p className="mt-4 text-gray-500 text-sm font-mono">{callStatus.toUpperCase()}</p>
        </div>
    );
}