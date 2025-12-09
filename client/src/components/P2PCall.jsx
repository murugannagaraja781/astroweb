
import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import SimplePeer from 'simple-peer';

import { Buffer } from 'buffer';

// Polyfills for simple-peer in Vite environment
if (typeof window !== 'undefined') {
  window.global = window;
  window.process = { env: { NODE_ENV: 'development' } };
  window.Buffer = Buffer;
}

// ExpressTurn STUN/TURN configuration
const ICE_SERVERS = [
  // Google STUN – safe fallback
  { urls: 'stun:stun.l.google.com:19302' },
  // ExpressTurn STUN
  { urls: 'stun:relay1.expressturn.com:3478' },
  // ExpressTurn TURN – UDP + TCP
  {
    urls: [
      'turn:relay1.expressturn.com:3478?transport=udp',
      'turn:relay1.expressturn.com:3478?transport=tcp'
    ],
    username: '000000002080531845',
    credential: 'q4Z3wtKwfadKoxJ5dU7ghrlTmSc='
  }
];

const P2PCall = () => {
  const [socket, setSocket] = useState(null);
  const [myUserId, setMyUserId] = useState(null);
  const [name, setName] = useState('');
  const [targetUserId, setTargetUserId] = useState('');
  const [status, setStatus] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [currentSession, setCurrentSession] = useState(null);
  const [typing, setTyping] = useState(false);
  const [isTypingRemote, setIsTypingRemote] = useState(false);
  const [timer, setTimer] = useState('00:00');
  const [isRecording, setIsRecording] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const chatBoxRef = useRef(null);

  // Refs for items that are needed inside callbacks without dependency loops
  const currentSessionRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const pendingSignalsRef = useRef([]);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const typingTimeoutRef = useRef(null);

  // Initialize Socket
  useEffect(() => {
    // Connect to server - assuming standard path or configured proxy
    // If you have a specific URL, replace '/' with it, e.g., 'http://localhost:8080'
    const newSocket = io('/', {
      transports: ['websocket', 'polling'],
      // Standardize query if needed, but this component uses custom 'register' event
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Socket Event Listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('connect', () => {
      appendStatus(`Socket connected: ${socket.id}`);

      const savedUserId = localStorage.getItem('p2pUserId');
      const savedName = localStorage.getItem('p2pName');
      if (savedName) setName(savedName);

      if (savedName && savedUserId) {
        socket.emit('register', { name: savedName, existingUserId: savedUserId }, (res) => {
          if (res.ok) {
            setMyUserId(res.userId);
            appendStatus('Re-registered with existing ID.');
          } else {
            appendStatus(`Auto register failed: ${res.error}`);
          }
        });
      }
    });

    socket.on('register', (data) => {
      // Not processed here, usually callback
    });

    socket.on('incoming-session', (data) => {
      const { sessionId, fromUserId, type } = data;
      console.log('Incoming session:', data);

      if (currentSessionRef.current) {
        socket.emit('answer-session', {
          sessionId,
          toUserId: fromUserId,
          type,
          accept: false
        });
        appendStatus(`Rejected incoming ${type} from ${fromUserId} (Busy)`);
        return;
      }

      const ok = window.confirm(`Incoming ${type} request from ${fromUserId}. Accept?`);

      socket.emit('answer-session', {
        sessionId,
        toUserId: fromUserId,
        type,
        accept: ok
      });

      if (!ok) {
        appendStatus(`Rejected ${type} from ${fromUserId}`);
        return;
      }

      initializeSession({
        id: sessionId,
        type,
        partnerUserId: fromUserId
      });
      appendStatus(`Accepted ${type} session from ${fromUserId}`);

      if (type === 'audio' || type === 'video') {
         createPeer(false, type, socket, sessionId, fromUserId);
      } else if (type === 'chat') {
         startTimer();
      }
    });

    socket.on('session-answered', (data) => {
      const { sessionId, fromUserId, type, accept } = data;
      if (!currentSessionRef.current || currentSessionRef.current.id !== sessionId) return;

      if (!accept) {
        appendStatus(`${type} session rejected by ${fromUserId}`);
        resetSession(false);
        return;
      }

      appendStatus(`${type} session accepted by ${fromUserId}`);
      if (type === 'chat') startTimer();
    });

    socket.on('signal', (data) => {
      const { sessionId, fromUserId, signal } = data;
      if (!currentSessionRef.current || currentSessionRef.current.id !== sessionId) return;

      if (!peerRef.current) {
        pendingSignalsRef.current.push(signal);
      } else {
        peerRef.current.signal(signal);
      }
    });

    socket.on('chat-message', (data) => {
      const { fromUserId, content, sessionId, timestamp, messageId } = data;
      if (!currentSessionRef.current || currentSessionRef.current.id !== sessionId) return;

      addMessage({ from: fromUserId, isMe: false, content, timestamp, messageId });
      socket.emit('message-delivered', { toUserId: fromUserId, messageId });
    });

    socket.on('message-status', (data) => {
       const { messageId, status } = data;
       setMessages(prev => prev.map(m =>
         m.messageId === messageId ? { ...m, status } : m
       ));
    });

    socket.on('typing', (data) => {
       const { fromUserId, isTyping } = data;
       if (currentSessionRef.current && currentSessionRef.current.partnerUserId === fromUserId) {
         setIsTypingRemote(isTyping);
       }
    });

    socket.on('session-ended', (data) => {
      const { sessionId, fromUserId, type, durationMs } = data;
      if (currentSessionRef.current && currentSessionRef.current.id === sessionId) {
         stopTimer();
         appendStatus(`Session ended by ${fromUserId}. Duration: ${formatDuration(durationMs || 0)}`);
         resetSession(false);
      }
    });

    return () => {
      socket.off('connect');
      socket.off('incoming-session');
      socket.off('session-answered');
      socket.off('signal');
      socket.off('chat-message');
      socket.off('message-status');
      socket.off('typing');
      socket.off('session-ended');
    };
  }, [socket]);

  // Use refs to keep track of session state inside standard functions
  useEffect(() => {
     currentSessionRef.current = currentSession;
  }, [currentSession]);

  const appendStatus = (text) => {
    setStatus(prev => `${prev}\n[${new Date().toLocaleTimeString()}] ${text}`);
  };

  const registerUser = () => {
     if (!name.trim()) return alert('Enter name');
     const existingUserId = localStorage.getItem('p2pUserId');

     socket.emit('register', { name, existingUserId }, (res) => {
        if (res.ok) {
           setMyUserId(res.userId);
           localStorage.setItem('p2pUserId', res.userId);
           localStorage.setItem('p2pName', name);
           appendStatus(`Registered as ${name} (${res.userId})`);
        } else {
           alert('Register failed: ' + res.error);
        }
     });
  };

  const startSession = (type) => {
    if (!myUserId) return alert('Register first');
    if (currentSession) return alert('Already in a session');
    if (!targetUserId) return alert('Enter target User ID');

    socket.emit('request-session', { toUserId: targetUserId, type }, (res) => {
       if (res.ok) {
          initializeSession({
             id: res.sessionId,
             type,
             partnerUserId: targetUserId
          });
          appendStatus(`Requesting ${type} session with ${targetUserId}...`);

          if (type === 'audio' || type === 'video') {
             createPeer(true, type, socket, res.sessionId, targetUserId);
          }
       } else {
          appendStatus(`Request failed: ${res.error} (${res.code})`);
       }
    });
  };

  const initializeSession = (sessionData) => {
    const session = { ...sessionData, startTime: null };
    setCurrentSession(session);
    setMessages([]);
    pendingSignalsRef.current = [];
  };

  const createPeer = async (initiator, type, socketInstance, sessionId, partnerId) => {
    try {
      const constraints = type === 'audio' ? { audio: true, video: false } : { audio: true, video: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      if (localVideoRef.current) {
         localVideoRef.current.srcObject = stream;
      }

      const peer = new SimplePeer({
        initiator,
        trickle: false,
        stream,
        config: { iceServers: ICE_SERVERS, iceTransportPolicy: 'all' }
      });

      peerRef.current = peer;

      // Flush pending signals
      if (pendingSignalsRef.current.length > 0) {
         pendingSignalsRef.current.forEach(sig => peer.signal(sig));
         pendingSignalsRef.current = [];
      }

      peer.on('signal', (data) => {
         socketInstance.emit('signal', {
           sessionId,
           toUserId: partnerId,
           signal: data
         });
      });

      peer.on('stream', (remoteStream) => {
         if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
         }
      });

      peer.on('connect', () => {
         appendStatus('WebRTC Connected');
         startTimer();
      });

      peer.on('error', err => appendStatus(`Peer Error: ${err.message}`));

    } catch (err) {
      appendStatus(`Media Access Error: ${err.message}`);
      console.error(err);
    }
  };

  const resetSession = (notifyRemote) => {
     if (!currentSessionRef.current) return;
     const dur = stopTimer();

     if (notifyRemote && socket) {
        socket.emit('session-ended', {
           sessionId: currentSessionRef.current.id,
           toUserId: currentSessionRef.current.partnerUserId,
           type: currentSessionRef.current.type,
           durationMs: dur
        });
     }

     if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
     }
     if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
     }
     if (localVideoRef.current) localVideoRef.current.srcObject = null;
     if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

     setCurrentSession(null);
     setIsTypingRemote(false);
  };

  // Timer Logic
  const startTimer = () => {
     if (currentSessionRef.current) {
        currentSessionRef.current.startTime = Date.now();
        // Clear existing interval if any (managed by a separate useEffect usually, but here doing functional)
        if (currentSessionRef.current.interval) clearInterval(currentSessionRef.current.interval);

        currentSessionRef.current.interval = setInterval(() => {
           if (!currentSessionRef.current || !currentSessionRef.current.startTime) return;
           const diff = Date.now() - currentSessionRef.current.startTime;
           setTimer(formatDuration(diff));
        }, 1000);
     }
  };

  const stopTimer = () => {
    if (currentSessionRef.current && currentSessionRef.current.interval) {
       clearInterval(currentSessionRef.current.interval);
       currentSessionRef.current.interval = null;
    }
    const end = Date.now();
    const start = currentSessionRef.current ? currentSessionRef.current.startTime : end;
    setTimer('00:00');
    return end - (start || end);
  };

  const formatDuration = (ms) => {
    if (!ms) return '00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Chat Logic
  const sendMessage = () => {
     if (! inputText.trim() || !currentSession) return;
     const messageId = `m-${Date.now()}-${Math.random().toString(36).slice(2)}`;
     const content = { type: 'text', text: inputText };
     const ts = Date.now();

     socket.emit('chat-message', {
        toUserId: currentSession.partnerUserId,
        sessionId: currentSession.id,
        content,
        timestamp: ts,
        messageId
     });

     addMessage({ from: 'Me', isMe: true, content, timestamp: ts, messageId, status: 'sent' });
     setInputText('');
     handleTyping(false);
  };

  const addMessage = (msg) => {
     setMessages(prev => [...prev, msg]);
     // Scroll to bottom
     setTimeout(() => {
       if (chatBoxRef.current) chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
     }, 100);
  };

  // Typing
  const handleTyping = (isTyping) => {
     if (!socket || !currentSession) return;
     socket.emit('typing', { toUserId: currentSession.partnerUserId, isTyping });
  };

  const onInputChange = (e) => {
     setInputText(e.target.value);
     if (!typing) {
        setTyping(true);
        handleTyping(true);
     }
     if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
     typingTimeoutRef.current = setTimeout(() => {
        setTyping(false);
        handleTyping(false);
     }, 1200);
  };

  // File Upload
  const handleFileUpload = async (e) => {
     const file = e.target.files[0];
     if (!file || !currentSession) return;

     // NOTE: File upload requires server endpoint '/upload' in original code.
     // Assuming that exists or we Mock it. Since user provided server code has '/upload', it should work.
     // However, we need to handle the upload properly.

     const fd = new FormData();
     fd.append('file', file);

     try {
       const res = await fetch('/upload', { method: 'POST', body: fd });
       // Note: This fetch assumes proxy is set up or relative path works.
       const json = await res.json();

       if (json.ok) {
           const messageId = `m-${Date.now()}-${Math.random()}`;
           const content = {
              type: 'file',
              url: json.url,
              mimeType: json.mimeType,
              name: json.originalName
           };

           socket.emit('chat-message', {
             toUserId: currentSession.partnerUserId,
             sessionId: currentSession.id,
             content,
             timestamp: Date.now(),
             messageId
           });

           addMessage({ from: 'Me', isMe: true, content, timestamp: Date.now(), messageId, status: 'sent' });
       } else {
         alert('Upload failed');
       }
     } catch (err) {
       console.error(err);
       alert('Upload error');
     }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto font-sans">
      <h2 className="text-2xl font-bold mb-4">P2P C-A-V Session</h2>

      {/* Registration */}
      <div className="mb-4 bg-gray-100 p-2 rounded">
         <div className="flex gap-2 items-center mb-2">
            <input
              className="border p-1 rounded"
              placeholder="Your Name"
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <button
              className="bg-green-600 text-white px-3 py-1 rounded"
              onClick={registerUser}
            >
              Register
            </button>
         </div>
         <div>
            Your ID: <span className="font-mono font-bold text-green-800">{myUserId || 'Not Registered'}</span>
         </div>
      </div>

      {/* Controls */}
      <div className="mb-4 p-2 border rounded">
         <div className="flex gap-2 mb-2">
            <input
               className="border p-1 w-64 rounded"
               placeholder="Target User ID"
               value={targetUserId}
               onChange={e => setTargetUserId(e.target.value)}
            />
         </div>
         <div className="flex gap-2">
            <button className="bg-blue-500 text-white px-3 py-1 rounded" onClick={() => startSession('chat')}>Start Chat</button>
            <button className="bg-purple-500 text-white px-3 py-1 rounded" onClick={() => startSession('audio')}>Start Audio</button>
            <button className="bg-red-500 text-white px-3 py-1 rounded" onClick={() => startSession('video')}>Start Video</button>
            <button className="bg-gray-700 text-white px-3 py-1 rounded" onClick={() => resetSession(true)}>End Session</button>
         </div>
      </div>

      {/* Status & Timer */}
      <div className="mb-4">
         <div className="whitespace-pre-wrap bg-gray-50 border p-2 h-24 overflow-y-auto text-sm">
            {status}
         </div>
         {isTypingRemote && <div className="text-purple-600 text-sm animate-pulse">User is typing...</div>}
         <div className="font-bold text-blue-800 mt-2">
            Timer: {timer}
         </div>
      </div>

      {/* Video Area */}
      <div className="flex gap-2 mb-4">
         <div className="w-1/2 bg-black h-64 relative">
             <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-contain" />
             <span className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1">Local</span>
         </div>
         <div className="w-1/2 bg-black h-64 relative">
             <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-contain" />
             <span className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1">Remote</span>
         </div>
      </div>

      {/* Chat Area */}
      <div className="border rounded p-2">
         <div ref={chatBoxRef} className="h-64 overflow-y-auto bg-white mb-2 p-2 border">
            {messages.map((m, i) => (
               <div key={i} className={`mb-2 ${m.isMe ? 'text-right' : 'text-left'}`}>
                  <div className="text-xs text-gray-500 mb-1">
                     {new Date(m.timestamp).toLocaleTimeString()} - {m.isMe ? 'Me' : 'Partner'}
                  </div>
                  <div className={`inline-block p-2 rounded ${m.isMe ? 'bg-green-100' : 'bg-gray-100'}`}>
                     {m.content.type === 'text' && <span>{m.content.text}</span>}
                     {m.content.type === 'file' && (
                        <div>
                           {m.content.mimeType?.startsWith('image/') ? (
                             <img src={m.content.url} alt="Shared" className="max-w-[150px]" />
                           ) : (
                             <a href={m.content.url} target="_blank" rel="noreferrer" className="text-blue-600 underline">Download {m.content.name}</a>
                           )}
                        </div>
                     )}
                     {m.content.type === 'audio' && (
                        <audio controls src={m.content.url} />
                     )}
                  </div>
                  {m.isMe && <div className="text-[10px] text-gray-400">{m.status || '...'}</div>}
               </div>
            ))}
         </div>
         <div className="flex gap-2">
            <input
               className="border flex-1 p-2 rounded"
               placeholder="Type message..."
               value={inputText}
               onChange={onInputChange}
               onKeyDown={e => e.key === 'Enter' && sendMessage()}
            />
            <button className="bg-green-600 text-white px-4 rounded" onClick={sendMessage}>Send</button>
            <input type="file" className="w-24 text-xs" onChange={handleFileUpload} />
         </div>
      </div>
    </div>
  );
};

export default P2PCall;
