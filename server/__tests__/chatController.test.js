const { getPendingSessions } = require('../controllers/chatController');
const ChatSession = require('../models/ChatSession');
const AstrologerProfile = require('../models/AstrologerProfile');
const User = require('../models/User');
const mongoose = require('mongoose');
const httpMocks = require('node-mocks-http');

jest.mock('../models/ChatSession');
jest.mock('../models/AstrologerProfile');
jest.mock('../models/User');

describe('Chat Controller - getPendingSessions', () => {
    let req, res;

    beforeEach(() => {
        req = httpMocks.createRequest();
        res = httpMocks.createResponse();
        req.user = { id: '507f1f77bcf86cd799439011' }; // Mock Astrologer ID
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return pending sessions with resolved astrologer names even if profile ID is stored', async () => {
        // 1. Mock Data
        const mockAstrologerId = '507f1f77bcf86cd799439011'; // User ID
        const mockProfileId = '607f1f77bcf86cd799439022'; // Profile ID
        const mockClientId = '707f1f77bcf86cd799439033';

        // Session stored with Profile ID (The Bug Scenario)
        const mockSession = {
            sessionId: 'test-session-1',
            clientId: new mongoose.Types.ObjectId(mockClientId),
            astrologerId: new mongoose.Types.ObjectId(mockProfileId), // Stored as Profile ID
            status: 'requested',
            ratePerMinute: 10,
            createdAt: new Date(),
        };

        // Mock DB Responses
        const mockChain = {
            sort: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue([mockSession])
        };

        // Default mock for any find call
        ChatSession.find.mockReturnValue(mockChain);

        // Specific mocks for different calls if needed, but the above generic chain handles .limit().lean() and .sort().lean()

        // User.find (This will search for clientId and ProfileId in User collection)
        // It will find the Client, but NOT suggest a name for the ProfileId because it's not a User ID
        User.find.mockReturnValue({
            select: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue([
                { _id: mockClientId, name: 'Client Name' }
            ])
        });

        // AstrologerProfile.find (The Fix: Search for Profile ID here)
        AstrologerProfile.find.mockReturnValue({
            populate: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue([
                {
                    _id: mockProfileId,
                    userId: { _id: mockAstrologerId, name: 'Astrologer Name From Profile' }
                }
            ])
        });

        // Additional Mocks for debug counts
        ChatSession.countDocuments.mockResolvedValue(1);

        // 2. Call Controller
        await getPendingSessions(req, res);

        // 3. Verify Response
        const data = res._getJSONData();
        expect(res.statusCode).toBe(200);
        expect(data).toHaveLength(1);
        expect(data[0].astrologer.name).toBe('Astrologer Name From Profile');
    });

    it('should return pending sessions with resolved names using User ID', async () => {
        // 1. Mock Data
        const mockAstrologerId = '507f1f77bcf86cd799439011'; // User ID
        const mockClientId = '707f1f77bcf86cd799439033';

        // Session stored with User ID (The Correct Scenario)
        const mockSession = {
            sessionId: 'test-session-2',
            clientId: new mongoose.Types.ObjectId(mockClientId),
            astrologerId: new mongoose.Types.ObjectId(mockAstrologerId), // Stored as User ID
            status: 'requested',
            ratePerMinute: 10,
            createdAt: new Date(),
        };

        // Mock DB Responses
        const mockChainCallback = {
            sort: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue([mockSession])
        };
        ChatSession.find.mockReturnValue(mockChainCallback);

        // User.find will find both
        User.find.mockReturnValue({
            select: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue([
                { _id: mockClientId, name: 'Client Name' },
                { _id: mockAstrologerId, name: 'Astrologer User Name' }
            ])
        });

        // AstrologerProfile.find will find nothing relevant or empty
        AstrologerProfile.find.mockReturnValue({
            populate: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue([])
        });

        ChatSession.countDocuments.mockResolvedValue(1);

        // 2. Call Controller
        await getPendingSessions(req, res);

        // 3. Verify Response
        const data = res._getJSONData();
        expect(res.statusCode).toBe(200);
        expect(data[0].astrologer.name).toBe('Astrologer User Name');
    });
});
