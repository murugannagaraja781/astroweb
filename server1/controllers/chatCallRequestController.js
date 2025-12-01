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

        // Check if session already exists - IDEMPOTENT BEHAVIOR
        const existingSession = await ChatCallDetails.findOne({ sessionId });
        if (existingSession) {
            // Instead of error, return the existing session
            return res.status(200).json({
                success: true,
                msg: 'Session already exists',
                data: existingSession
            });
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

        console.log('------------------------------------------------');
        console.log('[DEBUG] API Request: GET /api/chatcallrequest');
        console.log('[DEBUG] User ID from Token:', userId, 'Type:', typeof userId);
        console.log('[DEBUG] User Role from Token:', userRole);
        console.log('[DEBUG] Query Params:', req.query);

        // 1. Handle Session ID specific query
        if (sessionId) {
            const session = await ChatCallDetails.findOne({ sessionId })
                .populate('userId', 'name email phone')
                .populate('astrologerId', 'name email phone');

            if (!session) return res.status(404).json({ msg: 'Session not found' });
            return res.json(session);
        }

        // 2. DEBUG MODE: Return everything if requested
        if (req.query.debug === 'true') {
            console.log('[DEBUG] Debug mode: Returning ALL records');
            const all = await ChatCallDetails.find({}).sort({ createdAt: -1 });
            return res.json(all);
        }

        // 3. Build Query based on Role
        let query = {};
        const role = userRole ? userRole.toLowerCase() : '';

        // CHECK: If all=true is passed, bypass role filtering (Show ALL data)
        if (req.query.all === 'true') {
            console.log('[DEBUG] "all=true" requested - Bypassing role filter');
            // No role filter applied
        }
        else if (role === 'astrologer') {
            // Prepare ID versions (String and ObjectId)
            const idString = String(userId);
            let idObject = null;
            try {
                if (mongoose.Types.ObjectId.isValid(userId)) {
                    idObject = new mongoose.Types.ObjectId(userId);
                }
            } catch (e) { console.error('ObjectId conversion error:', e); }

            console.log('[DEBUG] ID String:', idString);
            console.log('[DEBUG] ID Object:', idObject);

            // Match EITHER ObjectId OR String version of ID
            if (idObject) {
                query.$or = [
                    { astrologerId: idObject },
                    { astrologerId: idString }
                ];
            } else {
                query.astrologerId = idString;
            }
        } else if (role === 'client') {
            // Prepare ID versions (String and ObjectId)
            const idString = String(userId);
            let idObject = null;
            try {
                if (mongoose.Types.ObjectId.isValid(userId)) {
                    idObject = new mongoose.Types.ObjectId(userId);
                }
            } catch (e) { console.error('ObjectId conversion error:', e); }

            if (idObject) {
                query.$or = [
                    { userId: idObject },
                    { userId: idString }
                ];
            } else {
                query.userId = idString;
            }
        } else if (role === 'admin') {
            // Admin sees all, no ID filter needed
            console.log('[DEBUG] Admin role detected, no ID filter applied');
        } else {
            // Default: If not admin/astro/client and no 'all=true', show nothing?
            // Or maybe show nothing for safety.
            console.log('[DEBUG] Unknown role and no all=true, returning empty');
            return res.json([]);
        }

        // 4. Apply Status Filter
        if (status) {
            // If we already have an $or query, we must wrap it in an $and
            if (query.$or) {
                query = {
                    $and: [
                        { $or: query.$or },
                        { status: status }
                    ]
                };
            } else {
                query.status = status;
            }
        }

        console.log('[DEBUG] Final MongoDB Query:', JSON.stringify(query, null, 2));

        // 5. Execute Query
        const results = await ChatCallDetails.find(query)
            .populate('userId', 'name email phone')
            .populate('astrologerId', 'name email phone')
            .sort({ createdAt: -1 });

        console.log('[DEBUG] Records Found:', results.length);

        // 6. Format Response
        const formatted = results.map(r => ({
            sessionId: r.sessionId,
            clientId: r.userId,
            astrologerId: r.astrologerId,
            status: r.status,
            ratePerMinute: r.ratePerMinute,
            createdAt: r.createdAt,
            initiatedAt: r.initiatedAt,
            acceptedAt: r.acceptedAt,
            completedAt: r.completedAt,
            duration: r.duration,
            totalCost: r.totalCost,
            client: {
                id: r.userId?._id,
                name: r.userId?.name,
                email: r.userId?.email
            },
            astrologer: {
                id: r.astrologerId?._id,
                name: r.astrologerId?.name,
                email: r.astrologerId?.email
            }
        }));

        // IF EMPTY: Return debug info to help user diagnose
        if (formatted.length === 0) {
            console.log('[DEBUG] No records found. Returning debug info.');
            // Check if any records exist at all for this user (ignoring status)
            const anyForUser = await ChatCallDetails.countDocuments(query);

            // Check total records in DB
            const totalInDb = await ChatCallDetails.countDocuments({});

            return res.json({
                msg: "No records found",
                debugInfo: {
                    yourUserId: userId,
                    yourRole: userRole,
                    queryUsed: query,
                    totalRecordsInDb: totalInDb,
                    recordsMatchingYourQuery: anyForUser,
                    tip: "Check if 'yourUserId' matches the 'astrologerId' or 'userId' in your database records."
                },
                data: []
            });
        }

        res.json(formatted);
        console.log('------------------------------------------------');

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
