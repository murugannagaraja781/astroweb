import { useEffect, useState, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { Send, Mic, Square, Play, Pause } from 'lucide-react';

const socket = io('https://astroweb-y0i6.onrender.com');

const Chat = () => {
  const { id: receiverId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [balance, setBalance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [cost, setCost] = useState(0);
  const rate = 5; // Chat rate per minute (cheaper than video)
  const timerRef = useRef(null);
  const [chatActive, setChatActive] = useState(true);
  const [chatId, setChatId] = useState(null);

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!user || !receiverId) return;

    // Fetch wallet balance
    const fetchBalance = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/wallet/balance`);
        setBalance(res.data.balance);
      } catch (err) {
        console.error("Failed to fetch balance", err);
      }
    };
    fetchBalance();

    // Initiate Chat Session for Billing (Client Only)
    const initChat = async () => {
      if (user && user.role === 'client') {
        try {
          const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/call/initiate`, { receiverId, type: 'chat' });
          setChatId(res.data.callId);
        } catch (err) {
          console.error("Failed to initiate chat billing", err);
          alert("Insufficient balance or error starting chat");
          navigate('/dashboard');
        }
      }
    };
    initChat();

    // Join chat room - FIXED: Use consistent room ID
    const roomId = [user.id, receiverId].sort().join('-');
    console.log('Joining room:', roomId);
    socket.emit('join', roomId);

    // Listen for messages
    const handleReceiveMessage = (msg) => {
      console.log('Message received:', msg);
      setMessages(prev => [...prev, msg]);
    };

    socket.on('receiveMessage', handleReceiveMessage);

    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
      clearInterval(timerRef.current);
    };
  }, [user, receiverId, navigate]);

  // Billing Timer
  useEffect(() => {
    const numericBalance = Number(balance) || 0;
    const numericRate = Number(rate) || 0;

    if (chatActive && numericBalance > 0 && chatId) {
      const maxDuration = (numericBalance / numericRate) * 60;

      timerRef.current = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1;
          if (newDuration >= maxDuration) {
            endChat();
            alert("Chat ended due to insufficient balance.");
            return prev;
          }
          return newDuration;
        });
        setCost(prev => prev + (numericRate / 60));
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [chatActive, balance, chatId]);

  // Typing Indicator Logic
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  const handleTyping = () => {
    const roomId = [user.id, receiverId].sort().join('-');
    socket.emit('typing', { roomId, name: user.name });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stopTyping', { roomId });
    }, 2000);
  };

  useEffect(() => {
    socket.on('displayTyping', (data) => {
      if (data.name !== user.name) {
        setIsTyping(true);
      }
    });
    socket.on('hideTyping', () => {
      setIsTyping(false);
    });

    return () => {
      socket.off('displayTyping');
      socket.off('hideTyping');
    };
  }, [user]);

  const sendMessage = (e) => {
    e.preventDefault();
    const roomId = [user.id, receiverId].sort().join('-');

    if (message.trim() && roomId) {
      const msgData = {
        roomId: roomId,
        senderId: user.id,
        text: message,
        timestamp: new Date(),
        type: 'text'
      };
      console.log('Sending message:', msgData);
      socket.emit('sendMessage', msgData);
      // Optimistically adding the message locally caused duplicate entries because the server broadcasts the same message back.
      // Rely on the 'receiveMessage' listener to update the UI.
      setMessage('');
      socket.emit('stopTyping', { roomId });
    }
  };

  // Voice Recording Functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const audioChunks = [];
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Recording timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not access microphone. Please grant permission.');
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
    if (!audioBlob) return;

    const roomId = [user.id, receiverId].sort().join('-');
    const reader = new FileReader();

    reader.onloadend = () => {
      const base64Audio = reader.result;
      const msgData = {
        roomId: roomId,
        senderId: user.id,
        audio: base64Audio,
        duration: recordingTime,
        timestamp: new Date(),
        type: 'audio'
      };

      console.log('Sending voice message');
      socket.emit('sendMessage', msgData);
      // Do not add the voice message locally to avoid duplication; it will be received via the socket listener.
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
    if (chatId) {
      try {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/call/end`, { callId: chatId, duration });
        alert(`Chat ended. Cost: ₹${cost.toFixed(2)}`);
      } catch (err) {
        console.error(err);
      }
    }

    if (user?.role === 'astrologer') {
      navigate('/astrologer-dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-orange-50">
      {/* Header */}
      <div className="bg-orange-600 p-4 shadow flex justify-between items-center text-white">
        <div>
          <h2 className="text-xl font-bold">Chat Session</h2>
          {isTyping && <p className="text-sm text-orange-200 italic">Typing...</p>}
        </div>
        <div className="text-right">
          <p className="text-orange-100">Time: {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}</p>
          <p className="text-orange-100">Cost: ₹{cost.toFixed(2)}</p>
        </div>
        <button onClick={endChat} className="bg-white text-orange-600 px-4 py-2 rounded hover:bg-orange-100 font-bold">
          End Chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.isMe || msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs p-3 rounded-lg ${msg.isMe || msg.senderId === user.id ? 'bg-orange-600 text-white' : 'bg-white text-gray-800 shadow'}`}>
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
