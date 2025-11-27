import { useEffect, useState, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { Send, Mic, Square, Play, Pause, ArrowLeft, Sparkles, Star } from 'lucide-react';
import ChatHistoryList from '../components/ChatHistoryList';
import OnlineAstrologers from '../components/OnlineAstrologers';
import OffersList from '../components/OffersList';
import { useToast } from '../context/ToastContext';

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
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-400"></div>
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

  // Socket state
  const [socket, setSocket] = useState(null);

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

  // --- EFFECT: Initialize Socket ---
  useEffect(() => {
    const token = localStorage.getItem('token');
    const newSocket = io(import.meta.env.VITE_API_URL, {
      auth: { token }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

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
    if (!socket || !user || !receiverId || receiverId === '0') return;

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
    const room = [user.id, receiverId].sort().join('-');
    setChatId(room);
    socket.emit('join', room);

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
  }, [socket, user, receiverId, navigate]);

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
    if (!chatId || !socket) return;
    socket.emit('typing', { roomId: chatId, name: user.name });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stopTyping', { roomId: chatId });
    }, 2000);
  };

  useEffect(() => {
    if (!socket) return;
    socket.on('displayTyping', (data) => {
      if (data.name !== user.name) setIsTyping(true);
    });
    socket.on('hideTyping', () => setIsTyping(false));

    return () => {
      socket.off('displayTyping');
      socket.off('hideTyping');
    };
  }, [socket, user]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!chatId || !socket) return;

    if (message.trim()) {
      const msgData = {
        roomId: chatId,
        senderId: user.id,
        receiverId: receiverId,
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
    if (!audioBlob || !chatId || !socket) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Audio = reader.result;
      const msgData = {
        roomId: chatId,
        senderId: user.id,
        receiverId: receiverId,
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
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-purple-950 to-slate-950 pb-24 text-white">
        <div className="bg-slate-900/50 backdrop-blur-md p-4 shadow-lg border-b border-white/10 sticky top-0 z-10">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-500 flex items-center gap-2">
            <Sparkles className="text-yellow-400 w-6 h-6" /> Celestial Chat
          </h1>
        </div>

        <div className="p-4 max-w-4xl mx-auto space-y-8">
          {/* Online Astrologers Section */}
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
            <h2 className="text-lg font-bold text-amber-200 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></span>
              Online Mystics
            </h2>
            <OnlineAstrologersWrapper />
          </div>

          {/* Offers Section */}
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
             <OffersList />
          </div>

          {/* History Section */}
          {user ? (
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
              <h2 className="text-lg font-bold text-amber-200 mb-4">Your Cosmic Conversations</h2>
              {loadingHistory ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400"></div>
                </div>
              ) : (
                <ChatHistoryList sessions={chatSessions} />
              )}
            </div>
          ) : (
            <div className="mt-8 p-8 bg-white/5 rounded-2xl text-center border border-white/10 backdrop-blur-sm">
              <Star className="w-12 h-12 text-amber-400 mx-auto mb-4 opacity-50" />
              <p className="text-gray-300 mb-6 text-lg">
                Login to view your chat history and consult with top astrologers.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-full font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all transform hover:scale-105"
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
    <div className="h-screen flex flex-col bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-purple-950 to-slate-950">
      {/* Header */}
      <div className="bg-slate-900/80 backdrop-blur-md p-4 shadow-lg border-b border-white/10 flex justify-between items-center text-white z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/chat/0')} className="p-2 hover:bg-white/10 rounded-full text-amber-200 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-500">
              Cosmic Session
            </h2>
            {isTyping ? (
              <p className="text-xs text-purple-300 italic animate-pulse">Astrologer is typing...</p>
            ) : (
              <p className="text-xs text-green-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Live
              </p>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="bg-white/10 px-3 py-1 rounded-lg border border-white/5 backdrop-blur-sm">
             <p className="text-amber-300 font-mono text-sm">
              {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
            </p>
            <p className="text-xs text-gray-400">₹{cost.toFixed(2)}</p>
          </div>
        </div>
        <button
          onClick={endChat}
          className="ml-4 bg-red-500/20 text-red-400 border border-red-500/50 px-4 py-2 rounded-lg hover:bg-red-500 hover:text-white font-bold text-sm transition-all"
        >
          End Chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-transparent scrollbar-thin scrollbar-thumb-purple-600 scrollbar-track-transparent">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-md p-4 rounded-2xl shadow-lg backdrop-blur-sm ${
                msg.senderId === user.id
                  ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-tr-none border border-purple-400/30'
                  : 'bg-slate-800/80 text-gray-100 rounded-tl-none border border-slate-600/50'
              }`}
            >
              {msg.type === 'audio' ? (
                <AudioMessage audio={msg.audio || msg.mediaUrl} duration={msg.duration} isOwn={msg.senderId === user.id} />
              ) : (
                <p className="leading-relaxed text-[15px]">{msg.text}</p>
              )}
              <span className={`text-[10px] block text-right mt-2 ${msg.senderId === user.id ? 'text-purple-200' : 'text-gray-400'}`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Voice Recording Preview */}
      {audioBlob && !isRecording && (
        <div className="px-4 py-3 bg-slate-900/90 border-t border-white/10 flex items-center gap-3 backdrop-blur-md">
          <div className="flex-1 flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
               <Mic className="text-purple-400" size={16} />
            </div>
            <span className="text-sm text-gray-300">Voice message ready ({recordingTime}s)</span>
          </div>
          <button
            onClick={sendVoiceMessage}
            className="bg-purple-600 text-white px-6 py-2 rounded-full hover:bg-purple-700 font-semibold shadow-lg shadow-purple-900/50"
          >
            Send
          </button>
          <button
            onClick={cancelRecording}
            className="text-gray-400 hover:text-white px-4 py-2"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 bg-slate-900/90 border-t border-white/10 backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex gap-3 items-center">
          {isRecording ? (
            <div className="flex-1 flex items-center gap-3 bg-red-950/30 px-4 py-3 rounded-2xl border border-red-500/30 animate-pulse">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-red-400 font-semibold tracking-wide">Recording... {recordingTime}s</span>
              <button
                type="button"
                onClick={stopRecording}
                className="ml-auto bg-red-500 text-white p-2 rounded-full hover:bg-red-600 shadow-lg"
              >
                <Square size={16} fill="currentColor" />
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={startRecording}
                className="bg-slate-800 text-purple-400 p-3 rounded-full hover:bg-slate-700 hover:text-purple-300 transition-all border border-slate-700"
              >
                <Mic size={20} />
              </button>
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    handleTyping();
                  }}
                  className="w-full p-3 pl-4 pr-12 bg-slate-800/50 border border-slate-700 rounded-full text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 placeholder-gray-500 transition-all"
                  placeholder="Type your message..."
                />
              </div>
              <button
                type="submit"
                disabled={!message.trim()}
                className={`p-3 rounded-full transition-all transform ${
                  message.trim()
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:scale-105 shadow-lg shadow-purple-900/50'
                    : 'bg-slate-800 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Send size={20} className={message.trim() ? 'ml-0.5' : ''} />
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
};

// Audio Message Component
const AudioMessage = ({ audio, duration, isOwn }) => {
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
    <div className="flex items-center gap-3 min-w-[200px]">
      <button
        onClick={togglePlay}
        className={`p-2 rounded-full transition-colors ${
          isOwn ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400'
        }`}
      >
        {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
      </button>
      <div className="flex-1">
        <div className={`h-1 rounded-full overflow-hidden ${isOwn ? 'bg-white/20' : 'bg-gray-600'}`}>
          <div
            className={`h-full w-0 transition-all duration-200 ${isOwn ? 'bg-white' : 'bg-purple-500'}`}
            id="progress"
            style={{ width: isPlaying ? '100%' : '0%', transitionDuration: `${duration}s`, transitionTimingFunction: 'linear' }}
          ></div>
        </div>
        <span className={`text-[10px] mt-1 block ${isOwn ? 'text-purple-200' : 'text-gray-400'}`}>{duration}s</span>
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
