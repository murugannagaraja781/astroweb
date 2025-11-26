import { useEffect, useState, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import AgoraRTC, { AgoraRTCProvider, useRTCClient, useLocalCameraTrack, useLocalMicrophoneTrack, usePublish, useRemoteUsers, useJoin, LocalUser, RemoteUser } from 'agora-rtc-react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import CallHistoryList from '../components/CallHistoryList';
import OnlineAstrologers from '../components/OnlineAstrologers';
import OffersList from '../components/OffersList';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const socket = io(import.meta.env.VITE_API_URL);

// Helper component to fetch and display astrologers
const OnlineAstrologersWrapper = () => {
  const [astrologers, setAstrologers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAstrologers = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/public/astrologers`);
        setAstrologers(res.data);
      } catch (err) {
        console.error("Failed to fetch astrologers", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAstrologers();
  }, []);

  if (loading) return <div className="h-24 flex items-center justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div></div>;
  return <OnlineAstrologers astrologers={astrologers} />;
};
const APP_ID = '196be66ba9ab4172921c1e7f7e948879';

const VideoCallContent = ({ callId, receiverId, setCallActive, callActive, userRole }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { addToast } = useToast();

  // Agora Hooks
  const client = useRTCClient();
  const { localCameraTrack } = useLocalCameraTrack();
  const { localMicrophoneTrack } = useLocalMicrophoneTrack();
  const remoteUsers = useRemoteUsers();

  useJoin({ appid: APP_ID, channel: callId, uid: user.id, token: null }, callActive);
  usePublish([localMicrophoneTrack, localCameraTrack], callActive);

  const [duration, setDuration] = useState(0);
  const [cost, setCost] = useState(0);
  const [rate, setRate] = useState(1); // Fixed rate: ₹1 per minute
  const [balance, setBalance] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    // Fetch wallet balance only for non-admin users
    if (user && user.role !== 'admin') {
      const fetchBalance = async () => {
        try {
          const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/wallet/balance`);
          setBalance(res.data.balance);
          console.log(`✅ Balance fetched: ₹${res.data.balance}`);
        } catch (err) {
          console.error("❌ Failed to fetch balance:", err);
          addToast("Failed to fetch wallet balance", "error");
        }
      };
      fetchBalance();
    } else {
      // Admin (super admin) has unlimited balance
      console.log('✅ Admin user - unlimited balance');
      setBalance(Infinity);
    }
  }, [user, addToast]);

  useEffect(() => {
    if (callActive && balance > 0) {
      const maxDuration = (balance / rate) * 60; // Max duration in seconds

      timerRef.current = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1;
          if (newDuration >= maxDuration) {
            leaveCall(); // Auto-end call
            addToast("Call ended due to insufficient balance.", "warning");
            return prev;
          }
          return newDuration;
        });
        setCost(prev => prev + (rate / 60));
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [callActive, balance, rate]);

  const leaveCall = async () => {
    setCallActive(false);
    clearInterval(timerRef.current);

    // Notify other user
    socket.emit('endCall', { to: receiverId });

    // End Call on Backend
    if (callId) {
      try {
        await axios.post('https://astroweb-y0i6.onrender.com/api/call/end', { callId, duration });
      } catch (err) {
        console.error("Error ending call:", err);
      }
    }

    if (userRole === 'astrologer') {
        navigate('/astrologer-dashboard');
    } else {
        navigate('/dashboard');
    }
  };

  useEffect(() => {
      socket.on('callEnded', () => {
          addToast("Call ended by remote user", "info");
          leaveCall();
      });
      return () => socket.off('callEnded');
  }, []);

  return (
    <div className={`h-screen flex flex-col items-center justify-center text-white ${userRole === 'astrologer' ? 'bg-orange-900' : 'bg-gray-900'}`}>
      <div className="absolute top-4 left-4 z-10">
        <button onClick={() => navigate('/call/0')} className="bg-white/10 p-2 rounded-full hover:bg-white/20 mb-2">
            <ArrowLeft />
        </button>
        <p>Duration: {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}</p>
        <p>Cost: ₹{cost.toFixed(2)}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full h-3/4 p-4">
        <div className="relative border-2 border-indigo-500 rounded overflow-hidden bg-black">
          <LocalUser
            audioTrack={localMicrophoneTrack}
            cameraTrack={localCameraTrack}
            micOn={true}
            cameraOn={true}
            cover="https://www.agora.io/en/wp-content/uploads/2022/10/3d-spatial-audio-icon.svg"
          >
             <div className="absolute inset-0 flex items-center justify-center z-0">
                <img src="https://cdn-icons-png.flaticon.com/512/149/149071.png" alt="Placeholder" className="w-24 h-24 opacity-50" />
             </div>
            <samp className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 rounded z-10">You</samp>
          </LocalUser>
        </div>

        {remoteUsers.map((user) => (
          <div key={user.uid} className="relative border-2 border-green-500 rounded overflow-hidden bg-black">
            <RemoteUser user={user} cover="https://cdn-icons-png.flaticon.com/512/149/149071.png">
              <samp className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 rounded z-10">Remote</samp>
            </RemoteUser>
             {!user.hasVideo && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                    <img src="https://cdn-icons-png.flaticon.com/512/149/149071.png" alt="User" className="w-32 h-32 rounded-full" />
                </div>
             )}
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-4">
        <button onClick={leaveCall} className="bg-red-600 px-6 py-3 rounded-full font-bold hover:bg-red-700">
          End Call
        </button>
      </div>
    </div>
  );
};

const VideoCall = () => {
  const { id: otherUserId } = useParams(); // This is the OTHER person's ID
  const { user } = useContext(AuthContext);
  const [callId, setCallId] = useState(null);
  const [callActive, setCallActive] = useState(false);
  const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
  const query = new URLSearchParams(window.location.search);
  const incomingCallId = query.get('callId');
  const { addToast } = useToast();

  // History State
  const [callHistory, setCallHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // --- EFFECT: Fetch Call History if ID is 0 ---
  useEffect(() => {
    if (otherUserId === '0' && user) {
      const fetchHistory = async () => {
        try {
          const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/call/history`);
          setCallHistory(res.data);
          setLoadingHistory(false);
        } catch (err) {
          console.error("Error fetching call history:", err);
          setLoadingHistory(false);
        }
      };
      fetchHistory();
    }
  }, [otherUserId, user]);

  useEffect(() => {
    if (!user || otherUserId === '0') return;

    if (user) {
      socket.emit('join', user.id);
    }

    const startCall = async () => {
      try {
        if (user.role === 'client') {
          // Client Initiates
          const res = await axios.post('https://astroweb-y0i6.onrender.com/api/call/initiate', { receiverId: otherUserId });
          const newCallId = res.data.callId;
          setCallId(newCallId);
          setCallActive(true);

          // Send Call Signal with Call ID
          socket.emit('callUser', {
            userToCall: otherUserId,
            from: user.id,
            name: user.name,
            callId: newCallId
          });
        } else if (user.role === 'astrologer') {
          // Astrologer Joins
          if (incomingCallId) {
            setCallId(incomingCallId);
            setCallActive(true);
          } else {
            addToast("No call ID found for astrologer to join.", "error");
          }
        }
      } catch (err) {
        console.error(err);
        addToast('Call failed to start', 'error');
      }
    };

    if (user) {
      startCall();
    }
  }, [user, otherUserId, incomingCallId]);

  // --- RENDER: History View (ID = 0) ---
  if (otherUserId === '0') {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-white p-4 shadow-sm border-b border-gray-100 sticky top-0 z-10">
          <h1 className="text-xl font-bold text-gray-800">Video Call Astrologers</h1>
        </div>

        <div className="p-4 max-w-4xl mx-auto">
          {/* Online Astrologers Section */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Online Now
            </h2>
            <OnlineAstrologersWrapper />
          </div>

          {/* Offers Section */}
          <OffersList />

          {/* History Section (Only for logged in users) */}
          {user ? (
            <div className="mt-8">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Call History</h2>
              {loadingHistory ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <CallHistoryList calls={callHistory} userRole={user?.role} />
              )}
            </div>
          ) : (
             <div className="mt-8 p-6 bg-blue-50 rounded-xl text-center border border-blue-100">
                <p className="text-gray-600 mb-4">Login to view your call history and consult with top astrologers.</p>
                <button onClick={() => navigate('/login')} className="bg-blue-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-blue-700 transition-colors">
                  Login Now
                </button>
             </div>
          )}
        </div>
      </div>
    );
  }

  if (!callId) return <div className="text-white">Initializing Call...</div>;

  return (
    <AgoraRTCProvider client={client}>
      <div className={user?.role === 'astrologer' ? "theme-orange" : "theme-dark"}>
         <VideoCallContent
            callId={callId}
            receiverId={otherUserId}
            callActive={callActive}
            setCallActive={setCallActive}
            userRole={user?.role}
          />
      </div>
    </AgoraRTCProvider>
  );
};

export default VideoCall;
