const ChatCallDetails = require('../models/ChatCallDetails');
const User = require('../models/User');
const AstrologerProfile = require('../models/AstrologerProfile');
const mongoose = require('mongoose');

/**
 * POST /api/chatcallrequest
 * Store chat call request details
 */
exports.createChatCallRequest = async (req, res) => {
    try {
        const { userId, astrologerId, sessionId, initiatedAt } = req.body;

        // Validate required fields
        if (!userId || !astrologerId || !sessionId) {
            return res.status(400).json({ msg: 'Missing required fields: userId, astrologerId, sessionId' });
        }

        // Check if session already exists
        const existingSession = await ChatCallDetails.findOne({ sessionId });
        if (existingSession) {
            return res.status(400).json({ msg: 'Session already exists' });
        }

        // Get astrologer's rate
        let ratePerMinute = 0;
        const astrologerProfile = await AstrologerProfile.findOne({ userId: astrologerId });
        if (astrologerProfile && astrologerProfile.ratePerMinute) {
            ratePerMinute = astrologerProfile.ratePerMinute;
        }

        // Create new chat call request
        const chatCallDetails = new ChatCallDetails({
            userId,
            astrologerId,
            sessionId,
            initiatedAt: initiatedAt || new Date(),
            status: 'requested',
            ratePerMinute
        });

        await chatCallDetails.save();

        res.status(201).json({
            success: true,
            msg: 'Chat call request created successfully',
            data: chatCallDetails
        });
    } catch (err) {
        console.error('Error creating chat call request:', err);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
};

/**
 * GET /api/chatcallrequest
 * Get chat call requests (filtered by user role)
 */
exports.getChatCallRequests = async (req, res) => {
    try {
        const { status, sessionId } = req.query;
        const userId = req.user.id;
        const userRole = req.user.role;

        console.log('[DEBUG] getChatCallRequests - userId:', userId, 'role:', userRole);

        let query = {};

        // If sessionId is provided, return that specific session
        if (sessionId) {
            const session = await ChatCallDetails.findOne({ sessionId })
                .populate('userId', 'name email phone')
                .populate('astrologerId', 'name email phone');

            if (!session) {
                return res.status(404).json({ msg: 'Session not found' });
            }
            return res.json(session);
        }

        // Filter based on user role (case-insensitive)
        const role = userRole ? userRole.toLowerCase() : '';

        if (role === 'astrologer') {
            // Ensure we're querying with ObjectId if possible
            query.astrologerId = mongoose.Types.ObjectId.isValid(userId)
                ? new mongoose.Types.ObjectId(userId)
                : userId;
        } else if (role === 'client') {
            query.userId = mongoose.Types.ObjectId.isValid(userId)
                ? new mongoose.Types.ObjectId(userId)
                : userId;
        }
        // Admin can see all requests (no filter)

        // Filter by status if provided
        if (status) {
            query.status = status;
        }

        console.log('[DEBUG] getChatCallRequests - query:', JSON.stringify(query));

        const chatCallRequests = await ChatCallDetails.find(query)
            .populate('userId', 'name email phone')
            .populate('astrologerId', 'name email phone')
            .sort({ createdAt: -1 });

        console.log('[DEBUG] getChatCallRequests - found:', chatCallRequests.length, 'requests');

        // Format response for compatibility with existing code
        const formattedRequests = chatCallRequests.map(request => ({
            sessionId: request.sessionId,
            clientId: request.userId,
            astrologerId: request.astrologerId,
            status: request.status,
            ratePerMinute: request.ratePerMinute,
            createdAt: request.createdAt,
            initiatedAt: request.initiatedAt,
            acceptedAt: request.acceptedAt,
            completedAt: request.completedAt,
            duration: request.duration,
            totalCost: request.totalCost,
            client: {
                id: request.userId?._id,
                name: request.userId?.name,
                email: request.userId?.email
            },
            astrologer: {
                id: request.astrologerId?._id,
                name: request.astrologerId?.name,
                email: request.astrologerId?.email
            }
        }));

        console.log('[DEBUG] getChatCallRequests - returning:', formattedRequests.length, 'formatted requests');

        res.json(formattedRequests);
    } catch (err) {
        console.error('Error fetching chat call requests:', err);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
};

/**
 * PUT /api/chatcallrequest/:sessionId
 * Update chat call request status
 */
exports.updateChatCallRequest = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { status, duration, totalCost } = req.body;

        const chatCallDetails = await ChatCallDetails.findOne({ sessionId });

        if (!chatCallDetails) {
            return res.status(404).json({ msg: 'Chat call request not found' });
        }

        // Update fields
        if (status) {
            chatCallDetails.status = status;

            // Set timestamps based on status
            if (status === 'accepted' && !chatCallDetails.acceptedAt) {
                chatCallDetails.acceptedAt = new Date();
            }
            if (status === 'completed' && !chatCallDetails.completedAt) {
                chatCallDetails.completedAt = new Date();
            }
        }

        if (duration !== undefined) {
            chatCallDetails.duration = duration;
        }

        if (totalCost !== undefined) {
            chatCallDetails.totalCost = totalCost;
        }

        await chatCallDetails.save();

        res.json({
            success: true,
            msg: 'Chat call request updated successfully',
            data: chatCallDetails
        });
    } catch (err) {
        console.error('Error updating chat call request:', err);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
};
