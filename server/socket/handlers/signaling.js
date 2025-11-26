const CallLog = require('../../models/CallLog');
const ActiveCall = require('../../models/ActiveCall');

/**
 * Signaling Socket Handlers
 * Handles WebRTC signaling events
 */

module.exports = (io, socket) => {

    // User joins a room
    socket.on('join', (identifier) => {
        socket.join(identifier);
        console.log(`User ${socket.id} joined ${identifier}`);
    });

    // Initiate call
    socket.on('callUser', ({ userToCall, signalData, from, name, type, callId }) => {
        console.log(`Call from ${from} to ${userToCall}, type: ${type}`);
        io.to(userToCall).emit('callUser', {
            signal: signalData,
            from,
            name,
            type,
            callId
        });
    });

    // Answer call
    socket.on('answerCall', async (data) => {
        try {
            console.log('Answer call received:', data);
            const { to, callId } = data;

            io.to(to).emit('callAccepted', { accepted: true, callId });

            // Update CallLog with accepted time
            if (callId) {
                const acceptedTime = new Date();

                await CallLog.findByIdAndUpdate(callId, {
                    status: 'active',
                    acceptedTime
                });

                // Create ActiveCall for server-side tracking
                const callLog = await CallLog.findById(callId);
                if (callLog) {
                    const activeCall = new ActiveCall({
                        callId: callLog._id,
                        callerId: callLog.callerId,
                        receiverId: callLog.receiverId,
                        startTime: callLog.startTime,
                        acceptedTime,
                        status: 'active',
                        rate: 1 // ₹1 per minute
                    });
                    await activeCall.save();

                    console.log(`Call ${callId} accepted and tracked`);
                }
            }
        } catch (err) {
            console.error('Error in answerCall:', err);
        }
    });

    // Reject call
    socket.on('rejectCall', (data) => {
        const { to } = data;
        io.to(to).emit('callRejected');
        console.log(`Call rejected to ${to}`);
    });

    // End call
    socket.on('endCall', async ({ to, callId }) => {
        try {
            io.to(to).emit('callEnded');

            // Mark ActiveCall as ended
            if (callId) {
                await ActiveCall.findOneAndUpdate(
                    { callId },
                    { status: 'ended' }
                );
            }

            console.log(`Call ${callId} ended`);
        } catch (err) {
            console.error('Error in endCall:', err);
        }
    });

    // WebRTC ICE candidate
    socket.on('webrtc_ice_candidate', (data) => {
        const { to, candidate } = data;
        io.to(to).emit('webrtc_ice_candidate', { candidate });
    });

    // WebRTC offer
    socket.on('webrtc_offer', (data) => {
        const { to, offer } = data;
        io.to(to).emit('webrtc_offer', { offer });
    });

    // WebRTC answer
    socket.on('webrtc_answer', (data) => {
        const { to, answer } = data;
        io.to(to).emit('webrtc_answer', { answer });
    });
};
