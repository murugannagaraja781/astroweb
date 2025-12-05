import React, { useState } from 'react';
import AgoraRTC, { AgoraRTCProvider, useRTCClient } from 'agora-rtc-react';
import apiClient from '../utils/apiClient';

const APP_ID = "d95d4af1ea6443bcb59fed8386d71c75";

const AgoraTester = () => {
    const [token, setToken] = useState('');
    const [channel, setChannel] = useState('test_channel');
    const [status, setStatus] = useState('idle');
    const [logs, setLogs] = useState([]);
    const [uid, setUid] = useState(0);

    const client = useRTCClient(AgoraRTC.createClient({ codec: 'vp8', mode: 'rtc' }));

    const addLog = (msg) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);

    const fetchToken = async () => {
        try {
            addLog('Fetching token...');
            // Random UID
            const tempUid = Math.floor(Math.random() * 100000);
            setUid(tempUid);

            const res = await apiClient.get(`/api/agora/token?channel=${channel}&uid=${tempUid}`);
            setToken(res.data.token);
            addLog(`Token received: ${res.data.token.slice(0, 10)}...`);
        } catch (err) {
            addLog(`Error fetching token: ${err.message}`);
        }
    };

    const joinChannel = async () => {
        if (!token) {
            addLog('No token! Fetch token first.');
            return;
        }
        try {
            addLog(`Joining channel '${channel}' with UID ${uid}...`);
            await client.join(APP_ID, channel, token, uid);
            addLog('Successfully joined channel!');
            setStatus('connected');

            // Publish dummy track if needed, or just connection check
            // const tracks = await AgoraRTC.createMicrophoneAndCameraTracks();
            // await client.publish(tracks);
            // addLog('Tracks published');

        } catch (err) {
            addLog(`Join failed: ${err.message}`);
            // Check specific codes
            if (err.code === 'INVALID_TOKEN' || err.message.includes('invalid token')) {
                 addLog('CRITICAL: Token is invalid. Likely Cert/AppID mismatch between Client and Server.');
            }
        }
    };

    const leaveChannel = async () => {
        await client.leave();
        setStatus('idle');
        addLog('Left channel');
    };

    return (
        <div className="p-8 bg-slate-900 text-white min-h-screen">
            <h1 className="text-2xl font-bold mb-4">Agora Connection Tester</h1>
            <div className="mb-4">
                <p><strong>App ID:</strong> {APP_ID}</p>
                <div className="flex gap-2 mt-2">
                    <input
                        value={channel}
                        onChange={e => setChannel(e.target.value)}
                        className="text-black px-2 py-1 rounded"
                    />
                    <button onClick={fetchToken} className="bg-blue-600 px-4 py-1 rounded">1. Get Token</button>
                    <button onClick={joinChannel} className="bg-green-600 px-4 py-1 rounded">2. Join</button>
                    <button onClick={leaveChannel} className="bg-red-600 px-4 py-1 rounded">Leave</button>
                </div>
            </div>

            <div className="bg-black p-4 rounded font-mono text-xs h-96 overflow-auto border border-gray-700">
                {logs.map((L, i) => <div key={i}>{L}</div>)}
            </div>

            {status === 'connected' && (
                <div className="mt-4 p-4 bg-green-900/50 rounded text-center">
                    CONNECTED! <br/>
                    The App ID and Refresh Token logic are WORKING.
                </div>
            )}
        </div>
    );
};

export default function AgoraTestPage() {
    return (
        <AgoraRTCProvider client={AgoraRTC.createClient({ codec: 'vp8', mode: 'rtc' })}>
            <AgoraTester />
        </AgoraRTCProvider>
    );
}
