import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  AgoraRTCProvider,
  useJoin,
  useLocalCameraTrack,
  useLocalMicrophoneTrack,
  usePublish,
  useRTCClient,
  useRemoteUsers,
  useRemoteAudioTracks,
  RemoteUser,
} from 'agora-rtc-react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiPhone } from 'react-icons/fi';

const APP_ID = import.meta.env.VITE_AGORA_APP_ID;

// Helper component for the internal video call logic
const VideoCallInterface = ({ appId, channelName, token, uid, onEndCall }) => {
  // Hooks provided by agora-rtc-react
  const { isLoading: isLoadingMic, localMicrophoneTrack } = useLocalMicrophoneTrack();
  const { isLoading: isLoadingCam, localCameraTrack } = useLocalCameraTrack();

  const remoteUsers = useRemoteUsers();
  const { audioTracks } = useRemoteAudioTracks(remoteUsers);

  // Auto-publish local tracks
  usePublish([localMicrophoneTrack, localCameraTrack]);

  // Join the channel
  useJoin(
    {
      appid: appId,
      channel: channelName,
      token: token,
      uid: uid,
    },
    true // active
  );

  // Play remote audio
  useEffect(() => {
    audioTracks.forEach((track) => track.play());
  }, [audioTracks]);

  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);

  const toggleMic = () => {
    if (localMicrophoneTrack) {
        localMicrophoneTrack.setEnabled(!micOn);
        setMicOn(!micOn);
    }
  };

  const toggleCamera = () => {
    if (localCameraTrack) {
        localCameraTrack.setEnabled(!cameraOn);
        setCameraOn(!cameraOn);
    }
  };

  if (!APP_ID) {
      return <div className="text-white">Error: VITE_AGORA_APP_ID is missing in environment variables.</div>;
  }

  const isLoading = isLoadingMic || isLoadingCam;

  return (
    <div className="flex flex-col h-full w-full bg-slate-900 text-white p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Astrology Session
        </h2>
        <div className="bg-slate-800 px-3 py-1 rounded-full text-xs text-slate-400">
           Channel: {channelName}
        </div>
      </div>

      {/* Main Video Area */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 relative overflow-hidden">

        {/* Remote Users (Grid) */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
           {remoteUsers.length === 0 ? (
               <div className="flex items-center justify-center h-full bg-slate-800/50 rounded-2xl border border-white/5">
                   <div className="text-center">
                       <div className="animate-pulse text-4xl mb-4">📡</div>
                       <p className="text-slate-400">Waiting for others to join...</p>
                   </div>
               </div>
           ) : (
               remoteUsers.map((user) => (
                   <div className="relative rounded-2xl overflow-hidden bg-slate-800 h-full w-full" key={user.uid}>
                       <RemoteUser user={user} className="w-full h-full object-cover" />
                        <div className="absolute bottom-3 left-3 bg-black/60 px-2 py-1 rounded text-xs">
                            User {user.uid}
                        </div>
                   </div>
               ))
           )}
        </div>

        {/* Local Video (Floating or Split) */}
        {!isLoading && (
            <div className="absolute top-4 right-4 w-32 h-48 md:w-48 md:h-64 bg-slate-800 rounded-xl overflow-hidden shadow-2xl border-2 border-slate-700/50 z-10 transition-all hover:scale-105">
                <div id="local-player" className="w-full h-full bg-black">
                     {/* Local video track needs to be played manually in a customized div or passing generic player
                         Normally AgoraRTCProvider handles this if we use LocalUser, but let's try manual play or specific component
                     */}
                     {/* Note: In v2, we usually use <LocalVideoTrack track={localCameraTrack} play/> */}
                     {/* Using a cleaner ref approach or package components: */}
                     {/* Since we are using headless hooks mostly, let's use the track helper */}
                     <LocalVideoPlayer track={localCameraTrack} />
                </div>
                <div className="absolute bottom-2 left-2 flex gap-1">
                    {!micOn && <FiMicOff className="text-red-500 text-xs" />}
                    {!cameraOn && <FiVideoOff className="text-red-500 text-xs" />}
                </div>
            </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-6 flex justify-center gap-6">
        <button
            onClick={toggleMic}
            className={`p-4 rounded-full transition-all ${micOn ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
        >
            {micOn ? <FiMic size={24} /> : <FiMicOff size={24} />}
        </button>

        <button
            onClick={onEndCall}
            className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30 transform hover:scale-110 transition-all"
        >
            <FiPhone size={24} className="transform rotate-135" />
        </button>

        <button
            onClick={toggleCamera}
            className={`p-4 rounded-full transition-all ${cameraOn ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
        >
            {cameraOn ? <FiVideo size={24} /> : <FiVideoOff size={24} />}
        </button>
      </div>
    </div>
  );
};

// Helper for Local Video
const LocalVideoPlayer = ({ track }) => {
    useEffect(() => {
        if (track) {
            track.play('local-player-video');
        }
        return () => {
            // track stop is handled by hook usually, but play needs div
        };
    }, [track]);

    return (
        <div id="local-player-video" className="w-full h-full" style={{ width: '100%', height: '100%' }}></div>
    );
}

export default function AgoraVideoCall() {
  const { id } = useParams(); // Astrologer ID (receiverId)
  const navigate = useNavigate();
  const [token, setToken] = useState(null);
  const [uid, setUid] = useState(null);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('checking_balance'); // checking_balance, initiating, calling, connected, ended, insufficient_balance
  const [callId, setCallId] = useState(null);
  const [balance, setBalance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [cost, setCost] = useState(0);

  // Socket instance
  const socketRef = useRef(null);

  // Create Agora Client
  const client = useRTCClient(AgoraRTC.createClient({ codec: 'vp8', mode: 'rtc' }));

  useEffect(() => {
    // Initialize Socket
    socketRef.current = io(import.meta.env.VITE_API_URL, {
        transports: ["websocket", "polling"],
        reconnection: true,
    });

    socketRef.current.on("connect", () => {
        console.log("Socket connected for video call");
    });

    // Clean up
    return () => {
        if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  useEffect(() => {
    const startCallSequence = async () => {
        try {
            const authToken = localStorage.getItem('token');
            if (!authToken) {
                navigate('/login');
                return;
            }

            // 1. Check Balance & Initiate Call
            setStatus('initiating');
            const initiateRes = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/call/initiate`,
                { receiverId: id, type: 'video' },
                { headers: { Authorization: `Bearer ${authToken}` } }
            );

            const { callId: newCallId, balance: currentBalance } = initiateRes.data;
            setCallId(newCallId);
            setBalance(currentBalance);

            console.log("Call Initiated:", newCallId);

            // 2. Emit Call Request
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            socketRef.current.emit("call:request", {
                fromId: user._id || user.id, // Ensure we have ID
                toId: id,
                fromName: user.name || "Client",
                fromImage: user.image,
                roomId: newCallId, // Use callId as room ID for uniqueness
                callId: newCallId // IMPORTANT: Pass callId for billing
            });

            setStatus('calling');

            // 3. Wait for Acceptance
            socketRef.current.on("call:accepted", async ({ roomId }) => {
                console.log("Call Accepted! Joining room:", roomId);
                setStatus('connected');

                // Fetch Token
                try {
                    const localUid = Math.floor(Math.random() * 100000);
                    setUid(localUid);
                    const tokenRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/agora/token?channel=${roomId}&uid=${localUid}`, {
                        headers: { Authorization: `Bearer ${authToken}` }
                    });
                    setToken(tokenRes.data.token);
                } catch (err) {
                    setError("Failed to generate token");
                }
            });

            socketRef.current.on("call:rejected", () => {
                setError("Astrologer is busy or declined the call.");
                setStatus('ended');
            });

            socketRef.current.on("call:end", () => {
                setError("Call ended by astrologer.");
                setStatus('ended');
            });

            // 4. Listen for Billing Updates
            socketRef.current.on("billingUpdate", (data) => {
                if (data.callId === newCallId) {
                    setDuration(data.duration);
                    setCost(data.cost);
                    if (data.balance !== undefined) setBalance(data.balance);
                }
            });

            socketRef.current.on("callEndedBySystem", (data) => {
                setError(`Call ended: ${data.reason === 'insufficient_balance' ? 'Insufficient Balance' : 'System limit reached'}`);
                setCost(data.cost);
                setStatus('ended');
            });

        } catch (err) {
            console.error("Error starting call:", err);
            if (err.response && err.response.status === 400 && err.response.data.msg.includes('Insufficient balance')) {
                setStatus('insufficient_balance');
                setBalance(err.response.data.balance || 0);
            } else {
                setError(err.response?.data?.msg || err.message);
                setStatus('ended');
            }
        }
    };

    if (id && socketRef.current) {
        startCallSequence();
    }
  }, [id, navigate]);

  const handleEndCall = () => {
      if (socketRef.current && callId) {
          socketRef.current.emit("call:end", { toSocketId: null }); // We might need toId, but server can handle via room
          // Also call API to end call log officially
          const authToken = localStorage.getItem('token');
          axios.post(`${import.meta.env.VITE_API_URL}/api/call/end`, { callId }, {
               headers: { Authorization: `Bearer ${authToken}` }
          });
      }
      navigate('/dashboard');
  };

  if (status === 'insufficient_balance') {
      return (
          <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
              <div className="bg-slate-800 p-8 rounded-2xl border border-white/10 text-center max-w-md">
                  <div className="text-4xl mb-4">💰</div>
                  <h3 className="text-xl font-bold mb-2">Insufficient Balance</h3>
                  <p className="text-slate-400 mb-6">You need at least ₹1 to start a call. Your balance is ₹{balance}.</p>
                  <div className="flex gap-4 justify-center">
                      <button onClick={() => navigate('/wallet')} className="px-6 py-2 bg-green-500 hover:bg-green-600 rounded-lg font-bold">Add Money</button>
                      <button onClick={() => navigate(-1)} className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg">Go Back</button>
                  </div>
              </div>
          </div>
      );
  }

  if (status === 'initiating' || status === 'calling') {
      return (
          <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
              <div className="flex flex-col items-center animate-pulse">
                   <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-purple-500/50">
                       <FiPhone size={40} className="text-white animate-bounce" />
                   </div>
                   <h3 className="text-2xl font-bold mb-2">Calling Astrologer...</h3>
                   <p className="text-slate-400">Please wait for them to accept.</p>
              </div>
          </div>
      );
  }

  if (error) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
              <div className="bg-red-500/10 p-8 rounded-2xl border border-red-500/20 text-center">
                  <h3 className="text-xl font-bold text-red-400 mb-2">Call Ended</h3>
                  <p className="mb-4">{error}</p>
                  {cost > 0 && <p className="text-green-400 mb-4">Total Cost: ₹{cost}</p>}
                  <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-slate-800 rounded hover:bg-slate-700">
                      Go to Dashboard
                  </button>
              </div>
          </div>
      );
  }

  if (!token || !uid || !client || status !== 'connected') {
      return null; // Or loading
  }

  return (
      <div className="h-screen w-screen bg-slate-900 relative">
          <AgoraRTCProvider client={client}>
              <VideoCallInterface
                appId={APP_ID}
                channelName={callId} // Using callId as channel name
                token={token}
                uid={uid}
                onEndCall={handleEndCall}
              />
          </AgoraRTCProvider>

          {/* Billing Overlay */}
          <div className="absolute top-4 left-4 z-50 bg-black/50 backdrop-blur px-4 py-2 rounded-lg border border-white/10 text-xs font-mono">
              <div className="flex items-center gap-2 mb-1">
                  <span className="text-green-400">●</span>
                  <span>{Math.floor(duration / 60)}:{String(duration % 60).padStart(2, '0')}</span>
              </div>
              <div className="text-slate-300">Cost: ₹{cost}</div>
              <div className="text-slate-400">Bal: ₹{balance}</div>
          </div>
      </div>
  );
}
```
