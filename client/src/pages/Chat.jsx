 import { useEffect, useState, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { Send, Mic, Square, Play, Pause, ArrowLeft } from 'lucide-react';
import ChatHistoryList from '../components/ChatHistoryList';
import OnlineAstrologers from '../components/OnlineAstrologers';
import OffersList from '../components/OffersList';
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

  if (loading) {
    return (
      <div className="h-24 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
      </div>
    );
  }
  return <OnlineAstrologers astrologers={astrologers} />;
};

const Chat = () => {
  const { id: receiverId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { addToast } = useToast();

  // State for Chat History View
  const [chatSessions, setChatSessions] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // State for Active Chat View
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [balance, setBalance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [cost, setCost] = useState(0);
  const rate = 1; // ₹1 per minute
  const timerRef = useRef(null);
  const [chatActive, setChatActive] = useState(false);
  const [chatId, setChatId] = useState(null);

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const messagesEndRef = useRef(null);

  // --- EFFECT: Fetch Chat History if ID is 0 ---
  useEffect(() => {
    if (receiverId === '0' && user) {
      const fetchSessions = async () => {
        try {
          const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/chat/sessions`);
          setChatSessions(res.data);
          setLoadingHistory(false);
        } catch (err) {
          console.error("Error fetching chat sessions:", err);
          setLoadingHistory(false);
        }
      };
      fetchSessions();
    }
  }, [receiverId, user]);

  // --- EFFECT: Active Chat Logic (Only if ID != 0) ---
  useEffect(() => {
    if (!user || !receiverId || receiverId === '0') return;

    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    // Fetch wallet balance
    if (user.role !== 'admin') {
      const fetchBalance = async () => {
        try {
          const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/wallet/balance`);
          setBalance(res.data.balance);
        } catch (err) {
          console.error("❌ Failed to fetch balance:", err);
          addToast("Failed to fetch wallet balance", "error");
        }
      };
      fetchBalance();
    } else {
      setBalance(Infinity);
    }

    // Initiate Chat Session
    const initChat = async () => {
      if (user.role === 'client') {
        try {
          const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/chat/initiate`, { receiverId });
          const newChatId = res.data.chatId;
          setChatId(newChatId);

          socket.emit('callUser', {
            userToCall: receiverId,
            from: user.id,
            name: user.name,
            type: 'chat',
            chatId: newChatId
          });
        } catch (err) {
          console.error("Failed to initiate chat billing", err);
          addToast("Insufficient balance or error starting chat", "error");
          navigate('/dashboard');
        }
      } else {
        setChatActive(true);
      }
    };
    initChat();

    // Join chat room
    socket.emit('join', chatId || `${user.id}-${receiverId}`);

    // Listen for messages & call acceptance
    const handleReceiveMessage = (msg) => {
      setMessages(prev => [...prev, msg]);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleCallAccepted = () => {
      setChatActive(true);
      addToast("Astrologer connected! Chat started.", "success");
    };

    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('callAccepted', handleCallAccepted);

    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('callAccepted', handleCallAccepted);
      clearInterval(timerRef.current);
    };
  }, [user, receiverId, navigate, chatId]);

  // Billing Timer
  useEffect(() => {
    const numericBalance = Number(balance) || 0;
    const numericRate = Number(rate) || 0;

    if (chatActive && (numericBalance > 0 || user?.role === 'admin') && (chatId || user?.role === 'admin')) {
      const maxDuration = user?.role === 'admin' ? Infinity : (numericBalance / numericRate) * 60;

      timerRef.current = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1;
          if (newDuration >= maxDuration) {
            if (user?.role !== 'admin') {
              endChat();
              addToast("Chat ended due to insufficient balance.", "warning");
            }
          }
          return newDuration;
        });
        setCost(prev => prev + (numericRate / 60));
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [chatActive, balance, chatId, user]);

  // Typing Indicator
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  const handleTyping = () => {
    if (!chatId) return;
    socket.emit('typing', { roomId: chatId, name: user.name });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stopTyping', { roomId: chatId });
    }, 2000);
  };

  useEffect(() => {
    socket.on('displayTyping', (data) => {
      if (data.name !== user.name) setIsTyping(true);
    });
    socket.on('hideTyping', () => setIsTyping(false));

    return () => {
      socket.off('displayTyping');
      socket.off('hideTyping');
    };
  }, [user]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!chatId) return;

    if (message.trim()) {
      const msgData = {
        roomId: chatId,
        senderId: user.id,
        text: message,
        timestamp: new Date(),
        type: 'text'
      };
      socket.emit('sendMessage', msgData);
      setMessage('');
      socket.emit('stopTyping', { roomId: chatId });
    }
  };

  // Voice Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const audioChunks = [];
      mediaRecorder.ondataavailable = (event) => audioChunks.push(event.data);

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      addToast('Could not access microphone. Please grant permission.', 'error');
    }
  };

    const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
    }
  };

  const sendVoiceMessage = () => {
    if (!audioBlob || !chatId) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Audio = reader.result;
      const msgData = {
        roomId: chatId,
        senderId: user.id,
        audio: base64Audio,
        duration: recordingTime,
        timestamp: new Date(),
        type: 'audio'
      };

      socket.emit('sendMessage', msgData);
      setAudioBlob(null);
      setRecordingTime(0);
    };

    reader.readAsDataURL(audioBlob);
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
    }
    setAudioBlob(null);
    setRecordingTime(0);
  };

  const endChat = async () => {
    setChatActive(false);
    clearInterval(timerRef.current);
    clearInterval(recordingTimerRef.current);

    if (chatId) {
      try {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/chat/end`, { chatId, duration });
        addToast(`Chat ended. Cost: ₹${cost.toFixed(2)}`, 'info');
      } catch (err) {
        console.error("Error ending chat:", err);
      }
    }

    if (user?.role === 'astrologer') {
      navigate('/astrologer-dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  // --- RENDER: History View (ID = 0) ---
  if (receiverId === '0') {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-white p-4 shadow-sm border-b border-gray-100 sticky top-0 z-10">
          <h1 className="text-xl font-bold text-gray-800">Chat with Astrologers</h1>
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

          {/* History Section */}
          {user ? (
            <div className="mt-8">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Your Chats</h2>
              {loadingHistory ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : (
                <ChatHistoryList sessions={chatSessions} />
              )}
            </div>
          ) : (
            <div className="mt-8 p-6 bg-purple-50 rounded-xl text-center border border-purple-100">
              <p className="text-gray-600 mb-4">
                Login to view your chat history and consult with top astrologers.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="bg-purple-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-purple-700 transition-colors"
              >
                Login Now
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- RENDER: Active Chat View (ID != 0) ---
  return (
    <div className="h-screen flex flex-col bg-orange-50">
      {/* Header */}
      <div className="bg-orange-600 p-4 shadow flex justify-between items-center text-white">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/chat/0')} className="p-1 hover:bg-orange-500 rounded-full">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-bold">Chat Session</h2>
            {isTyping && <p className="text-sm text-orange-200 italic">Typing...</p>}
          </div>
        </div>
        <div className="text-right">
          <p className="text-orange-100">
            Time: {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
          </p>
          <p className="text-orange-100">Cost: ₹{cost.toFixed(2)}</p>
        </div>
        <button
          onClick={endChat}
          className="bg-white text-orange-600 px-4 py-2 rounded hover:bg-orange-100 font-bold text-sm"
        >
          End
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs p-3 rounded-lg ${
                msg.senderId === user.id
                  ? 'bg-orange-600 text-white'
                  : 'bg-white text-gray-800 shadow'
              }`}
            >
              {msg.type === 'audio' ? (
                <AudioMessage audio={msg.audio} duration={msg.duration} />
              ) : (
                <p>{msg.text}</p>
              )}
              <span className="text-xs opacity-75 block text-right mt-1">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Voice Recording Preview */}
      {audioBlob && !isRecording && (
        <div className="px-4 py-3 bg-orange-100 border-t border-orange-200 flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2">
            <Mic className="text-orange-600" size={20} />
            <span className="text-sm text-gray-700">Voice message ({recordingTime}s)</span>
          </div>
          <button
            onClick={sendVoiceMessage}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 font-semibold"
          >
            Send
          </button>
          <button
            onClick={cancelRecording}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 bg-white border-t border-orange-200 flex gap-2">
        {isRecording ? (
          <div className="flex-1 flex items-center gap-3 bg-red-50 px-4 py-3 rounded-xl border-2 border-red-300">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-red-600 font-semibold">Recording... {recordingTime}s</span>
            <button
              type="button"
              onClick={stopRecording}
              className="ml-auto bg-red-500 text-white p-2 rounded-lg hover:bg-red-600"
            >
              <Square size={20} />
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={startRecording}
              className="bg-orange-100 text-orange-600 p-3 rounded-xl hover:bg-orange-200 transition-colors"
            >
              <Mic size={20} />
            </button>
            <input
              type="text"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                handleTyping();
              }}
              className="flex-1 p-2 border border-orange-300 rounded-xl focus:outline-none focus:border-orange-600"
              placeholder="Type a message..."
            />
            <button type="submit" className="bg-orange-600 text-white px-6 py-2 rounded-xl hover:bg-orange-700">
              <Send size={20} />
            </button>
          </>
        )}
      </form>
    </div>
  );
};

// Audio Message Component
const AudioMessage = ({ audio, duration }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
            setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={togglePlay}
        className="bg-white bg-opacity-20 p-2 rounded-full hover:bg-opacity-30 transition-colors"
      >
        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
      </button>
      <div className="flex-1">
        <div className="h-1 bg-white bg-opacity-30 rounded-full overflow-hidden">
          <div className="h-full bg-white w-0" id="progress"></div>
        </div>
        <span className="text-xs opacity-75">{duration}s</span>
      </div>
      <audio
        ref={audioRef}
        src={audio}
        onEnded={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
    </div>
  );
};

export default Chat;
