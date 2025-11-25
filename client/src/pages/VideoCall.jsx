import { useEffect, useState, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import AgoraRTC, { AgoraRTCProvider, useRTCClient, useLocalCameraTrack, useLocalMicrophoneTrack, usePublish, useRemoteUsers, useJoin, LocalUser, RemoteUser } from 'agora-rtc-react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const socket = io('https://astroweb-y0i6.onrender.com');
const APP_ID = '196be66ba9ab4172921c1e7f7e948879';

const VideoCallContent = ({ callId, receiverId, setCallActive, callActive, userRole }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

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
    // Fetch wallet balance
    const fetchBalance = async () => {
      try {
        const res = await axios.get('https://astroweb-y0i6.onrender.com/api/wallet/balance');
        setBalance(res.data.balance);
      } catch (err) {
        console.error("Failed to fetch balance", err);
      }
    };
    fetchBalance();
  }, []);

  useEffect(() => {
    if (callActive && balance > 0) {
      const maxDuration = (balance / rate) * 60; // Max duration in seconds

      timerRef.current = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1;
          if (newDuration >= maxDuration) {
            leaveCall(); // Auto-end call
            alert("Call ended due to insufficient balance.");
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
          alert("Call ended by remote user");
          leaveCall();
      });
      return () => socket.off('callEnded');
  }, []);

  return (
    <div className={`h-screen flex flex-col items-center justify-center text-white ${userRole === 'astrologer' ? 'bg-orange-900' : 'bg-gray-900'}`}>
      <div className="absolute top-4 left-4">
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

  useEffect(() => {
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
            alert("No call ID found for astrologer to join.");
          }
        }
      } catch (err) {
        console.error(err);
        alert('Call failed');
      }
    };

    if (user) {
      startCall();
    }
  }, [user, otherUserId, incomingCallId]);

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
