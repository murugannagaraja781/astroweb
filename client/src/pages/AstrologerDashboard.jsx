import { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

const socket = io('http://localhost:9001');

const AstrologerDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    languages: '', specialties: '', ratePerMinute: 10, bio: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get('http://localhost:9001/api/astrologer/profile');
      setProfile(res.data);
      setFormData({
        languages: res.data.languages.join(','),
        specialties: res.data.specialties.join(','),
        ratePerMinute: res.data.ratePerMinute,
        bio: res.data.bio
      });
    } catch (err) {
      console.error(err);
    }
  };

  const toggleStatus = async () => {
    try {
      const res = await axios.put('http://localhost:9001/api/astrologer/status');
      setProfile(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    try {
      await axios.put('http://localhost:9001/api/astrologer/profile', {
        ...formData,
        languages: formData.languages.split(','),
        specialties: formData.specialties.split(',')
      });
      fetchProfile();
      alert('Profile updated');
    } catch (err) {
      console.error(err);
      alert('Failed to update profile');
    }
  };

  // Socket & Incoming Call Logic
  const [incomingCall, setIncomingCall] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!profile) return;

    socket.emit('join', profile.userId);

    socket.on('callUser', (data) => {
      console.log("Incoming call data:", data);
      setIncomingCall(data);
    });

    return () => socket.off('callUser');
  }, [profile]);

  const acceptCall = () => {
    if (!incomingCall) {
      console.error('No incoming call data');
      return;
    }

    if (!incomingCall.from) {
      console.error('Missing caller ID in incoming call:', incomingCall);
      alert('Error: Missing caller information. Please ask them to try again.');
      setIncomingCall(null);
      return;
    }

    console.log('Accepting call/chat:', incomingCall);
    console.log('Sending answerCall to:', incomingCall.from);

    // Notify caller that call is accepted
    socket.emit('answerCall', { to: incomingCall.from });

    // Close the modal
    setIncomingCall(null);

    if (incomingCall.type === 'chat') {
        navigate(`/chat/${incomingCall.from}`);
    } else {
        // Video call
        navigate(`/call/${incomingCall.from}?callId=${incomingCall.callId}`);
    }
  };

  if (!profile) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-4">
      {incomingCall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-2xl text-center">
            <h2 className="text-2xl font-bold mb-4 text-black">Incoming {incomingCall.type === 'chat' ? 'Chat' : 'Call'}</h2>
            <p className="mb-6 text-lg text-gray-700">{incomingCall.name} is requesting {incomingCall.type === 'chat' ? 'to chat' : 'a video call'}...</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={acceptCall}
                className="bg-green-500 text-white px-6 py-3 rounded-full font-bold hover:bg-green-600 animate-pulse"
              >
                Accept
              </button>
              <button
                onClick={() => {
                  socket.emit('rejectCall', { to: incomingCall.from });
                  setIncomingCall(null);
                }}
                className="bg-red-500 text-white px-6 py-3 rounded-full font-bold hover:bg-red-600"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      <h1 className="text-2xl font-bold mb-4">Astrologer Dashboard</h1>

      <div className="bg-white p-6 rounded shadow mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Status: <span className={profile.isOnline ? 'text-green-500' : 'text-red-500'}>{profile.isOnline ? 'Online' : 'Offline'}</span></h2>
        </div>
        <button onClick={toggleStatus} className={`px-4 py-2 rounded text-white ${profile.isOnline ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}>
          {profile.isOnline ? 'Go Offline' : 'Go Online'}
        </button>
      </div>

      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-4">Update Profile</h2>
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-gray-700">Languages</label>
            <input type="text" name="languages" value={formData.languages} onChange={onChange} className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="block text-gray-700">Specialties</label>
            <input type="text" name="specialties" value={formData.specialties} onChange={onChange} className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="block text-gray-700">Rate Per Minute (₹)</label>
            <input type="number" name="ratePerMinute" value={formData.ratePerMinute} onChange={onChange} className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="block text-gray-700">Bio</label>
            <textarea name="bio" value={formData.bio} onChange={onChange} className="w-full p-2 border rounded h-32"></textarea>
          </div>
          <button type="submit" className="bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700">Update Profile</button>
        </form>
      </div>
    </div>
  );
};

export default AstrologerDashboard;
