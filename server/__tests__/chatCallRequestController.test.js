const { createChatCallRequest, getChatCallRequests } = require('../controllers/chatCallRequestController');
const ChatCallDetails = require('../models/ChatCallDetails');
const AstrologerProfile = require('../models/AstrologerProfile');
const httpMocks = require('node-mocks-http');
const mongoose = require('mongoose');

jest.mock('../models/ChatCallDetails');
jest.mock('../models/AstrologerProfile');

describe('Chat Call Request Controller', () => {
    let req, res;

    beforeEach(() => {
        req = httpMocks.createRequest();
        res = httpMocks.createResponse();
        jest.clearAllMocks();
    });

    describe('createChatCallRequest', () => {
        it('should return 400 if required fields are missing', async () => {
            req.body = { userId: 'u1' }; // Missing astrologerId, sessionId
            await createChatCallRequest(req, res);
            expect(res.statusCode).toBe(400);
            expect(res._getJSONData().msg).toContain('Missing required fields');
        });

        it('should return 200 (Idempotent) if session already exists', async () => {
            req.body = { userId: 'u1', astrologerId: 'a1', sessionId: 's1' };
            ChatCallDetails.findOne.mockResolvedValue({ sessionId: 's1', status: 'requested' });

            await createChatCallRequest(req, res);

            expect(res.statusCode).toBe(200);
            expect(res._getJSONData().msg).toBe('Session already exists');
        });

        it('should create new request successfully', async () => {
            req.body = { userId: 'u1', astrologerId: 'a1', sessionId: 's1' };
            ChatCallDetails.findOne.mockResolvedValue(null); // No existing session
            AstrologerProfile.findOne.mockResolvedValue({ ratePerMinute: 10 });

            // Mock save
            const mockSave = jest.fn();
            ChatCallDetails.mockImplementation(() => ({
                save: mockSave,
                userId: 'u1',
                astrologerId: 'a1',
                sessionId: 's1',
                ratePerMinute: 10
            }));

            await createChatCallRequest(req, res);

            expect(ChatCallDetails).toHaveBeenCalled();
            expect(mockSave).toHaveBeenCalled();
            expect(res.statusCode).toBe(201);
            expect(res._getJSONData().success).toBe(true);
        });
    });

    describe('getChatCallRequests', () => {
        beforeEach(() => {
            req.user = { id: 'u1', role: 'client' };
        });

        it('should return specific session if sessionId provided', async () => {
            req.query = { sessionId: 's1' };
            const mockSession = { sessionId: 's1' };

            // Mock chain: findOne -> populate -> populate
            const mockPopulate2 = jest.fn().mockResolvedValue(mockSession);
            const mockPopulate1 = jest.fn().mockReturnValue({ populate: mockPopulate2 });
            ChatCallDetails.findOne.mockReturnValue({ populate: mockPopulate1 });

            await getChatCallRequests(req, res);

            expect(res.statusCode).toBe(200);
            expect(res._getJSONData()).toEqual(mockSession);
        });

        it('should return 404 if specific session not found', async () => {
            req.query = { sessionId: 's1' };

            const mockPopulate2 = jest.fn().mockResolvedValue(null);
            const mockPopulate1 = jest.fn().mockReturnValue({ populate: mockPopulate2 });
            ChatCallDetails.findOne.mockReturnValue({ populate: mockPopulate1 });

            await getChatCallRequests(req, res);

            expect(res.statusCode).toBe(404);
        });

        it('should filter by client role correctly', async () => {
            const validId = new mongoose.Types.ObjectId().toString();
            req.user = { id: validId, role: 'client' };

            const mockResults = [{
                sessionId: 's1',
                userId: { _id: validId, name: 'Client' },
                astrologerId: { _id: 'a1', name: 'Astro' },
                status: 'requested'
            }];

            // Mock chain: find -> populate -> populate -> sort
            const mockSort = jest.fn().mockResolvedValue(mockResults);
            const mockPopulate2 = jest.fn().mockReturnValue({ sort: mockSort });
            const mockPopulate1 = jest.fn().mockReturnValue({ populate: mockPopulate2 });
            ChatCallDetails.find.mockReturnValue({ populate: mockPopulate1 });

            await getChatCallRequests(req, res);

            expect(res.statusCode).toBe(200);
            expect(ChatCallDetails.find).toHaveBeenCalled();
            // Verify query structure roughly (hard to verify exact object due to ObjectId logic)
            const callArgs = ChatCallDetails.find.mock.calls[0][0];
            expect(callArgs.$or).toBeDefined(); // Should use $or for robust ID check
        });

        it('should return debug info if no records found', async () => {
            req.user = { id: 'u1', role: 'client' };

            // Mock empty results
            const mockSort = jest.fn().mockResolvedValue([]);
            const mockPopulate2 = jest.fn().mockReturnValue({ sort: mockSort });
            const mockPopulate1 = jest.fn().mockReturnValue({ populate: mockPopulate2 });
            ChatCallDetails.find.mockReturnValue({ populate: mockPopulate1 });

            ChatCallDetails.countDocuments.mockResolvedValue(0);

            await getChatCallRequests(req, res);

            expect(res.statusCode).toBe(200);
            const data = res._getJSONData();
            expect(data.msg).toBe('No records found');
            expect(data.debugInfo).toBeDefined();
            expect(data.debugInfo.yourUserId).toBe('u1');
        });
    });
});
