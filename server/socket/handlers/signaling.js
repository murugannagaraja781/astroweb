const CallLog = require('../../models/CallLog');
const ActiveCall = require('../../models/ActiveCall');
const Wallet = require('../../models/Wallet');

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
                    // Create ActiveCall entry
                    const activeCall = new ActiveCall({
                        callId: callLog._id,
                        callerId: callLog.callerId,
                        receiverId: callLog.receiverId,
                        startTime: callLog.startTime,
                        acceptedTime,
                        status: 'active',
                        rate: 1, // ₹1 per minute
                        prepaid: 0
                    });
                    await activeCall.save();

                    // Immediately debit ₹1 from caller as accept precharge
                    const callerWallet = await Wallet.findOne({ userId: callLog.callerId });
                    if (callerWallet && callerWallet.balance >= 1) {
                        callerWallet.balance -= 1;
                        callerWallet.transactions.push({
                            amount: 1,
                            type: 'debit',
                            description: 'Initial call charge on accept',
                            date: new Date()
                        });
                        await callerWallet.save();

                        // Update ActiveCall prepaid
                        activeCall.prepaid = 1;
                        await activeCall.save();
                    }

                    console.log(`Call ${callId} accepted, initial ₹1 charged`);
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

    // ===== NEW: Video Call Handlers =====
    // Video call offer
    socket.on('call:offer', ({ toSocketId, offer }) => {
        console.log(`[Video Call] Offer from ${socket.id} to ${toSocketId}`);
        io.to(toSocketId).emit('call:offer', {
            fromSocketId: socket.id,
            offer
        });
    });

    // Video call answer
    socket.on('call:answer', ({ toSocketId, answer }) => {
        console.log(`[Video Call] Answer from ${socket.id} to ${toSocketId}`);
        io.to(toSocketId).emit('call:answer', {
            fromSocketId: socket.id,
            answer
        });
    });

    // Video call ICE candidate
    socket.on('call:candidate', ({ toSocketId, candidate }) => {
        console.log(`[Video Call] Candidate from ${socket.id} to ${toSocketId}`);
        io.to(toSocketId).emit('call:candidate', {
            fromSocketId: socket.id,
            candidate
        });
    });

    // Video call end
    socket.on('call:end', ({ toSocketId }) => {
        console.log(`[Video Call] End from ${socket.id} to ${toSocketId}`);
        io.to(toSocketId).emit('call:end', {
            fromSocketId: socket.id
        });
    });

    // ===== NEW: Audio Call Handlers =====
    // Audio call offer
    socket.on('audio:offer', ({ toSocketId, offer }) => {
        console.log(`[Audio Call] Offer from ${socket.id} to ${toSocketId}`);
        io.to(toSocketId).emit('audio:offer', {
            fromSocketId: socket.id,
            offer
        });
    });

    // Audio call answer
    socket.on('audio:answer', ({ toSocketId, answer }) => {
        console.log(`[Audio Call] Answer from ${socket.id} to ${toSocketId}`);
        io.to(toSocketId).emit('audio:answer', {
            fromSocketId: socket.id,
            answer
        });
    });

    // Audio call ICE candidate
    socket.on('audio:candidate', ({ toSocketId, candidate }) => {
        console.log(`[Audio Call] Candidate from ${socket.id} to ${toSocketId}`);
        io.to(toSocketId).emit('audio:candidate', {
            fromSocketId: socket.id,
            candidate
        });
    });

    // Audio call end
    socket.on('audio:end', ({ toSocketId }) => {
        console.log(`[Audio Call] End from ${socket.id} to ${toSocketId}`);
        io.to(toSocketId).emit('audio:end', {
            fromSocketId: socket.id
        });
    });
};
